import { signal } from "@preact/signals";
import { useRef } from "preact/hooks";

import { colorConversion } from "../lib/bottosson/colorconversion";
import { render_okhsv, render_okhsl } from "../lib/bottosson/render";
import { eps } from "../lib/bottosson/constants";

import { UIMessageTexts } from "./ui-messages";


const opacitysliderBackgroundImg = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAwIAAABUCAYAAAAxg4DPAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAJMSURBVHgB7dlBbQNAEATBcxQky5+Sl4pjAHmdLPnRVQTm3ZrH8/l8nQszc27s7rlhz549e/bs2bNnz569z+39HAAAIEcIAABAkBAAAIAgIQAAAEFCAAAAgoQAAAAECQEAAAgSAgAAECQEAAAgSAgAAECQEAAAgCAhAAAAQUIAAACCHq+3c2F3z42ZOTfs2bNnz549e/bs2bP3uT2PAAAABAkBAAAIEgIAABAkBAAAIEgIAABAkBAAAIAgIQAAAEFCAAAAgoQAAAAECQEAAAgSAgAAECQEAAAgSAgAAEDQ7+6eGzNzbtizZ8+ePXv27NmzZ+/7ex4BAAAIEgIAABAkBAAAIEgIAABAkBAAAIAgIQAAAEFCAAAAgoQAAAAECQEAAAgSAgAAECQEAAAgSAgAAECQEAAAgKDH6+1c2N1zY2bODXv27NmzZ+8/9uzZs2fvbs8jAAAAQUIAAACChAAAAAQJAQAACBICAAAQJAQAACBICAAAQJAQAACAICEAAABBQgAAAIKEAAAABAkBAAAIEgIAABD0u7vnxsycG/bs2bNnz549e/bs2fv+nkcAAACChAAAAAQJAQAACBICAAAQJAQAACBICAAAQJAQAACAICEAAABBQgAAAIKEAAAABAkBAAAIEgIAABAkBAAAIOjxejsXdvfcmJlzw549e/bs2bNnz549e5/b8wgAAECQEAAAgCAhAAAAQUIAAACChAAAAAQJAQAACBICAAAQJAQAACBICAAAQJAQAACAICEAAABBQgAAAIKEAAAABP0BZxb7duWmOFoAAAAASUVORK5CYII=";

// We don't use the picker_size constant from the constants file because if we modify we got a display bug with the results from the render function in render.js
const picker_size = 240;

// We use a different value for the slider as they take less room.
const slider_size = 148;

const okhxyValues = {
  isWhite: false,
  isBlack: false,
  isGray: false,
  hue: signal(0),
  x: signal(0),
  y: signal(0),
};

const opacitySliderStyle = signal("");

type RgbaColor = [number, number, number, number];

type Colors = {
  [key: string]: {
    rgba: RgbaColor;
  };
}

