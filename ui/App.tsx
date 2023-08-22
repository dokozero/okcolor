import { render } from "preact";
import { signal } from "@preact/signals";
import { useRef, useEffect } from "preact/hooks";

import RelativeChroma from "./components/RelativeChroma";
import CssColorCodes from "./components/CssColorCodes";

import { formatHex, formatHex8, converter, inGamut, clampChromaInGamut } from "./helpers/culori.mjs";
import * as twgl from "twgl.js";

import { colorConversion } from "./helpers/colorConversion";
import {
  PICKER_SIZE,
  SLIDER_SIZE,
  RES_PICKER_SIZE_OKHSLV,
  RES_PICKER_SIZE_OKLCH,
  RES_PICKER_FACTOR_OKHSLV,
  RES_PICKER_FACTOR_OKLCH,
  OKLCH_CHROMA_SCALE,
  OKLCH_RGB_BOUNDARY_COLOR,
  debugMode
} from "./constants";

import { UiMessageTexts } from "./ui-messages";
import { clampNumber, limitMouseHandlerValue, is2DMovementMoreVerticalOrHorizontal, roundWithDecimal, isColorCodeInGoodFormat, getRelativeChroma } from "./helpers/others";

import utilsGlsl from "@virtual:shaders/ui/shaders/utils.glsl";
import libraryGlsl from "@virtual:shaders/ui/shaders/library.glsl";
import fShader from "@virtual:shaders/ui/shaders/f_shader.glsl";
import vShader from "@virtual:shaders/ui/shaders/v_shader.glsl";


const inGamutSrgb = inGamut("rgb");
const inGamutP3 = inGamut("p3");
const convertToRgb = converter("rgb");

const opacitysliderBackgroundImg = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAwIAAABUCAYAAAAxg4DPAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAJMSURBVHgB7dlBbQNAEATBcxQky5+Sl4pjAHmdLPnRVQTm3ZrH8/l8nQszc27s7rlhz549e/bs2bNnz569z+39HAAAIEcIAABAkBAAAIAgIQAAAEFCAAAAgoQAAAAECQEAAAgSAgAAECQEAAAgSAgAAECQEAAAgCAhAAAAQUIAAACCHq+3c2F3z42ZOTfs2bNnz549e/bs2bP3uT2PAAAABAkBAAAIEgIAABAkBAAAIEgIAABAkBAAAIAgIQAAAEFCAAAAgoQAAAAECQEAAAgSAgAAECQEAAAgSAgAAEDQ7+6eGzNzbtizZ8+ePXv27NmzZ+/7ex4BAAAIEgIAABAkBAAAIEgIAABAkBAAAIAgIQAAAEFCAAAAgoQAAAAECQEAAAgSAgAAECQEAAAgSAgAAECQEAAAgKDH6+1c2N1zY2bODXv27NmzZ+8/9uzZs2fvbs8jAAAAQUIAAACChAAAAAQJAQAACBICAAAQJAQAACBICAAAQJAQAACAICEAAABBQgAAAIKEAAAABAkBAAAIEgIAABD0u7vnxsycG/bs2bNnz549e/bs2fv+nkcAAACChAAAAAQJAQAACBICAAAQJAQAACBICAAAQJAQAACAICEAAABBQgAAAIKEAAAABAkBAAAIEgIAABAkBAAAIOjxejsXdvfcmJlzw549e/bs2bNnz549e5/b8wgAAECQEAAAgCAhAAAAQUIAAACChAAAAAQJAQAACBICAAAQJAQAACBICAAAQJAQAACAICEAAABBQgAAAIKEAAAABP0BZxb7duWmOFoAAAAASUVORK5CYII=";

const okhxyValues = {
  hue: signal(0),
  x: signal(0),
  y: signal(0),
};

const showCssColorCodes = signal<boolean | undefined>(undefined);
const showRelativeChroma = signal<boolean | undefined>(undefined);
const relativeChroma = signal<string>("");
const lockRelativeChroma = signal<boolean | undefined>(undefined);

const opacitySliderStyle = signal("");

type RgbaColor = [number, number, number, number];

interface ShapeInfos {
  hasFillStroke: {
    fill: boolean;
    stroke: boolean;
  };
  colors: {
    [key: string]: { rgba: RgbaColor; }
  };
}

let shapeInfos: ShapeInfos = {
  hasFillStroke: {
    fill: false,
    stroke: false
  },
  colors: {
    fill: {
      rgba: [255, 255, 255, 0]
    },
    stroke: {
      rgba: [255, 255, 255, 0]
    }
  }
}

let colorPickerGlContext: WebGL2RenderingContext | null = null;
let bufferInfo: twgl.BufferInfo;
let programInfo: twgl.ProgramInfo;

let UiMessageOn = false;

// We use "rgb" and not "srgb" because Culori use it like this, even if it's confusing because rgb is a color model.
let fileColorProfile: "rgb" | "p3";

// We need this variable only to check if the value of an input has been changed on blur, see colorCodesInputHandler();
let colorCodesInputValues = {
  currentColorModel: "",
  color: "",
  rgba: "",
  hex: ""
}

enum ColorModels {
  "oklchCss",
  "oklch",
  "okhsl",
  "okhsv"
}

// Default choice unless selected shape on launch has no fill.
let currentFillOrStroke = "fill";
let currentColorModel: keyof typeof ColorModels;
let activeMouseHandler: Function | undefined;

// This var is to let user move the manipulators outside of their zone, if not the event of the others manipulator will trigger if keep the mousedown and go to other zones.
let mouseHandlerEventTargetId = "";

let mouseInsideDocument: boolean;

let shiftKeyPressed = false;
let ctrlKeyPressed = false;

let prevCanvasX: number | undefined;
let prevCanvasY: number | undefined;

let moveVerticallyOnly = false;
let moveHorizontallyOnly = false;