interface ShapeInfos {
  hasFillStroke: {
    fill: boolean;
    stroke: boolean;
  };
  colors: Colors;
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

let init = true;
let UIMessageOn = false;

// Default choice unless selected shape on launch has no fill.
let currentFillOrStroke = "fill";
let currentColorModel = "okhsl";
let activeMouseHandler: Function | undefined;

// This var is to let user move the manipulators outside of their zone, if not the event of the others manipulator will trigger if keep the mousedown and go to other zones.
let mouseHandlerEventTargetId = "";

export function App() { 
  // We could use one canvas element but better no to avoid flickering when user change color model 
  const fillOrStrokeSelector = useRef<HTMLDivElement>(null);
  const fillOrStrokeSelector_fill = useRef<SVGCircleElement>(null);
  const fillOrStrokeSelector_stroke = useRef<SVGPathElement>(null);
  const colorPickerUIMessage = useRef<HTMLDivElement>(null);
  const colorPicker = useRef<HTMLCanvasElement>(null);
  const hueSlider = useRef<HTMLDivElement>(null);
  const opacitySlider = useRef<HTMLDivElement>(null);
  const manipulatorColorPicker = useRef<SVGGElement>(null);
  const manipulatorHueSlider = useRef<SVGGElement>(null);
  const manipulatorOpacitySlider = useRef<SVGGElement>(null);
  const opacityInput = useRef<HTMLInputElement>(null);
  const bottomControls = useRef<HTMLDivElement>(null);

  /*
  ** HELPER FUNCTIONS
  */

  const clamp = function(num: number, min: number, max: number): number {
    if (num < min) {
      return min;
    }
    else if (num > max) {
      return max;
    }
    return num;
  };

  const limitMouseHandlerValue = function(x: number): number {
    return x < eps ? eps : (x > 1-eps ? 1-eps : x);
  };

  const shapeInfosResetDefault = function() {
    shapeInfos.hasFillStroke.fill = true,
    shapeInfos.hasFillStroke.stroke = true,
    shapeInfos.colors.fill.rgba = [255, 255, 255, 0],
    shapeInfos.colors.stroke.rgba = [255, 255, 255, 0]
  };

  const checkIfOkhxyIsWhiteBlackOrGray = function() {
    okhxyValues.isWhite = false;
    okhxyValues.isBlack = false;
    okhxyValues.isGray = false;

    // We do these tests in order to be able to change the hue on the color picker canvas when we have a white, black or gray color. If we don't to this fix, the hue value will always be the same on the color picker canvas.
    if (okhxyValues.x.value == 0 && (okhxyValues.y.value >= 1 && okhxyValues.y.value <= 99)) {
      okhxyValues.isGray = true;
    }
    else if (okhxyValues.y.value == 0) {
      okhxyValues.isBlack = true;
    }
    else if (okhxyValues.y.value == 100) {
      if (currentColorModel == "okhsl" || (currentColorModel == "okhsv" && okhxyValues.x.value == 0)) {
        okhxyValues.isWhite = true;
      }
    }
  };


  

  /* 
  ** UPDATES TO UI
  */

  const UIMessage = {
    hide() {
      UIMessageOn = false;

      bottomControls.current!.classList.remove("u-deactivated");
      manipulatorColorPicker.current!.classList.remove("u-display-none");
      colorPickerUIMessage.current!.classList.add("u-display-none");
    },
    show(messageCode: string, nodeType: string) {
      UIMessageOn = true;

      resetInterface();

      bottomControls.current!.classList.add("u-deactivated");
      manipulatorColorPicker.current!.classList.add("u-display-none");
      colorPickerUIMessage.current!.classList.remove("u-display-none");

      let message: string = UIMessageTexts[messageCode];
      if (nodeType != "") {
        message = message.replace("$SHAPE", nodeType.toLowerCase());
      }
      colorPickerUIMessage.current!.children[0].innerHTML = message;
    }
  };

  // We use a function to update the opacity value in the input because we need to add the "%" sign and doing it directly in the value field with a fignal value doesn't work.
  const updateOpacityValue = function(newValue: number) {
    shapeInfos.colors[currentFillOrStroke].rgba[3] = newValue;
    opacityInput.current!.value = `${newValue}%`;
  };


  const switchFillOrStrokeSelector = function() {
    // console.log("switch FillOrStrokeSelector");
    
    currentFillOrStroke = currentFillOrStroke === "fill" ? "stroke" : "fill";
    fillOrStrokeSelector.current!.setAttribute("data-active", currentFillOrStroke);
  } ;


  const updateOkhxyValuesFromCurrentRgba = function() {
    // console.log("convert Rgb To Okhxy Values");

    let shapeColor = shapeInfos.colors[currentFillOrStroke].rgba.slice(0, 3);

    // We do these tests to be abble to keep the hue between the color model change when we have a white, black or gray value.
    if (okhxyValues.isWhite || okhxyValues.isBlack || okhxyValues.isGray) {
      const clampX = clamp(okhxyValues.x.value, 1, 99);
      const clampY = clamp(okhxyValues.y.value, 1, 99);

      shapeColor = colorConversion(currentColorModel, "srgb", okhxyValues.hue.value, clampX, clampY);
    }
    
    const newOkhxy = colorConversion("srgb", currentColorModel, shapeColor[0], shapeColor[1], shapeColor[2]);

    if (okhxyValues.isWhite) {
      okhxyValues.x.value = 0;
      okhxyValues.y.value = 100;
    }
    else if (okhxyValues.isBlack) {
      okhxyValues.x.value = 0;
      okhxyValues.y.value = 0;
    }
    else if (okhxyValues.isGray) {
      okhxyValues.x.value = 0;
    }
    else {
      okhxyValues.x.value = newOkhxy[1];
      okhxyValues.y.value = newOkhxy[2];
    }

    okhxyValues.hue.value = newOkhxy[0];
  };

  const updateCurrentRgbaFromOkhxyValues = function() {

    let newRgb: [number, number, number] = [0, 0, 0];
    
    // No need to call colorConversion() if we have a white or black color.
    if (!okhxyValues.isWhite && !okhxyValues.isBlack) {
      newRgb = colorConversion(currentColorModel, "srgb", okhxyValues.hue.value, okhxyValues.x.value, okhxyValues.y.value);
    }
    else if (okhxyValues.isWhite) {
      newRgb = [255, 255, 255];
    }
    else if (okhxyValues.isBlack) {
      newRgb = [0, 0, 0];
    }

    shapeInfos.colors[currentFillOrStroke].rgba = [...newRgb, shapeInfos.colors[currentFillOrStroke].rgba[3]];
  };

  const render = {
    colorPickerCanvas() {
      // console.log("render Color Picker Canvas");

      let renderResult;
      let ctx = colorPicker.current!.getContext("2d");
      let shapeColor = shapeInfos.colors[currentFillOrStroke].rgba.slice(0, 3);

      // If we don't to this and for exemple we start the plugin with a [0, 0, 0] fill, the color picker hue will be red while the hue picker will be orange. Seems to be an inconsistency with the render functions.
      if (shapeColor.slice(0, 3).every(val => val === 0)) { shapeColor.fill(0.01, 0, 3); }

      // We do these tests in order to be able to change the hue on the color picker canvas when we have a white, black or gray color. If we don't to this fix, the hue value will always be the same on the color picker canvas.
      if (okhxyValues.isWhite || okhxyValues.isBlack || okhxyValues.isGray) {
        const clampX = clamp(okhxyValues.x.value, 1, 99);
        const clampY = clamp(okhxyValues.y.value, 1, 99);

        shapeColor = colorConversion(currentColorModel, "srgb", okhxyValues.hue.value, clampX, clampY);
      }

      if (currentColorModel == "okhsl") {
        renderResult = render_okhsl(shapeColor[0], shapeColor[1], shapeColor[2]);
        ctx!.putImageData(renderResult["okhsl_sl"], 0, 0);
      }
      else if (currentColorModel == "okhsv") {
        renderResult = render_okhsv(shapeColor[0], shapeColor[1], shapeColor[2]);
        ctx!.putImageData(renderResult["okhsv_sv"], 0, 0);
      }
      // else if (colorModel == "oklch") {
      //   results = render(tempColor[0], tempColor[1], tempColor[2]);
      //   ctx.putImageData(results["oklch_lc"], 0, 0);
      // }
    },
    fillOrStrokeSelector() {
      // console.log("render fillOrStroke Selector");

      if (shapeInfos.hasFillStroke.fill && shapeInfos.hasFillStroke.stroke) {
        fillOrStrokeSelector.current!.classList.remove("u-pointer-events-none");
      } else {
        fillOrStrokeSelector.current!.classList.add("u-pointer-events-none");
      }
      
      fillOrStrokeSelector.current!.setAttribute("data-has-fill", shapeInfos.hasFillStroke.fill.toString());
      fillOrStrokeSelector.current!.setAttribute("data-has-stroke", shapeInfos.hasFillStroke.stroke.toString());
  
      fillOrStrokeSelector_fill.current!.setAttribute("fill", shapeInfos.hasFillStroke.fill ? `rgb(${shapeInfos.colors.fill.rgba[0]}, ${shapeInfos.colors.fill.rgba[1]}, ${shapeInfos.colors.fill.rgba[2]})` : "none");
      fillOrStrokeSelector_stroke.current!.setAttribute("fill", shapeInfos.hasFillStroke.stroke ? `rgb(${shapeInfos.colors.stroke.rgba[0]}, ${shapeInfos.colors.stroke.rgba[1]}, ${shapeInfos.colors.stroke.rgba[2]})` : "none");
    },
    opacitySliderCanvas() {
      // console.log("render opacity Slider Canvas");
      opacitySliderStyle.value = `background-image: linear-gradient(to right, rgba(255, 255, 255, 0), rgba(${shapeInfos.colors[currentFillOrStroke].rgba[0]}, ${shapeInfos.colors[currentFillOrStroke].rgba[1]}, ${shapeInfos.colors[currentFillOrStroke].rgba[2]}, 1)), url(${opacitysliderBackgroundImg})`;
    },
    all() {
      this.colorPickerCanvas();
      this.fillOrStrokeSelector();
      this.opacitySliderCanvas();
    }
  };

  const updateManipulatorPositions = {
    colorPicker() {
      // console.log("update Manipulator Positions - color picker");
      let x = okhxyValues.x.value / 100;
      let y = okhxyValues.y.value / 100;
      manipulatorColorPicker.current!.transform.baseVal.getItem(0).setTranslate(picker_size*x, picker_size*(1-y));
    },
    hueSlider() {
      // console.log("update Manipulator Positions - hue slider");
      let hue = okhxyValues.hue.value / 360;
      manipulatorHueSlider.current!.transform.baseVal.getItem(0).setTranslate((slider_size*hue)+6, -1);
    },
    opacitySlider() {
      // console.log("update Manipulator Positions - opacity slider");
      let opacity = shapeInfos.colors[currentFillOrStroke].rgba[3] / 100;
      manipulatorOpacitySlider.current!.transform.baseVal.getItem(0).setTranslate((slider_size*opacity)+6, -1);
    },
    all() {
      this.colorPicker();
      this.hueSlider();
      this.opacitySlider();
    }
  };

  const resetInterface = function() {
    okhxyValues.hue.value = 0;
    okhxyValues.x.value = 0;
    okhxyValues.y.value = 0;
    updateOpacityValue(0);
    shapeInfosResetDefault();

    fillOrStrokeSelector.current!.setAttribute("data-active", "fill");
    updateManipulatorPositions.all();
    render.opacitySliderCanvas();
    render.fillOrStrokeSelector();

    let ctx = colorPicker.current!.getContext("2d");
    ctx!.clearRect(0, 0, colorPicker.current!.width, colorPicker.current!.height);
  };


  /* 
  ** UPDATES FROM UI
  */

  const fillOrStrokeHandle = function() {
    // console.log("fill Or Stroke Handle");

    okhxyValues.isWhite = false;
    okhxyValues.isBlack = false;
    okhxyValues.isGray = false;

    switchFillOrStrokeSelector();

    updateOpacityValue(shapeInfos.colors[currentFillOrStroke].rgba[3]);

    updateOkhxyValuesFromCurrentRgba();
    render.opacitySliderCanvas();
    updateManipulatorPositions.all();
    render.colorPickerCanvas();

    syncCurrentFillOrStrokeWithBackend();
  };


  const colorModelHandle = function(event: any) {
    // console.log("color Model Handle");

    currentColorModel = (event.target as HTMLSelectElement).value;
    
    updateOkhxyValuesFromCurrentRgba();
    updateManipulatorPositions.colorPicker();
    render.colorPickerCanvas();
  };


  const setupHandler = function(canvas: HTMLCanvasElement | HTMLDivElement) {
    // console.log("setup Handler - " + canvas.id);

    const mouseHandler = (event: MouseEvent) => {
      let rect = canvas.getBoundingClientRect();

      let canvas_x: number;
      let canvas_y: number;

      const eventTarget = event.target as HTMLCanvasElement | HTMLDivElement;

      if (mouseHandlerEventTargetId == "") {
        mouseHandlerEventTargetId = eventTarget.id;
      }

      if (mouseHandlerEventTargetId == "okhxy-xy-picker") {
        canvas_x = event.clientX - rect.left;
        canvas_y = event.clientY - rect.top;
        okhxyValues.x.value = Math.round(limitMouseHandlerValue(canvas_x/picker_size) * 100);
        okhxyValues.y.value = Math.round(limitMouseHandlerValue(1 - canvas_y/picker_size) * 100);

        checkIfOkhxyIsWhiteBlackOrGray();
        updateCurrentRgbaFromOkhxyValues();
        
        updateManipulatorPositions.colorPicker();
        render.fillOrStrokeSelector();
        render.opacitySliderCanvas();
      }
      else if (mouseHandlerEventTargetId == "okhxy-h-slider") {
        canvas_y = event.clientX - rect.left;
        okhxyValues.hue.value = Math.round(limitMouseHandlerValue(canvas_y/slider_size) * 360);

        checkIfOkhxyIsWhiteBlackOrGray();
        updateCurrentRgbaFromOkhxyValues();

        updateManipulatorPositions.hueSlider();
        render.all();
      }
      else if (mouseHandlerEventTargetId == "opacity-slider") {
        canvas_y = event.clientX - rect.left;
        updateOpacityValue(Math.round(limitMouseHandlerValue(canvas_y/slider_size) * 100));

        updateManipulatorPositions.opacitySlider();
      }

      sendNewShapeColorToBackend();

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

  const cancelMouseHandler = function() {
    if (activeMouseHandler) {
      activeMouseHandler = undefined;
      mouseHandlerEventTargetId = "";
    }
  };

  document.addEventListener("mouseup", cancelMouseHandler);
  document.addEventListener("mouseleave", cancelMouseHandler);


  const handleInputFocus = function(event: FocusEvent) {
    (event.target as HTMLInputElement).select();
  };

  const hxyInputHandle = function(event: KeyboardEvent) {  
    if (event.key != "ArrowUp" && event.key != "ArrowDown" && event.key != "Enter" && event.key != "Tab") return;

    // console.log("hxy Input Handle");

    if (event.key != "Tab") { event.preventDefault(); }

    const eventTarget = event.target as HTMLInputElement;
    let eventTargetId: string = eventTarget.id;
    let eventTargetValue = parseInt(eventTarget.value);

    if (Number.isNaN(eventTargetValue)) { eventTargetValue = 0; }

    if (event.key == "ArrowUp") eventTargetValue++;
    else if (event.key == "ArrowDown") eventTargetValue--;
    
    // We test user's value and adjust it if enter one outside allowed range.
    if (eventTargetId == "hue") {
      eventTargetValue = clamp(eventTargetValue, 0, 360);
    }
    else if (eventTargetId == "x" || eventTargetId == "y") {
      eventTargetValue = clamp(eventTargetValue, 0, 100);
    }

    if (eventTargetId == "hue" || eventTargetId == "x" || eventTargetId == "y") {
      okhxyValues[eventTargetId].value = eventTargetValue;
    }

    eventTarget.select();
    
    checkIfOkhxyIsWhiteBlackOrGray();
    updateCurrentRgbaFromOkhxyValues();

    if (eventTarget.id == "hue") {
      render.colorPickerCanvas();
      updateManipulatorPositions.hueSlider();
    }
    else if (eventTarget.id == "x" || eventTarget.id == "y") {
      updateManipulatorPositions.colorPicker();
    }

    render.opacitySliderCanvas();
    render.fillOrStrokeSelector();

    sendNewShapeColorToBackend();
  };

  const opacityInputHandle = function(event: KeyboardEvent) {
    if (event.key != "ArrowUp" && event.key != "ArrowDown" && event.key != "Enter" && event.key != "Tab") return;
    
    // console.log("opacity Input Handle"); 

    if (event.key != "Tab") { event.preventDefault(); }

    const eventTarget = event.target as HTMLInputElement;
    let eventTargetValue = parseInt(eventTarget.value);

    if (Number.isNaN(eventTargetValue)) { eventTargetValue = 100; }

    if (event.key == "ArrowUp") eventTargetValue++;
    else if (event.key == "ArrowDown") eventTargetValue--;

    eventTargetValue = clamp(eventTargetValue, 0, 100);

    updateOpacityValue(eventTargetValue);

    eventTarget.select();

    updateManipulatorPositions.opacitySlider();
    sendNewShapeColorToBackend();
  };


  /* 
  ** UPDATES TO BACKEND
  */

  const sendNewShapeColorToBackend = function() {
    // console.log("send New Shape Color To Backend");
    parent.postMessage({ pluginMessage: { type: "Update shape color", "newColor": shapeInfos.colors[currentFillOrStroke].rgba } }, '*');
  };

  const syncCurrentFillOrStrokeWithBackend = function() {
    // console.log("sync CurrentFillOrStroke With Backend");
    parent.postMessage({ pluginMessage: { type: "Sync currentFillOrStroke", "currentFillOrStroke": currentFillOrStroke } }, '*');
  };


  /* 
  ** UPDATES FROM BACKEND
  */

  onmessage = (event) => {
    const pluginMessage: string = event.data.pluginMessage.message;

    if (init) {
      setupHandler(colorPicker.current!);
      setupHandler(hueSlider.current!);
      setupHandler(opacitySlider.current!);

      init = false;
    }

    if (pluginMessage == "new shape color") {
      // console.log("Update from backend - new shape color");

      okhxyValues.isWhite = false;
      okhxyValues.isBlack = false;
      okhxyValues.isGray = false;

      // This value is false by default.
      let shouldRenderColorPickerCanvas: boolean = event.data.pluginMessage.shouldRenderColorPickerCanvas;

      if (UIMessageOn) {
        UIMessage.hide();
        shouldRenderColorPickerCanvas = true;
      }

      if (currentFillOrStroke != event.data.pluginMessage.currentFillOrStroke) {
        switchFillOrStrokeSelector();
        shouldRenderColorPickerCanvas = true;
      }
      
      currentFillOrStroke = event.data.pluginMessage.currentFillOrStroke;
      shapeInfos = JSON.parse(JSON.stringify(event.data.pluginMessage.shapeInfos));

      updateOpacityValue(shapeInfos.colors[currentFillOrStroke].rgba[3]);
      updateOkhxyValuesFromCurrentRgba();
      
      render.opacitySliderCanvas();
      updateManipulatorPositions.all();
      render.fillOrStrokeSelector();

      // We don't render colorPicker if for example user has just deleted the stroke of a shape that had both fill and stroke.
      if (shouldRenderColorPickerCanvas) { render.colorPickerCanvas(); }
    }

    else if (pluginMessage == "Display UI Message") {
      UIMessage.show(event.data.pluginMessage.UIMessageCode, event.data.pluginMessage.nodeType);
    }
  };


  
  return (
    <>
      <div class="c-color-picker">
        <div ref={colorPickerUIMessage} class="c-color-picker__message-wrapper u-display-none">
          <p class="c-color-picker__message-text"></p>
        </div>

        <canvas ref={colorPicker} class="c-color-picker__canvas" id="okhxy-xy-picker" width="240" height="240"></canvas>

        <svg class="c-color-picker__handler" width="240" height="240">
          <g transform="translate(0,0)">
            <g ref={manipulatorColorPicker} transform="translate(0,0)">
              <circle cx="0" cy="0" r="5" fill="none" stroke-width="3" stroke="#555555" ></circle>
              <circle cx="0" cy="0" r="5" fill="none" stroke-width="2.5" stroke="#ffffff" ></circle>
            </g>
          </g>
        </svg>
      </div>

      <div ref={bottomControls}>
        <div class="u-flex u-items-center u-justify-between u-px-16 u-mt-18">

          <div ref={fillOrStrokeSelector} onClick={fillOrStrokeHandle} class="fill-stroke-selector" data-has-fill="true" data-has-stroke="true" data-active="fill" >
            
            <div class="fill-stroke-selector__fill">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle ref={fillOrStrokeSelector_fill} cx="10" cy="10" r="9.5" fill="#FFFFFF" stroke="#AAAAAA"/>
              </svg>
            </div>

            <div class="fill-stroke-selector__stroke">
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

              <svg class="c-slider__handler" width="160" height="12"> 
                <g transform="translate(0,7)">
                  <g ref={manipulatorHueSlider} transform="translate(0,0)">
                    <circle cx="0" cy="0" r="5" fill="none" stroke-width="3" stroke="#555555" ></circle>
                    <circle cx="0" cy="0" r="5" fill="none" stroke-width="2.5" stroke="#ffffff" ></circle>
                  </g>
                </g>
              </svg>
            </div>

            <div class="c-slider u-mt-14">
              <div class="c-slider__canvas" style={opacitySliderStyle}>
                <div ref={opacitySlider} class="u-w-full u-h-full" id="opacity-slider"></div>
              </div>

              <svg class="c-slider__handler" width="160" height="12"> 
                <g transform="translate(0,7)">
                  <g ref={manipulatorOpacitySlider} transform="translate(0,0)">
                    <circle cx="0" cy="0" r="5" fill="none" stroke-width="3" stroke="#555555" ></circle>
                    <circle cx="0" cy="0" r="5" fill="none" stroke-width="2.5" stroke="#ffffff" ></circle>
                  </g>
                </g>
              </svg>
            </div>

          </div>

        </div>

        <div class="c-select-input-controls">
          <div class="select-wrapper">
            <select onChange={colorModelHandle} name="color_model" id="color_model">
              <option value="okhsv">OkHSV</option>
              <option value="okhsl" selected>OkHSL</option>
            </select>
          </div>

          <div class="input-wrapper u-flex u-w-full">
            <input onFocus={handleInputFocus} onKeyDown={hxyInputHandle} id="hue" value={okhxyValues.hue} min="0" max="360" spellcheck={false} />
            <input onFocus={handleInputFocus} onKeyDown={hxyInputHandle} id="x" value={okhxyValues.x} min="0" max="100" spellcheck={false} />
            <input onFocus={handleInputFocus} onKeyDown={hxyInputHandle} id="y" value={okhxyValues.y} min="0" max="100" spellcheck={false} />
            <input ref={opacityInput} onFocus={handleInputFocus} onKeyDown={opacityInputHandle} id="opacity" min="0" max="100" spellcheck={false}></input>
          </div>
        </div>
      </div>
    </>
  );
}