export const App = function() {
  if (debugMode) { console.log("UI: render App"); }
  
  useEffect(() => {
    colorPickerGlContext = colorPickerCanvas.current!.getContext("webgl2");
    const gl = colorPickerGlContext!;
    const arrays = {
      position: [-1, -1, 0, 1, -1, 0, -1, 1, 0, -1, 1, 0, 1, -1, 0, 1, 1, 0]
    }

    bufferInfo = twgl.createBufferInfoFromArrays(gl, arrays);
    programInfo = twgl.createProgramInfo(gl, [
      vShader,
      libraryGlsl + utilsGlsl + fShader
    ]);

    gl.useProgram(programInfo.program);
    twgl.setBuffersAndAttributes(gl, programInfo, bufferInfo);

    // We launch the init procedure from the plugin (send some values and the color shape if any is selected) when the UI is ready.
    parent.postMessage({ pluginMessage: { type: "init"} }, "*");
  }, []);

  const fillOrStrokeSelector = useRef<HTMLDivElement>(null);
  const fillOrStrokeSelector_fill = useRef<SVGCircleElement>(null);
  const fillOrStrokeSelector_stroke = useRef<SVGPathElement>(null);
  const colorPickerUiMessage = useRef<HTMLDivElement>(null);
  const colorPickerCanvas = useRef<HTMLCanvasElement>(null);
  const hueSlider = useRef<HTMLDivElement>(null);
  const opacitySlider = useRef<HTMLDivElement>(null);
  const manipulatorColorPicker = useRef<SVGGElement>(null);
  const manipulatorHueSlider = useRef<SVGSVGElement>(null);
  const manipulatorOpacitySlider = useRef<SVGSVGElement>(null);
  const hueInput = useRef<HTMLInputElement>(null);
  const xInput = useRef<HTMLInputElement>(null);
  const yInput = useRef<HTMLInputElement>(null);
  const opacityInput = useRef<HTMLInputElement>(null);
  const fileColorProfileGroup = useRef<HTMLDivElement>(null);
  const fileColorProfileSelect = useRef<HTMLSelectElement>(null);
  const colorModelSelect = useRef<HTMLSelectElement>(null);
  const colorSpaceOfCurrentColor = useRef<HTMLDivElement>(null);
  const srgbBoundary = useRef<SVGPathElement>(null);
  const relativeChromaStroke = useRef<SVGPathElement>(null);

  const colorCode_currentColorModelInput = useRef<HTMLInputElement>(null);
  const colorCode_colorInput = useRef<HTMLInputElement>(null);
  const colorCode_rgbaInput = useRef<HTMLInputElement>(null);
  const colorCode_hexInput = useRef<HTMLInputElement>(null);



  /*
  ** HELPER FUNCTIONS
  */

  const shapeInfosResetDefault = function() {
    if (debugMode) { console.log("UI: shapeInfosResetDefault()"); }

    shapeInfos.hasFillStroke.fill = true,
    shapeInfos.hasFillStroke.stroke = true,
    shapeInfos.colors.fill.rgba = [255, 255, 255, 0],
    shapeInfos.colors.stroke.rgba = [255, 255, 255, 0]
  };


  
  /* 
  ** UPDATES TO UI
  */

  const updateColorInputsPosition = function() {
    if (currentColorModel === "oklchCss") {
      hueInput.current!.classList.add("u-order-2");
      hueInput.current!.tabIndex = 3;

      xInput.current!.classList.add("u-order-1");
      xInput.current!.tabIndex = 2;

      yInput.current!.classList.add("u-order-0");
      yInput.current!.tabIndex = 1;

      opacityInput.current!.classList.add("u-order-3");
    } 
    else {
      hueInput.current!.classList.remove("u-order-2");
      hueInput.current!.tabIndex = 1;
      
      xInput.current!.classList.remove("u-order-1");
      xInput.current!.tabIndex = 2;
      
      yInput.current!.classList.remove("u-order-0");
      yInput.current!.tabIndex = 3;

      opacityInput.current!.classList.remove("u-order-3");
    }
  };

  const scaleColorPickerCanvas = function() {
    if (debugMode) { console.log("UI: scaleColorPickerCanvas()"); }

    if (currentColorModel === "oklch" || currentColorModel === "oklchCss") {
      colorPickerCanvas.current!.style.transform = `scale(${RES_PICKER_FACTOR_OKLCH})`;
      colorPickerCanvas.current!.width = RES_PICKER_SIZE_OKLCH;
      colorPickerCanvas.current!.height = RES_PICKER_SIZE_OKLCH;
    }
    else {
      colorPickerCanvas.current!.style.transform = `scale(${RES_PICKER_FACTOR_OKHSLV})`;
      colorPickerCanvas.current!.width = RES_PICKER_SIZE_OKHSLV;
      colorPickerCanvas.current!.height = RES_PICKER_SIZE_OKHSLV;
    }
  };

  const clampOkhxyValuesChroma = function() {
    if (debugMode) { console.log("UI: clampOkhxyValuesChroma()"); }

    const chroma = currentColorModel === "oklch" ? okhxyValues.x.value/100 : okhxyValues.x.value;

    const clamped = clampChromaInGamut({ mode: "oklch", l: okhxyValues.y.value/100, c: chroma, h: okhxyValues.hue.value }, "oklch", fileColorProfile);

    // If we send a pure black to clampChromaInGamut (l and c to 0), clamped.c will be undefined.
    if (!clamped.c) {
      okhxyValues.x.value = 0;
    }
    else if (chroma > clamped.c) {
      if (currentColorModel === "oklch") {
        okhxyValues.x.value = roundWithDecimal(clamped.c*100, 1);
      }
      else {
        okhxyValues.x.value = roundWithDecimal(clamped.c, 3);
      }
    }
  };

  const UiMessage = {
    hide() {
      if (debugMode) { console.log("UI: UiMessage.hide()"); }

      UiMessageOn = false;

      document.body.classList.remove("deactivated");
      colorPickerCanvas.current!.classList.remove("u-display-none");
      manipulatorColorPicker.current!.classList.remove("u-display-none");
      colorPickerUiMessage.current!.classList.add("u-display-none");
    },
    show(messageCode: string, nodeType: string) {
      if (debugMode) { console.log(`UI: UiMessage.show(${messageCode}, ${nodeType})`); }

      UiMessageOn = true;

      resetInterface();

      document.body.classList.add("deactivated");
      colorPickerCanvas.current!.classList.add("u-display-none");
      manipulatorColorPicker.current!.classList.add("u-display-none");
      colorPickerUiMessage.current!.classList.remove("u-display-none");

      if (currentColorModel === "oklch" || currentColorModel === "oklchCss") {
        colorSpaceOfCurrentColor.current!.classList.add("u-display-none");
      }

      let message: string = UiMessageTexts[messageCode];
      if (nodeType !== "") {
        message = message.replace("$SHAPE", nodeType.toLowerCase());
      }
      colorPickerUiMessage.current!.children[0].innerHTML = message;
    }
  };

  // We use a function to update the opacity value in the input because we need to add the "%" sign and doing it directly in the value field with a signal value doesn't work.
  const updateOpacityValue = function(newValue: number) {
    if (debugMode) { console.log(`UI: updateOpacityValue(${newValue})`); }

    shapeInfos.colors[currentFillOrStroke].rgba[3] = newValue;
    opacityInput.current!.value = `${newValue}%`;
  };

  const updateRelativeChromaValue = function() {
    if (debugMode) { console.log("UI: updateRelativeChromaValue()"); }

    if (currentColorModel !== "oklch" && currentColorModel !== "oklchCss") { return; }

    let newValue: number;

    // We do this test because with a lightness of 0, we get an undefined value for currentMaxChroma.c
    if (okhxyValues.y.value > 0 && okhxyValues.y.value < 100) {
      newValue = getRelativeChroma({
        currentOklchColor: { l: okhxyValues.y.value, c: okhxyValues.x.value, h: okhxyValues.hue.value },
        currentColorModel: currentColorModel,
        fileColorProfile: fileColorProfile,
        targetValueNeeded: "percentage",
      });
    }
    else {
      newValue = 0;
    }

    relativeChroma.value = `${newValue}%`;
  };

  const switchFillOrStrokeSelector = function() {
    if (debugMode) { console.log("UI: switchFillOrStrokeSelector()"); }
    
    currentFillOrStroke = currentFillOrStroke === "fill" ? "stroke" : "fill";
    fillOrStrokeSelector.current!.setAttribute("data-active", currentFillOrStroke);
  };

  const updateOkhxyValuesFromCurrentRgba = function() {
    if (debugMode) { console.log("UI: updateOkhxyValuesFromCurrentRgba()"); }

    let shapeColor = shapeInfos.colors[currentFillOrStroke].rgba.slice(0, 3);
    
    const newOkhxy = colorConversion("rgb", currentColorModel, shapeColor[0], shapeColor[1], shapeColor[2], fileColorProfile);

    // We have to update these values before updating them with the real value to handle this case: because Preact signals doesn't update if we give them the same value they already have, if user change the value on input, for example the hue from 100 to 50, doesn't validate it (like pressing "Enter") then select another shape, if this new one had also a hue of 100 the hue input will show "50" and not 100. By doing this simple increment we ensure that this case will not happen.
    okhxyValues.hue.value++;
    okhxyValues.x.value++;
    okhxyValues.y.value++;
    
    okhxyValues.hue.value = newOkhxy[0];
    okhxyValues.x.value = newOkhxy[1];
    okhxyValues.y.value = newOkhxy[2];
  };

  const updateCurrentRgbaFromOkhxyValues = function() {
    if (debugMode) { console.log("UI: updateCurrentRgbaFromOkhxyValues()"); }

    const chroma = currentColorModel === "oklchCss" ? okhxyValues.x.value*100 : okhxyValues.x.value;

    let newRgb = colorConversion(currentColorModel, "rgb", okhxyValues.hue.value, chroma, okhxyValues.y.value, fileColorProfile);
    shapeInfos.colors[currentFillOrStroke].rgba = [...newRgb, shapeInfos.colors[currentFillOrStroke].rgba[3]];
  };

  const updateColorCodeInputs = function(){
    if (debugMode) { console.log("UI: updateColorCodeInputs()"); }

    let clamped;
    let rgbSrgb;
    let rgbP3;
    
    const chroma = currentColorModel === "oklch" ? okhxyValues.x.value/100 : okhxyValues.x.value;

    // We don't clamp chroma with the models that don't use it because they already work in sRGB.
    if (currentColorModel === "oklch" || currentColorModel === "oklchCss") {
      clamped = clampChromaInGamut({ mode: "oklch", l: okhxyValues.y.value/100, c: chroma, h: okhxyValues.hue.value }, "oklch", "rgb");
      rgbSrgb = colorConversion(currentColorModel, "rgb", clamped.h, clamped.c*100, clamped.l*100, "rgb");
      rgbP3 = colorConversion(currentColorModel, "rgb", okhxyValues.hue.value, chroma*100, okhxyValues.y.value, "p3");
    }
    else {
      rgbSrgb = colorConversion(currentColorModel, "rgb", okhxyValues.hue.value, okhxyValues.x.value, okhxyValues.y.value, "rgb");
    }

    const opacity = shapeInfos.colors[currentFillOrStroke].rgba[3]/100;

    if (currentColorModel === "oklch" || currentColorModel === "oklchCss") {
      colorCode_currentColorModelInput.current!.value = `oklch(${okhxyValues.y.value}% ${roundWithDecimal(chroma, 6)} ${okhxyValues.hue}` + (opacity !== 1 ? ` / ${opacity})` : ")");
    }
    else if (currentColorModel === "okhsl") {
      colorCode_currentColorModelInput.current!.value = `{mode: "okhsl", h: ${okhxyValues.hue.value}, s: ${okhxyValues.x.value}, l: ${okhxyValues.y.value}}`;
    }
    else if (currentColorModel === "okhsv") {
      colorCode_currentColorModelInput.current!.value = `{mode: "okhsv", h: ${okhxyValues.hue.value}, s: ${okhxyValues.x.value}, v: ${okhxyValues.y.value}}`;
    }

    if (currentColorModel === "oklch" || currentColorModel === "oklchCss") {
      colorCode_colorInput.current!.value = `color(display-p3 ${roundWithDecimal(rgbP3![0]/255, 3)} ${roundWithDecimal(rgbP3![1]/255, 3)} ${roundWithDecimal(rgbP3![2]/255, 3)}` + (opacity !== 1 ? ` / ${opacity})` : ")");
    }
    else {
      colorCode_colorInput.current!.value = `color(srgb ${roundWithDecimal(rgbSrgb[0]/255, 3)} ${roundWithDecimal(rgbSrgb[1]/255, 3)} ${roundWithDecimal(rgbSrgb[2]/255, 3)}` + (opacity !== 1 ? ` / ${opacity})` : ")");
    }

    colorCode_rgbaInput.current!.value = `rgba(${roundWithDecimal(rgbSrgb[0], 0)}, ${roundWithDecimal(rgbSrgb[1], 0)}, ${roundWithDecimal(rgbSrgb[2], 0)}, ${opacity})`;

    if (opacity !== 1) {
      colorCode_hexInput.current!.value = formatHex8(`rgba(${roundWithDecimal(rgbSrgb[0], 0)}, ${roundWithDecimal(rgbSrgb[1], 0)}, ${roundWithDecimal(rgbSrgb[2], 0)}, ${opacity})`).toUpperCase();
    }
    else {
      colorCode_hexInput.current!.value = formatHex(`rgb(${roundWithDecimal(rgbSrgb[0], 0)}, ${roundWithDecimal(rgbSrgb[1], 0)}, ${roundWithDecimal(rgbSrgb[2], 0)})`).toUpperCase();
    }

    colorCodesInputValues.currentColorModel = colorCode_currentColorModelInput.current!.value;
    colorCodesInputValues.color = colorCode_colorInput.current!.value;
    colorCodesInputValues.rgba = colorCode_rgbaInput.current!.value;
    colorCodesInputValues.hex = colorCode_hexInput.current!.value;    
  };

  const updateColorSpaceLabelInColorPicker = function() {
    if (debugMode) { console.log("UI: updateColorSpaceLabelInColorPicker()"); }
    
    if (currentColorModel === "oklch" || currentColorModel === "oklchCss") {
      colorSpaceOfCurrentColor.current!.classList.remove("u-display-none");

      const chroma = currentColorModel === "oklch" ? okhxyValues.x.value/100 : okhxyValues.x.value-0.001;

      if (inGamutSrgb(`oklch(${okhxyValues.y.value/100} ${chroma} ${okhxyValues.hue.value})`)) {
        colorSpaceOfCurrentColor.current!.innerHTML = "sRGB";
      }
      else if (inGamutP3(`oklch(${okhxyValues.y.value/100} ${chroma} ${okhxyValues.hue.value})`) && fileColorProfile === "p3") {
        colorSpaceOfCurrentColor.current!.innerHTML = "P3";
      }
    }
    else {
      colorSpaceOfCurrentColor.current!.classList.add("u-display-none");
    }
  };

  const render = {
    colorPickerCanvas() {
      if (debugMode) { console.log("UI: render.colorPickerCanvas()"); }

      // show separator
      if (fileColorProfile === "p3") {
        let d = "M0 0 ";

        const precision = 0.75;
        // Precision 0.5 to reduce the load; the rest will be rendered by the browser itself.
        // It gives a slightly skewed angle at hue 0 and 360; it can be slightly increased
        for (let l = 0; l < PICKER_SIZE; l += 1 / precision) {
          const lumen = (PICKER_SIZE - l) / PICKER_SIZE;
          const sRGBMaxChroma = clampChromaInGamut({
            mode: "oklch",
            l: lumen,
            c: 0.37,
            h: okhxyValues.hue.value
          }, "oklch", "rgb");
          d += `L${(sRGBMaxChroma.c * PICKER_SIZE * OKLCH_CHROMA_SCALE).toFixed(2)} ${l} `;
        }

        srgbBoundary.current!.setAttribute("d", d);
      }
      else {
        srgbBoundary.current!.setAttribute("d", "");
      }

      if (lockRelativeChroma.value) {
        let d = "M0 0 ";

        const precision = 0.75;

        for (let l = 0; l < PICKER_SIZE; l += 1 / precision) {
          const lumen = (PICKER_SIZE - l) / PICKER_SIZE;
          const maxChromaCurrentProfil = clampChromaInGamut({
            mode: "oklch",
            l: lumen,
            c: 0.37,
            h: okhxyValues.hue.value
          }, "oklch", fileColorProfile);
          d += `L${((maxChromaCurrentProfil.c * (parseInt(relativeChroma.value)/100)) * PICKER_SIZE * OKLCH_CHROMA_SCALE).toFixed(2)} ${l} `;
        }

        relativeChromaStroke.current!.setAttribute("d", d);
      }
      else {
        relativeChromaStroke.current!.setAttribute("d", "");
      }


      let dark = document.documentElement.classList.contains("figma-dark");

      const gl = colorPickerGlContext!;
      const isLch = ["oklch", "oklchCss"].includes(currentColorModel);
      const size = isLch ? RES_PICKER_SIZE_OKLCH : RES_PICKER_SIZE_OKHSLV;

      gl.viewport(0, 0, size, size);
      gl.drawingBufferColorSpace = fileColorProfile === "p3" ? "display-p3" : "srgb";
      gl.clearColor(0, 0, 0, 1);
      gl.clear(gl.COLOR_BUFFER_BIT);
      twgl.setUniforms(programInfo, {
        resolution: [size, size],
        dark,
        chroma_scale: OKLCH_CHROMA_SCALE,
        showP3: fileColorProfile === "p3",
        mode: ColorModels[currentColorModel],
        hue_rad: okhxyValues.hue.value * Math.PI / 180,
      });
      twgl.drawBufferInfo(gl, bufferInfo);
    },
    fillOrStrokeSelector() {
      if (debugMode) { console.log("UI: render.fillOrStrokeSelector()"); }

      if (shapeInfos.hasFillStroke.fill && shapeInfos.hasFillStroke.stroke) {
        fillOrStrokeSelector.current!.classList.remove("u-pointer-events-none");
      }
      else {
        fillOrStrokeSelector.current!.classList.add("u-pointer-events-none");
      }
      
      fillOrStrokeSelector.current!.setAttribute("data-has-fill", shapeInfos.hasFillStroke.fill.toString());
      fillOrStrokeSelector.current!.setAttribute("data-has-stroke", shapeInfos.hasFillStroke.stroke.toString());
  
      fillOrStrokeSelector_fill.current!.setAttribute("fill", shapeInfos.hasFillStroke.fill ? `rgb(${shapeInfos.colors.fill.rgba[0]}, ${shapeInfos.colors.fill.rgba[1]}, ${shapeInfos.colors.fill.rgba[2]})` : "none");
      fillOrStrokeSelector_stroke.current!.setAttribute("fill", shapeInfos.hasFillStroke.stroke ? `rgb(${shapeInfos.colors.stroke.rgba[0]}, ${shapeInfos.colors.stroke.rgba[1]}, ${shapeInfos.colors.stroke.rgba[2]})` : "none");
    },
    opacitySliderCanvas() {
      if (debugMode) { console.log("UI: render.opacitySliderCanvas()"); }

      opacitySliderStyle.value = `background-image: linear-gradient(to right, rgba(255, 255, 255, 0), rgba(${shapeInfos.colors[currentFillOrStroke].rgba[0]}, ${shapeInfos.colors[currentFillOrStroke].rgba[1]}, ${shapeInfos.colors[currentFillOrStroke].rgba[2]}, 1) 90%), url(${opacitysliderBackgroundImg})`;
    },
    all() {
      if (debugMode) { console.log("UI: render.all()"); }

      this.colorPickerCanvas();
      this.fillOrStrokeSelector();
      this.opacitySliderCanvas();
    }
  };

  const updateManipulatorPositions = {
    colorPicker() {
      if (debugMode) { console.log("UI: updateManipulatorPositions.colorPicker()"); }

      let x = currentColorModel === "oklchCss" ? okhxyValues.x.value : okhxyValues.x.value / 100;
      let y = okhxyValues.y.value / 100;

      if (currentColorModel === "oklch" || currentColorModel === "oklchCss") {
        x *= OKLCH_CHROMA_SCALE;
      }

      manipulatorColorPicker.current!.transform.baseVal.getItem(0).setTranslate(PICKER_SIZE*x, PICKER_SIZE*(1-y));
    },
    hueSlider() {
      if (debugMode) { console.log("UI: updateManipulatorPositions.hueSlider()"); }

      let hue = okhxyValues.hue.value / 360;
      manipulatorHueSlider.current!.transform.baseVal.getItem(0).setTranslate((SLIDER_SIZE*hue)-1, -1);
    },
    opacitySlider() {
      if (debugMode) { console.log("UI: updateManipulatorPositions.opacitySlider()"); }

      let opacity = shapeInfos.colors[currentFillOrStroke].rgba[3] / 100;
      manipulatorOpacitySlider.current!.transform.baseVal.getItem(0).setTranslate((SLIDER_SIZE*opacity)-1, -1);
    },
    all() {
      if (debugMode) { console.log("UI: updateManipulatorPositions.all()"); }

      this.colorPicker();
      this.hueSlider();
      this.opacitySlider();
    }
  };

  const resetInterface = function() {
    if (debugMode) { console.log("UI: resetInterface()"); }

    // We have to update these values before reseting them to 0 to handle this case: because Preact signals doesn't update if we give them the same value they already have, if user select a shape with an input valu already to 0 like saturation (x), change it to another value like 10, doesn't validate it (like pressing "Enter"), then unselect the shape, the input will keep the "10" and not update to "0". By doing this simple increment we ensure that this case will not happen.
    okhxyValues.hue.value++;
    okhxyValues.x.value++;
    okhxyValues.y.value++;

    okhxyValues.hue.value = 0;
    okhxyValues.x.value = 0;
    okhxyValues.y.value = 0;

    if (currentColorModel === "oklch" || currentColorModel === "oklchCss") {
      colorCode_currentColorModelInput.current!.value = "oklch(0 0 0)";
    }
    else if (currentColorModel === "okhsl") {
      colorCode_currentColorModelInput.current!.value = "h: 0, s: 0, l: 0";
    }
    else if (currentColorModel === "okhsv") {
      colorCode_currentColorModelInput.current!.value = "h: 0, s: 0, v: 0";
    }

    if (currentColorModel === "oklch" || currentColorModel === "oklchCss") {
      colorCode_colorInput.current!.value = "color(display-p3 0 0 0)";
    }
    else {
      colorCode_colorInput.current!.value = "color(srgb 0 0 0)";
    }

    colorCode_rgbaInput.current!.value = "rgba(0, 0, 0, 0)";
    colorCode_hexInput.current!.value = "#000000";

    relativeChroma.value = "0%";

    updateOpacityValue(0);
    shapeInfosResetDefault();

    fillOrStrokeSelector.current!.setAttribute("data-active", "fill");
    updateManipulatorPositions.all();
    render.opacitySliderCanvas();
    render.fillOrStrokeSelector();
  };



  /* 
  ** UPDATES FROM UI
  */

  document.addEventListener("mouseenter", () => {
    mouseInsideDocument = true;

    if (document.hasFocus() === false) {
      // We set the focus back to the plugin window if user clicked outside of it, like this he doesn't need to click inside in order to use the shift or control keys.
      window.focus();

      // We test if shiftKeyPressed is true and set it to false to prevent this case: if user launches the plugin, enter the mouse inside (thus making it focus), leave the plugin, move a shape with shift key pressed in Figma (event listerner on the plugin will then trigger and set shiftKeyPressed to true), then come back to the plugin, the shiftKeyPressed will still be true event if is not pressing it anymore because the keyup event will not be triggered as the focus was lost when user moved the sahep in Figma.
      // We could test if the mouse is inside on the keydown event but then we will not be able to use the shift key to change the inputs values (by steps of 5 for some of them, check inputHandler()).
      // Same for ctrlKeyPressed even if it is not used as much than shift in Figma.
      shiftKeyPressed = shiftKeyPressed ? false : shiftKeyPressed;
      ctrlKeyPressed = ctrlKeyPressed ? false : ctrlKeyPressed;
    }
  });

  document.addEventListener("mouseleave", () => {
    mouseInsideDocument = false;
  });

  // We want to know if user has one of these two keys down because in mouseHandler() we constrain the color picker manipulator depending on them.
  document.addEventListener("keydown", (event) => {  
    if (event.key === "Shift") {
      shiftKeyPressed = true;
    }
    else if (event.key === "Control") {
      ctrlKeyPressed = true;
    }
    else if (event.key === "c" || event.key === "C") {      
      if (currentColorModel === "oklch" || currentColorModel === "oklchCss") handleLockRelativeChroma();
    }
  });

  document.addEventListener("keyup", (event) => {
    if (event.key === "Shift") {
      shiftKeyPressed = false;
      prevCanvasX = undefined;
      prevCanvasY = undefined;
      moveVerticallyOnly = false;
      moveHorizontallyOnly = false;
    }
    else if (event.key === "Control") {
      ctrlKeyPressed = false;
    }
  });

  const fileColorProfileHandle = function(event: any) {
    if (debugMode) { console.log("UI: fileColorProfileHandle()"); }

    fileColorProfile = (event.target as HTMLSelectElement).value;
    
    syncFileColorProfileWithPlugin();

    if (!UiMessageOn) {
      updateColorInputsPosition();
          
      scaleColorPickerCanvas();
      
      updateOkhxyValuesFromCurrentRgba();

      if (currentColorModel === "oklch" || currentColorModel === "oklchCss") updateRelativeChromaValue();

      updateManipulatorPositions.all();
      render.colorPickerCanvas();

      updateColorCodeInputs();

      updateColorSpaceLabelInColorPicker();
    }
  };

  const fillOrStrokeHandle = function() {
    if (debugMode) { console.log("UI: fillOrStrokeHandle()"); }

    switchFillOrStrokeSelector();

    updateOpacityValue(shapeInfos.colors[currentFillOrStroke].rgba[3]);

    updateOkhxyValuesFromCurrentRgba();
    render.opacitySliderCanvas();
    updateManipulatorPositions.all();
    render.colorPickerCanvas();
    
    updateColorCodeInputs();
    
    updateColorSpaceLabelInColorPicker();

    syncCurrentFillOrStrokeWithPlugin();
  };

  const colorModelHandle = function(event: any) {
    if (debugMode) { console.log("UI: colorModelHandle()"); }

    currentColorModel = (event.target as HTMLSelectElement).value;

    // We constrain to sRGB profile with these models to avoid confusion for users as they are not intended to be used in P3 space.
    if (currentColorModel === "okhsl" || currentColorModel === "okhsv") {
      fileColorProfileSelect.current!.value = "rgb";
      fileColorProfile = "rgb";

      fileColorProfileGroup.current!.classList.add("c-file-color-profile--deactivated");

      syncFileColorProfileWithPlugin();

      lockRelativeChroma.value = false;
      showRelativeChroma.value = false;
    }
    else {
      fileColorProfileGroup.current!.classList.remove("c-file-color-profile--deactivated");
      
      showRelativeChroma.value = true;
    }

    updateColorInputsPosition();
    
    syncCurrentColorModelWithPlugin();
    
    scaleColorPickerCanvas();
    
    updateOkhxyValuesFromCurrentRgba();
    updateManipulatorPositions.all();
    render.colorPickerCanvas();

    updateColorCodeInputs();

    updateColorSpaceLabelInColorPicker();
  };

  const handleLockRelativeChroma = function() {
    lockRelativeChroma.value = !lockRelativeChroma.value;

    if (!lockRelativeChroma.value) {
      relativeChromaStroke.current!.setAttribute("d", "");
    }
    else {
      render.colorPickerCanvas();
    }

    syncLockRelativeChromaWithPlugin();
  };

  const setupHandler = function(canvas: HTMLCanvasElement | HTMLDivElement) {
    if (debugMode) { console.log("UI: setupHandler() - " + canvas.id); }

    const mouseHandler = (event: MouseEvent) => {
      if (debugMode) { console.log("UI: mouseHandler() - " + canvas.id); }

      const rect = canvas.getBoundingClientRect();

      let canvasX: number;
      let canvasY: number;
    
      if (mouseHandlerEventTargetId === "") {
        mouseHandlerEventTargetId = (event.target as HTMLCanvasElement | HTMLDivElement).id;
      }

      if (mouseHandlerEventTargetId === "okhxy-xy-picker") {
        canvasX = event.clientX - rect.left;
        canvasY = event.clientY - rect.top;

        // With this code we can set the moveVerticallyOnly or moveHorizontallyOnly to true depending on his mouse movement (for example, if he is moving more vertically than horizontally then we set moveVerticallyOnly to true).
        if (shiftKeyPressed && !moveVerticallyOnly && !moveHorizontallyOnly && !lockRelativeChroma.value) {          
          if (prevCanvasX === undefined && prevCanvasY === undefined) {
            prevCanvasX = canvasX;
            prevCanvasY = canvasY;
          }
          else {
            const movement = is2DMovementMoreVerticalOrHorizontal(prevCanvasX!, prevCanvasY!, canvasX, canvasY);
            if (movement === "vertical") { moveVerticallyOnly = true; }
            else if (movement === "horizontal") { moveHorizontallyOnly = true; }
          }
        }

        if ((shiftKeyPressed && moveVerticallyOnly) || !shiftKeyPressed || lockRelativeChroma.value) {
          let newYValue: number;
          
          if (currentColorModel === "oklchCss" && !ctrlKeyPressed) {
            newYValue = roundWithDecimal(limitMouseHandlerValue(1 - canvasY/PICKER_SIZE) * 100, 1);
          }
          else {
            newYValue = Math.round(limitMouseHandlerValue(1 - canvasY/PICKER_SIZE) * 100)
          }
          
          if (ctrlKeyPressed) {
            if (currentColorModel === "oklch" && newYValue % 5 === 0) {
              okhxyValues.y.value = newYValue;
            }
            else if (currentColorModel === "oklchCss" && newYValue % 1 === 0) {
              okhxyValues.y.value = newYValue;
            }
          }
          else if (!ctrlKeyPressed) {
            okhxyValues.y.value = newYValue;
          }

          if (currentColorModel === "oklch" || currentColorModel === "oklchCss") {
            clampOkhxyValuesChroma();
          }
        }

        if ((shiftKeyPressed && moveHorizontallyOnly) || !shiftKeyPressed || lockRelativeChroma.value) {
          let newXValue: number;
          let newXValueFormated: number;

          if (currentColorModel === "oklch" || currentColorModel === "oklchCss") {
            newXValue = roundWithDecimal(limitMouseHandlerValue(canvasX/PICKER_SIZE) * 100, 1);
          }
          else {
            newXValue = Math.round(limitMouseHandlerValue(canvasX/PICKER_SIZE) * 100);
          }
          
          if (currentColorModel === "oklch") {
            if (ctrlKeyPressed) {
              newXValueFormated = Math.round(newXValue! / OKLCH_CHROMA_SCALE);
            }
            else if (!ctrlKeyPressed) {
              newXValueFormated = roundWithDecimal(newXValue! / OKLCH_CHROMA_SCALE, 1);
            }
          }
          else if (currentColorModel === "oklchCss") {
            if (ctrlKeyPressed) {
              newXValueFormated = roundWithDecimal(newXValue! / 100 / OKLCH_CHROMA_SCALE, 2);
            }
            else if (!ctrlKeyPressed) {
              newXValueFormated = roundWithDecimal(newXValue! / 100 / OKLCH_CHROMA_SCALE, 3);
            }
          }
          else {
            if (ctrlKeyPressed && newXValue! % 5 === 0) {
              newXValueFormated = newXValue!;
            }
            else if (!ctrlKeyPressed) {
              newXValueFormated = newXValue!;
            }
          }

          if (lockRelativeChroma.value) {
            newXValueFormated = getRelativeChroma({
              currentOklchColor: { l: okhxyValues.y.value, c: okhxyValues.x.value, h: okhxyValues.hue.value },
              currentColorModel: currentColorModel,
              fileColorProfile: fileColorProfile,
              targetValueNeeded: "chroma",
              targetPercentage: parseInt(relativeChroma.value)
            });
          }

          okhxyValues.x.value = newXValueFormated!;

          if (currentColorModel === "oklch" || currentColorModel === "oklchCss") {
            clampOkhxyValuesChroma();
          }
        }

        updateColorSpaceLabelInColorPicker();

        updateCurrentRgbaFromOkhxyValues();

        if (!lockRelativeChroma.value) updateRelativeChromaValue();
        
        updateManipulatorPositions.colorPicker();
        render.fillOrStrokeSelector();
        render.opacitySliderCanvas();
      }
      else if (mouseHandlerEventTargetId === "okhxy-h-slider") {
        canvasY = event.clientX - rect.left - 7;
        
        if (currentColorModel !== "oklchCss") {
          okhxyValues.hue.value = Math.round(limitMouseHandlerValue(canvasY/SLIDER_SIZE) * 360);
        }
        else {
          okhxyValues.hue.value = roundWithDecimal(limitMouseHandlerValue(canvasY/SLIDER_SIZE) * 360, 1);
        }

        if (lockRelativeChroma.value) {          
          okhxyValues.x.value = getRelativeChroma({
            currentOklchColor: { l: okhxyValues.y.value, c: okhxyValues.x.value, h: okhxyValues.hue.value },
            currentColorModel: currentColorModel,
            fileColorProfile: fileColorProfile,
            targetValueNeeded: "chroma",
            targetPercentage: parseInt(relativeChroma.value)
          });
        }

        if (currentColorModel === "oklch" || currentColorModel === "oklchCss") {
          clampOkhxyValuesChroma();
          updateManipulatorPositions.colorPicker();
        }

        updateColorSpaceLabelInColorPicker();

        updateCurrentRgbaFromOkhxyValues();

        updateRelativeChromaValue();

        updateManipulatorPositions.hueSlider();
        render.all();
      }
      else if (mouseHandlerEventTargetId === "opacity-slider") {
        canvasY = event.clientX - rect.left - 7;
        updateOpacityValue(Math.round(limitMouseHandlerValue(canvasY/SLIDER_SIZE) * 100));

        updateManipulatorPositions.opacitySlider();
      }

      updateColorCodeInputs();

      sendNewShapeColorToPlugin();

    };

    canvas.addEventListener("mousedown", {
      handleEvent: (event: MouseEvent) => {
        activeMouseHandler = mouseHandler;
        activeMouseHandler(event);
      }
    });
  };

  document.addEventListener("mousemove", (event: MouseEvent) => {
    if (activeMouseHandler) {
      activeMouseHandler(event);  
    }
  });

  document.addEventListener("mouseup", () => {
    if (activeMouseHandler) {
      activeMouseHandler = undefined;
      mouseHandlerEventTargetId = "";
    }
  });


  const handleInputFocus = function(event: FocusEvent) {
    if (debugMode) { console.log("UI: handleInputFocus()"); }

    (event.target as HTMLInputElement).select();
  };

  const okhxyInputHandler = function(event: KeyboardEvent | FocusEvent) {
    if (debugMode) { console.log("UI: okhxyInputHandler()"); }

    // To handle rare case where user could have entered a new value on an input but without validating it (like pressing "Enter") and then selecting another shape, without this check the new value of the input would be set on the new shape as the blur event would still trigger when user click on it.
    if (event.type === "blur" && mouseInsideDocument === false) { return; }

    const inputHandlesAllowedKeys = ["ArrowUp", "ArrowDown", "Enter", "Tab", "Escape"];
    const key = "key" in event ? event.key : "";

    if (!inputHandlesAllowedKeys.includes(key) && event.type !== "blur") { return; }
    
    if (key !== "Tab") { event.preventDefault(); }

    const eventTarget = event.target as HTMLInputElement;
    const eventTargetId: string = eventTarget.id;

    let eventTargetValue = parseInt(eventTarget.value);

    let incrementValue: number;

    if (currentColorModel === "oklch") {
      if (eventTargetId === "x") {
        eventTargetValue = roundWithDecimal(parseFloat(eventTarget.value), 1);
      }
    }
    else if (currentColorModel === "oklchCss") {
      if (eventTargetId === "x") {
        eventTargetValue = roundWithDecimal(parseFloat(eventTarget.value), 3);
      }
      else {
        eventTargetValue = roundWithDecimal(parseFloat(eventTarget.value), 1);
      }
    }
    
    // If Not a Number we insert back the old value.
    if (Number.isNaN(eventTargetValue)) {
      if (eventTargetId === "hue" || eventTargetId === "x" || eventTargetId === "y") {
        eventTarget.value = okhxyValues[eventTargetId].value.toString();
      }
      else if (eventTargetId === "opacity") {
        updateOpacityValue(shapeInfos.colors[currentFillOrStroke].rgba[3]);
      }
      else if (eventTargetId === "relativeChroma") {
        eventTarget.value = relativeChroma.value;
      }
      if (event.type !== "blur") { eventTarget.select(); }
      return;
    }

    // We test if the value is the same and user didn't use up or down key to avoid continuing.
    let currentValue;

    if (eventTargetId === "opacity") {
      currentValue = shapeInfos.colors[currentFillOrStroke].rgba[3];
    }
    else if (eventTargetId === "relativeChroma") {
      currentValue = parseInt(relativeChroma.value);
    }
    else {
      currentValue = okhxyValues[eventTargetId].value;
    }

    if (currentValue === eventTargetValue && key !== "ArrowUp" && key !== "ArrowDown") {
      eventTarget.blur();
      return;
    }

    // If we are in OkLCH and user is changing the chroma value, we use 0.1 for a more precise choice.
    if (eventTargetId === "x" && currentColorModel === "oklch") {
      if (shiftKeyPressed) { incrementValue = 1; }
      else { incrementValue = 0.1; }   
    }
    else if (eventTargetId === "x" && currentColorModel === "oklchCss") {
      if (shiftKeyPressed) { incrementValue = 0.01; }
      else { incrementValue = 0.001; }
    }
    else if ((eventTargetId === "y" || eventTargetId === "hue") && currentColorModel === "oklchCss") {
      if (shiftKeyPressed) { incrementValue = 1; }
      else { incrementValue = 0.1; }
    }
    else {
      if (shiftKeyPressed) { incrementValue = 5; }
      else { incrementValue = 1; }
    }

    if (key === "ArrowUp") { eventTargetValue += incrementValue; }
    else if (key === "ArrowDown") { eventTargetValue -= incrementValue; }
    
    // We adjust user's value in case it's outside of the allowed range.
    let maxValue: number;

    if (eventTargetId === "hue") {
      maxValue = 360;
    }
    else {
      if (currentColorModel === "oklchCss" && eventTargetId === "x") {
        maxValue = 0.4;
      }
      else {
        maxValue = 100;
      }
    }

    // We do this because if user enter for example "105" two times in a row for the relative chroma input, the second times the input will not update because signals only trigger render when the value changes, but in this case they will be the same as user entered the value directly in the input. By doing this trick to empty the value first, we are sure that when we update it after, the change will be effective.
    if ((eventTargetValue > 100 || eventTargetValue < 0) && eventTargetId === "relativeChroma") relativeChroma.value = "";

    eventTargetValue = clampNumber(eventTargetValue, 0, maxValue);
    
    let oldValue: number;

    if (eventTargetId === "hue" || eventTargetId === "x" || eventTargetId === "y") {
      oldValue = okhxyValues[eventTargetId].value;

      // We have to update input's value like this because if we don't we'll have some issues. For example if user set 0 on an input then -10 the signal will not update after the test because il will already be at 0 and thus will not refresh (from Preact's doc: "A signal will only update if you assign a new value to it"). Another example, without this code if user try to enter "5t" more than two times, the input value will stay at "5t".
      if (key !== "Escape" && okhxyValues[eventTargetId].value !== eventTargetValue) {
        if (currentColorModel !== "oklchCss") {
          // We use roundWithDecimal() again because in some case we can have values like "3.8000000000000003" when using the up or down arrow keys.
          okhxyValues[eventTargetId].value = roundWithDecimal(eventTargetValue, 1);
        }
        else {
          if (eventTargetId === "x") {
            okhxyValues[eventTargetId].value = roundWithDecimal(eventTargetValue, 3);
          }
          else {
            okhxyValues[eventTargetId].value = roundWithDecimal(eventTargetValue, 1);
          }
          if (lockRelativeChroma.value) {
            okhxyValues.x.value = getRelativeChroma({
              currentOklchColor: { l: okhxyValues.y.value, c: okhxyValues.x.value, h: okhxyValues.hue.value },
              currentColorModel: currentColorModel,
              fileColorProfile: fileColorProfile,
              targetValueNeeded: "chroma",
              targetPercentage: parseInt(relativeChroma.value)
            });
          }
          else {
            updateRelativeChromaValue();
          }
        }
      }
      else {
        eventTarget.value = oldValue.toString();
      }
      
      if (currentColorModel === "oklch" || currentColorModel === "oklchCss") {
        clampOkhxyValuesChroma();
      }

      updateColorCodeInputs();
      
      updateColorSpaceLabelInColorPicker();

      updateCurrentRgbaFromOkhxyValues();

      if (eventTargetId === "hue") {
        render.colorPickerCanvas();
        updateManipulatorPositions.hueSlider();
      }
      
      // We test if currentColorModel === "oklch" because if we modify the hue there is a chance that the chroma value is now out of range and thus we need to update the color picker.
      if (eventTargetId === "x" || eventTargetId === "y" || currentColorModel === "oklch" || currentColorModel === "oklchCss") {
        updateManipulatorPositions.colorPicker();
      }

      render.opacitySliderCanvas();
      render.fillOrStrokeSelector();
    }
    else if (eventTargetId === "opacity") {
      oldValue = shapeInfos.colors[currentFillOrStroke].rgba[3];

      if (key !== "Escape") { updateOpacityValue(eventTargetValue); }
      else { updateOpacityValue(oldValue); }
  
      updateManipulatorPositions.opacitySlider();

      updateColorCodeInputs();
    }
    else if (eventTargetId === "relativeChroma") {
      okhxyValues.x.value = getRelativeChroma({
        currentOklchColor: { l: okhxyValues.y.value, c: okhxyValues.x.value, h: okhxyValues.hue.value },
        currentColorModel: currentColorModel,
        fileColorProfile: fileColorProfile,
        targetValueNeeded: "chroma",
        targetPercentage: eventTargetValue
      });      
      
      updateManipulatorPositions.colorPicker();

      updateCurrentRgbaFromOkhxyValues();

      updateRelativeChromaValue();

      updateColorCodeInputs();

      render.colorPickerCanvas();
    }

    if (event.type !== "blur") { eventTarget.select(); }
    sendNewShapeColorToPlugin();

    if (key === "Enter") { eventTarget.blur(); }
  };

  const colorCodesInputHandler = function(event: KeyboardEvent | FocusEvent) {
    if (debugMode) { console.log("UI: colorCodesInputHandler()"); }

    // To handle rare case where user could have entered a new value on an input but without validating it (like pressing "Enter") and then selecting another shape, without this check the new value of the input would be set on the new shape as the blur event would still trigger when user click on it.
    if (event.type === "blur" && mouseInsideDocument === false) { return; }

    const inputHandlesAllowedKeys = ["Enter", "Tab", "Escape"];
    const key = "key" in event ? event.key : "";

    if (!inputHandlesAllowedKeys.includes(key) && event.type !== "blur") { return; }
    
    if (key !== "Tab") { event.preventDefault(); }

    const eventTarget = event.target as HTMLInputElement;
    const eventTargetId: string = eventTarget.id;
    
    let eventTargetValue = eventTarget.value;

    // This test is to know if user a for example pressed the tab key but without modyfing the value.
    if (colorCodesInputValues[eventTargetId] === eventTargetValue) {

      // We allow to update the color inputs if rgba of hex one are focused, like this user can simply set the sRGB fallback of an P3 color with "Enter" key.
      if (!((eventTargetId === "rgba" || eventTargetId === "hex") && key === "Enter")) {
        eventTarget.blur();
        return;
      }
    }

    let colorFormat: string;
    
    if (eventTargetId === "currentColorModel") {
      if ((currentColorModel === "oklch" || currentColorModel === "oklchCss")) {
        colorFormat = "oklch";
      }
      else {
        colorFormat = currentColorModel;
      }
    }
    else {
      colorFormat = eventTargetId;
    }

    const isColorCodeInGoodFormatValue = isColorCodeInGoodFormat(eventTargetValue, colorFormat, currentColorModel);

    let regex;
    let matches;
    let newOkhxy;
    let newOpacity = 1;

    if (isColorCodeInGoodFormatValue || colorFormat === "hex") {
      if (eventTargetId === "currentColorModel") {
        if (currentColorModel === "oklch" || currentColorModel === "oklchCss") {
          regex = /(\d+(\.\d+)?)/g;
          matches = eventTargetValue.match(regex);

          if (currentColorModel === "oklch") {
            okhxyValues.hue.value = roundWithDecimal(parseFloat(matches![2]), 0);
            okhxyValues.x.value = roundWithDecimal(parseFloat(matches![1])*100, 1);
            okhxyValues.y.value = roundWithDecimal(parseFloat(matches![0]), 0);
          }
          else {
            okhxyValues.hue.value = parseFloat(matches![2]);
            okhxyValues.x.value = parseFloat(matches![1]);
            okhxyValues.y.value = parseFloat(matches![0]);
          }
          
          clampOkhxyValuesChroma();

          newOpacity = parseFloat(matches![3]);
        }
        else if (currentColorModel === "okhsl") {
          regex = /h:\s*(\d+)\s*,\s*s:\s*(\d+)\s*,\s*l:\s*(\d+)\s*/;
          matches = eventTargetValue.match(regex);

          okhxyValues.hue.value = parseInt(matches![1]);
          okhxyValues.x.value = parseInt(matches![2]);
          okhxyValues.y.value = parseInt(matches![3]);
        }
        else if (currentColorModel === "okhsv") {
          regex = /h:\s*(\d+)\s*,\s*s:\s*(\d+)\s*,\s*v:\s*(\d+)\s*/;
          matches = eventTargetValue.match(regex);

          okhxyValues.hue.value = parseInt(matches![1]);
          okhxyValues.x.value = parseInt(matches![2]);
          okhxyValues.y.value = parseInt(matches![3]);
        }
      }
      else if (eventTargetId === "color") {
        regex = /(\b\d+(\.\d+)?\b)/g;
        matches = eventTargetValue.match(regex);

        if (currentColorModel === "oklch" || currentColorModel === "oklchCss") {
          newOkhxy = colorConversion("rgb", currentColorModel, parseFloat(matches![0])*255, parseFloat(matches![1])*255, parseFloat(matches![2])*255, "p3");
        }
        else {
          newOkhxy = colorConversion("rgb", currentColorModel, parseFloat(matches![0])*255, parseFloat(matches![1])*255, parseFloat(matches![2])*255, "rgb");
        }

        okhxyValues.hue.value = newOkhxy[0];
        okhxyValues.x.value = newOkhxy[1];
        okhxyValues.y.value = newOkhxy[2];
        
        newOpacity = parseFloat(matches![3]);
      }
      else if (eventTargetId === "rgba") {
        regex = /(\d+(\.\d+)?)/g;
        matches = eventTargetValue.match(regex);

        newOkhxy = colorConversion("rgb", currentColorModel, parseFloat(matches![0]), parseFloat(matches![1]), parseFloat(matches![2]), "rgb");

        okhxyValues.hue.value = newOkhxy[0];
        okhxyValues.x.value = newOkhxy[1];
        okhxyValues.y.value = newOkhxy[2];

        newOpacity = parseFloat(matches![3]);
      }
      else if (eventTargetId === "hex") {
        const newRgb = convertToRgb(eventTargetValue);

        if (newRgb !== undefined) {
          newOkhxy = colorConversion("rgb", currentColorModel, newRgb.r*255, newRgb.g*255, newRgb.b*255, "rgb");

          okhxyValues.hue.value = newOkhxy[0];
          okhxyValues.x.value = newOkhxy[1];
          okhxyValues.y.value = newOkhxy[2];

          if (newRgb.alpha) { newOpacity = roundWithDecimal(newRgb.alpha, 2); }
        }
      }
    }

    if (!Number.isNaN(newOpacity)) {
      updateOpacityValue(newOpacity*100);
    }
    else {
      updateOpacityValue(100);
    }

    updateColorSpaceLabelInColorPicker();

    updateCurrentRgbaFromOkhxyValues();

    updateRelativeChromaValue();
    
    updateManipulatorPositions.all();
    render.all();

    updateColorCodeInputs();

    sendNewShapeColorToPlugin();

    if (key === "Enter") { eventTarget.blur(); }
  };



  /* 
  ** UPDATES TO PLUGIN
  */

  const sendNewShapeColorToPlugin = function() {
    if (debugMode) { console.log("UI: sendNewShapeColorToPlugin()"); }

    parent.postMessage({ pluginMessage: { type: "updateShapeColor", "newColor": shapeInfos.colors[currentFillOrStroke].rgba } }, "*");
  };

  const syncFileColorProfileWithPlugin = function() {
    if (debugMode) { console.log("UI: syncFileColorProfileWithPlugin()"); }

    parent.postMessage({ pluginMessage: { type: "syncFileColorProfile", "fileColorProfile": fileColorProfile } }, "*");
  };

  const syncCurrentFillOrStrokeWithPlugin = function() {
    if (debugMode) { console.log("UI: syncCurrentFillOrStrokeWithPlugin()"); }

    parent.postMessage({ pluginMessage: { type: "syncCurrentFillOrStroke", "currentFillOrStroke": currentFillOrStroke } }, "*");
  };

  const syncCurrentColorModelWithPlugin = function() {
    if (debugMode) { console.log("UI: syncCurrentColorModelWithPlugin()"); }

    parent.postMessage({ pluginMessage: { type: "syncCurrentColorModel", "currentColorModel": currentColorModel } }, "*");
  };

  const syncLockRelativeChromaWithPlugin = function() {
    if (debugMode) { console.log("UI: syncLockRelativeChromaWithPlugin()"); }

    parent.postMessage({ pluginMessage: { type: "syncLockRelativeChromaWithPlugin", "lockRelativeChroma": lockRelativeChroma.value } }, "*");
  };



  /* 
  ** UPDATES FROM PLUGIN
  */

  onmessage = (event) => {
    const pluginMessage: string = event.data.pluginMessage.message;

    if (debugMode) { console.log(`UI: onmessage - "${pluginMessage}"`); }

    if (pluginMessage === "init") {
      setupHandler(colorPickerCanvas.current!);
      setupHandler(hueSlider.current!);
      setupHandler(opacitySlider.current!);

      fileColorProfile = event.data.pluginMessage.data.fileColorProfile;
      currentColorModel = event.data.pluginMessage.data.currentColorModel;
      showCssColorCodes.value = event.data.pluginMessage.data.showCssColorCodes;
      lockRelativeChroma.value = event.data.pluginMessage.data.lockRelativeChroma;

      updateColorInputsPosition();

      fileColorProfileSelect.current!.value = fileColorProfile;

      if (currentColorModel === "okhsl" || currentColorModel === "okhsv") {
        fileColorProfileGroup.current!.classList.add("c-file-color-profile--deactivated");
        showRelativeChroma.value = false;
      }
      else {
        showRelativeChroma.value = true;
      }

      // We do this to avoid flickering on loading.
      colorModelSelect.current!.style.opacity = "1";

      colorModelSelect.current!.value = currentColorModel;

      scaleColorPickerCanvas();
    }

    if (pluginMessage === "newShapeColor") {
      // This value is false by default.
      let shouldRenderColorPickerCanvas: boolean = event.data.pluginMessage.shouldRenderColorPickerCanvas;

      if (UiMessageOn) {
        UiMessage.hide();
        shouldRenderColorPickerCanvas = true;
      }

      if (currentFillOrStroke !== event.data.pluginMessage.currentFillOrStroke) {
        switchFillOrStrokeSelector();
        shouldRenderColorPickerCanvas = true;
      }
      
      currentFillOrStroke = event.data.pluginMessage.currentFillOrStroke;
      shapeInfos = JSON.parse(JSON.stringify(event.data.pluginMessage.shapeInfos));

      updateOpacityValue(shapeInfos.colors[currentFillOrStroke].rgba[3]);
      updateOkhxyValuesFromCurrentRgba();
      updateRelativeChromaValue();

      
      render.opacitySliderCanvas();
      updateManipulatorPositions.all();
      render.fillOrStrokeSelector();

      updateColorCodeInputs();

      updateColorSpaceLabelInColorPicker();

      // We don't render colorPicker if for example user has just deleted the stroke of a shape that had both fill and stroke.
      if (shouldRenderColorPickerCanvas) { render.colorPickerCanvas(); }
    }

    else if (pluginMessage === "displayUiMessage") {
      UiMessage.show(event.data.pluginMessage.UiMessageCode, event.data.pluginMessage.nodeType);
    }
  };

  
  return (
    <>
      <div ref={fileColorProfileGroup} class="c-file-color-profile">
        <p>File color profile</p>

        <div class="select-wrapper">
          <select ref={fileColorProfileSelect} onChange={fileColorProfileHandle} name="file_color_profile" id="file_color_profile">
            <option value="rgb">sRGB</option>
            <option value="p3">Display P3</option>
          </select>
        </div>
      </div>

      <div class="c-color-picker" style={`width: ${PICKER_SIZE}px; height: ${PICKER_SIZE}px;`}>
        <div ref={colorPickerUiMessage} class="c-color-picker__message-wrapper u-display-none">
          <p class="c-color-picker__message-text"></p>
        </div>

        <div ref={colorSpaceOfCurrentColor} class="c-color-picker__color-space"></div>

        <canvas ref={colorPickerCanvas} class="c-color-picker__canvas" id="okhxy-xy-picker"></canvas>
        <svg class="c-color-picker__srgb-boundary" width={PICKER_SIZE} height={PICKER_SIZE}>
          <path ref={srgbBoundary} fill="none" stroke={OKLCH_RGB_BOUNDARY_COLOR} />
        </svg>

        <svg class="c-color-picker__relative-chroma-stroke" width={PICKER_SIZE} height={PICKER_SIZE}>
          <path ref={relativeChromaStroke} fill="none" stroke="#FFFFFF80" />
        </svg>

        <svg class="c-color-picker__handler" width={PICKER_SIZE} height={PICKER_SIZE}>
          <g ref={manipulatorColorPicker} transform="translate(0,0)">
            <circle cx="0" cy="0" r="4.8" fill="none" stroke-width="2.8" stroke="#555555" ></circle>
            <circle cx="0" cy="0" r="4.8" fill="none" stroke-width="2.5" stroke="#ffffff" ></circle>
          </g>
        </svg>
      </div>

      <div class="c-bottom-controls">
        <div class="u-flex u-items-center u-justify-between u-px-16 u-mt-18">

          <div class="c-fill-stroke-selector" ref={fillOrStrokeSelector} onClick={fillOrStrokeHandle} data-has-fill="true" data-has-stroke="true" data-active="fill" >
            
            <div class="c-fill-stroke-selector__fill">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle ref={fillOrStrokeSelector_fill} cx="10" cy="10" r="9.5" fill="#FFFFFF" stroke="#AAAAAA"/>
              </svg>
            </div>

            <div class="c-fill-stroke-selector__stroke">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path ref={fillOrStrokeSelector_stroke} d="M15.8 10C15.8 13.2033 13.2033 15.8 10 15.8C6.79675 15.8 4.2 13.2033 4.2 10C4.2 6.79675 6.79675 4.2 10 4.2C13.2033 4.2 15.8 6.79675 15.8 10ZM10 19.5C15.2467 19.5 19.5 15.2467 19.5 10C19.5 4.75329 15.2467 0.5 10 0.5C4.75329 0.5 0.5 4.75329 0.5 10C0.5 15.2467 4.75329 19.5 10 19.5Z" fill="#FFFFFF" stroke="#AAAAAA"/>
              </svg>
            </div>

          </div>

          <div class="u-flex u-flex-col">

            <div class="c-slider">
              <div class="c-slider__canvas c-slider__canvas--hue-bg-img">
                <div ref={hueSlider} class="u-w-full u-h-full" id="okhxy-h-slider"></div>
              </div>

              <div class="c-slider__handler">
                <svg ref={manipulatorHueSlider} transform="translate(0,0)" width="14" height="14">
                  <circle cx="7" cy="7" r="4.8" fill="none" stroke-width="2.8" stroke="#555555" ></circle>
                  <circle cx="7" cy="7" r="4.8" fill="none" stroke-width="2.5" stroke="#ffffff" ></circle>
                </svg>
              </div>
            </div>

            <div class="c-slider u-mt-16">
              <div class="c-slider__canvas" style={opacitySliderStyle}>
                <div ref={opacitySlider} class="u-w-full u-h-full" id="opacity-slider"></div>
              </div>

              <div class="c-slider__handler">
                <svg ref={manipulatorOpacitySlider} transform="translate(0,0)" width="14" height="14">
                  <circle cx="7" cy="7" r="4.8" fill="none" stroke-width="2.8" stroke="#555555" ></circle>
                  <circle cx="7" cy="7" r="4.8" fill="none" stroke-width="2.5" stroke="#ffffff" ></circle>
                </svg>
              </div>
            </div>

          </div>

        </div>

        <div class="c-select-input-controls">
          <div class="select-wrapper c-select-input-controls__select-wrapper">
            <select ref={colorModelSelect} onChange={colorModelHandle} name="color_model" id="color_model" style="opacity: 0;">
              <option value="okhsv">OkHSV</option>
              <option value="okhsl">OkHSL</option>
              <option value="oklch">OkLCH</option>
              <option value="oklchCss">OkLCH (CSS)</option>
            </select>
          </div>

          <div class="input-wrapper c-select-input-controls__input-wrapper">
            <input ref={hueInput} onFocus={handleInputFocus} onBlur={okhxyInputHandler} onKeyDown={okhxyInputHandler} id="hue" value={okhxyValues.hue} spellcheck={false} />
            <input ref={xInput} onFocus={handleInputFocus} onBlur={okhxyInputHandler} onKeyDown={okhxyInputHandler} id="x" value={okhxyValues.x} spellcheck={false} />
            <input ref={yInput} onFocus={handleInputFocus} onBlur={okhxyInputHandler} onKeyDown={okhxyInputHandler} id="y" value={okhxyValues.y} spellcheck={false} />
            <input ref={opacityInput} onFocus={handleInputFocus} onBlur={okhxyInputHandler} onKeyDown={okhxyInputHandler} id="opacity" tabIndex={4} spellcheck={false} />
          </div>
        </div>

        <RelativeChroma
          showRelativeChroma={showRelativeChroma}
          relativeChroma={relativeChroma}
          lockRelativeChroma={lockRelativeChroma}
          handleInputFocus={handleInputFocus}
          okhxyInputHandler={okhxyInputHandler}
          handleLockRelativeChroma={handleLockRelativeChroma}
        />

        <CssColorCodes
          showCssColorCodes={showCssColorCodes}
          handleInputFocus={handleInputFocus}
          colorCodesInputHandler={colorCodesInputHandler}
          colorCode_currentColorModelInput={colorCode_currentColorModelInput}
          colorCode_colorInput={colorCode_colorInput}
          colorCode_rgbaInput={colorCode_rgbaInput}
          colorCode_hexInput={colorCode_hexInput}
        />

      </div>

    </>
  );
};

render(<App />, document.getElementById("root") as HTMLElement);