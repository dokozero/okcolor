import { render } from "preact";
import { signal } from "@preact/signals";
import { useRef, useEffect, useState } from "preact/hooks";

import { clampChroma } from "../node_modules/culori/bundled/culori.mjs";

import { colorConversion } from "./utils/color-conversion";
import { pickerSize, lowResPickerSize, lowResPickerSizeOklch, lowResFactor, lowResFactorOklch, oklchChromaScale, debugMode } from "./utils/constants";

import { UIMessageTexts } from "./utils/ui-messages";
import { renderImageData } from "./utils/render-image-data";
import { clampNumber, limitMouseHandlerValue, is2DMovementMoreVerticalOrHorizontal, roundOneDecimal } from "./utils/others";

const opacitysliderBackgroundImg = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAwIAAABUCAYAAAAxg4DPAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAJMSURBVHgB7dlBbQNAEATBcxQky5+Sl4pjAHmdLPnRVQTm3ZrH8/l8nQszc27s7rlhz549e/bs2bNnz569z+39HAAAIEcIAABAkBAAAIAgIQAAAEFCAAAAgoQAAAAECQEAAAgSAgAAECQEAAAgSAgAAECQEAAAgCAhAAAAQUIAAACCHq+3c2F3z42ZOTfs2bNnz549e/bs2bP3uT2PAAAABAkBAAAIEgIAABAkBAAAIEgIAABAkBAAAIAgIQAAAEFCAAAAgoQAAAAECQEAAAgSAgAAECQEAAAgSAgAAEDQ7+6eGzNzbtizZ8+ePXv27NmzZ+/7ex4BAAAIEgIAABAkBAAAIEgIAABAkBAAAIAgIQAAAEFCAAAAgoQAAAAECQEAAAgSAgAAECQEAAAgSAgAAECQEAAAgKDH6+1c2N1zY2bODXv27NmzZ+8/9uzZs2fvbs8jAAAAQUIAAACChAAAAAQJAQAACBICAAAQJAQAACBICAAAQJAQAACAICEAAABBQgAAAIKEAAAABAkBAAAIEgIAABD0u7vnxsycG/bs2bNnz549e/bs2fv+nkcAAACChAAAAAQJAQAACBICAAAQJAQAACBICAAAQJAQAACAICEAAABBQgAAAIKEAAAABAkBAAAIEgIAABAkBAAAIOjxejsXdvfcmJlzw549e/bs2bNnz549e5/b8wgAAECQEAAAgCAhAAAAQUIAAACChAAAAAQJAQAACBICAAAQJAQAACBICAAAQJAQAACAICEAAABBQgAAAIKEAAAABP0BZxb7duWmOFoAAAAASUVORK5CYII=";

// We use a different value for the slider as they take less room.
const slider_size = 148;

const okhxyValues = {
  hue: signal(0),
  x: signal(0),
  y: signal(0),
};

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

let colorPickerCanvas2dContext: CanvasRenderingContext2D | null = null;

let UIMessageOn = false;

// Default choice unless selected shape on launch has no fill.
let currentFillOrStroke = "fill";
let currentColorModel: string;
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

export function App() {
  const [showCssColorCodes, setShowCssColorCodes] = useState<boolean>();
  const [showCopyActionCurrentModelInput, setShowCopyActionCurrentModelInput] = useState(false);
  const [showCopyActionRgbInput, setShowCopyActionRgbInput] = useState(false);
  const [showCopyActionHexInput, setShowCopyActionHexInput] = useState(false);

  useEffect(() => {
    colorPickerCanvas2dContext = colorPickerCanvas.current!.getContext("2d");

    // We launch the init procedure from the plugin (send some values and the color shape if any is selected) when the UI is ready.
    parent.postMessage({ pluginMessage: { type: "init"} }, "*");
  }, []);

  const fillOrStrokeSelector = useRef<HTMLDivElement>(null);
  const fillOrStrokeSelector_fill = useRef<SVGCircleElement>(null);
  const fillOrStrokeSelector_stroke = useRef<SVGPathElement>(null);
  const colorPickerUIMessage = useRef<HTMLDivElement>(null);
  const colorPickerCanvas = useRef<HTMLCanvasElement>(null);
  const hueSlider = useRef<HTMLDivElement>(null);
  const opacitySlider = useRef<HTMLDivElement>(null);
  const manipulatorColorPicker = useRef<SVGGElement>(null);
  const manipulatorHueSlider = useRef<SVGSVGElement>(null);
  const manipulatorOpacitySlider = useRef<SVGSVGElement>(null);
  const opacityInput = useRef<HTMLInputElement>(null);
  const colorModelSelect = useRef<HTMLSelectElement>(null);



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

  const scaleColorPickerCanvas = function() {
    if (debugMode) { console.log("UI: scaleColorPickerCanvas()"); }

    if (currentColorModel === "oklch") {
      colorPickerCanvas.current!.style.transform = `scale(${lowResFactorOklch})`;
      colorPickerCanvas.current!.width = lowResPickerSizeOklch;
      colorPickerCanvas.current!.height = lowResPickerSizeOklch;
    }
    else {
      colorPickerCanvas.current!.style.transform = `scale(${lowResFactor})`;
      colorPickerCanvas.current!.width = lowResPickerSize;
      colorPickerCanvas.current!.height = lowResPickerSize;
    }
  }

  const clampOkhxyValuesChroma = function() {
    if (debugMode) { console.log("UI: clampOkhxyValuesChroma()"); }

    const clamped = clampChroma({ mode: "oklch", l: okhxyValues.y.value/100, c: okhxyValues.x.value/100, h: okhxyValues.hue.value }, "oklch");

    // If we send a pure black to clampChroma (l and c to 0), clamped.c will be undefined.
    if (!clamped.c) {
      okhxyValues.x.value = 0;
    }
    else if (okhxyValues.x.value/100 > clamped.c) {
      okhxyValues.x.value = roundOneDecimal(clamped.c*100);
    }
  }

  const UIMessage = {
    hide() {
      if (debugMode) { console.log("UI: UIMessage.hide()"); }

      UIMessageOn = false;

      document.body.classList.remove("deactivated");
      manipulatorColorPicker.current!.classList.remove("u-display-none");
      colorPickerUIMessage.current!.classList.add("u-display-none");
    },
    show(messageCode: string, nodeType: string) {
      if (debugMode) { console.log(`UI: UIMessage.show(${messageCode}, ${nodeType})`); }

      UIMessageOn = true;

      resetInterface();

      document.body.classList.add("deactivated");
      manipulatorColorPicker.current!.classList.add("u-display-none");
      colorPickerUIMessage.current!.classList.remove("u-display-none");

      let message: string = UIMessageTexts[messageCode];
      if (nodeType !== "") {
        message = message.replace("$SHAPE", nodeType.toLowerCase());
      }
      colorPickerUIMessage.current!.children[0].innerHTML = message;
    }
  };

  // We use a function to update the opacity value in the input because we need to add the "%" sign and doing it directly in the value field with a fignal value doesn't work.
  const updateOpacityValue = function(newValue: number) {
    if (debugMode) { console.log(`UI: updateOpacityValue(${newValue})`); }

    shapeInfos.colors[currentFillOrStroke].rgba[3] = newValue;
    opacityInput.current!.value = `${newValue}%`;
  };

  const switchFillOrStrokeSelector = function() {
    if (debugMode) { console.log("UI: switchFillOrStrokeSelector()"); }
    
    currentFillOrStroke = currentFillOrStroke === "fill" ? "stroke" : "fill";
    fillOrStrokeSelector.current!.setAttribute("data-active", currentFillOrStroke);
  } ;

  const updateOkhxyValuesFromCurrentRgba = function() {
    if (debugMode) { console.log("UI: updateOkhxyValuesFromCurrentRgba()"); }

    let shapeColor = shapeInfos.colors[currentFillOrStroke].rgba.slice(0, 3);
    
    const newOkhxy = colorConversion("rgb", currentColorModel, shapeColor[0], shapeColor[1], shapeColor[2]);

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

    let newRgb = colorConversion(currentColorModel, "rgb", okhxyValues.hue.value, okhxyValues.x.value, okhxyValues.y.value);
    shapeInfos.colors[currentFillOrStroke].rgba = [...newRgb, shapeInfos.colors[currentFillOrStroke].rgba[3]];
  };

  const render = {
    colorPickerCanvas() {
      if (debugMode) { console.log("UI: render.colorPickerCanvas()"); }

      colorPickerCanvas2dContext!.putImageData(renderImageData(okhxyValues.hue.value, currentColorModel), 0, 0);
    },
    fillOrStrokeSelector() {
      if (debugMode) { console.log("UI: render.fillOrStrokeSelector()"); }

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
      if (debugMode) { console.log("UI: render.opacitySliderCanvas()"); }

      opacitySliderStyle.value = `background-image: linear-gradient(to right, rgba(255, 255, 255, 0), rgba(${shapeInfos.colors[currentFillOrStroke].rgba[0]}, ${shapeInfos.colors[currentFillOrStroke].rgba[1]}, ${shapeInfos.colors[currentFillOrStroke].rgba[2]}, 1)), url(${opacitysliderBackgroundImg})`;
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

      let x = okhxyValues.x.value / 100;
      let y = okhxyValues.y.value / 100;

      if (currentColorModel === "oklch") { x *= oklchChromaScale; }

      manipulatorColorPicker.current!.transform.baseVal.getItem(0).setTranslate(pickerSize*x, pickerSize*(1-y));
    },
    hueSlider() {
      if (debugMode) { console.log("UI: updateManipulatorPositions.hueSlider()"); }

      let hue = okhxyValues.hue.value / 360;
      manipulatorHueSlider.current!.transform.baseVal.getItem(0).setTranslate((slider_size*hue)-1, -1);
    },
    opacitySlider() {
      if (debugMode) { console.log("UI: updateManipulatorPositions.opacitySlider()"); }

      let opacity = shapeInfos.colors[currentFillOrStroke].rgba[3] / 100;
      manipulatorOpacitySlider.current!.transform.baseVal.getItem(0).setTranslate((slider_size*opacity)-1, -1);
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

    updateOpacityValue(0);
    shapeInfosResetDefault();

    fillOrStrokeSelector.current!.setAttribute("data-active", "fill");
    updateManipulatorPositions.all();
    render.opacitySliderCanvas();
    render.fillOrStrokeSelector();

    colorPickerCanvas2dContext!.clearRect(0, 0, colorPickerCanvas.current!.width, colorPickerCanvas.current!.height);
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


  const fillOrStrokeHandle = function() {
    if (debugMode) { console.log("UI: fillOrStrokeHandle()"); }

    switchFillOrStrokeSelector();

    updateOpacityValue(shapeInfos.colors[currentFillOrStroke].rgba[3]);

    updateOkhxyValuesFromCurrentRgba();
    render.opacitySliderCanvas();
    updateManipulatorPositions.all();
    render.colorPickerCanvas();

    syncCurrentFillOrStrokeWithPlugin();
  };

  const colorModelHandle = function(event: any) {
    if (debugMode) { console.log("UI: colorModelHandle()"); }

    currentColorModel = (event.target as HTMLSelectElement).value;

    syncCurrentColorModelWithPlugin();

    scaleColorPickerCanvas();
    
    updateOkhxyValuesFromCurrentRgba();
    updateManipulatorPositions.all();
    render.colorPickerCanvas();
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
        if (shiftKeyPressed && !moveVerticallyOnly && !moveHorizontallyOnly) {
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

        if ((shiftKeyPressed && moveVerticallyOnly) || !shiftKeyPressed) {
          const newYValue = Math.round(limitMouseHandlerValue(1 - canvasY/pickerSize) * 100);

          if (ctrlKeyPressed && newYValue % 5 === 0) {
            okhxyValues.y.value = newYValue;
          }
          else if (!ctrlKeyPressed) {
            okhxyValues.y.value = newYValue;
          }

          if (currentColorModel === "oklch") {
            clampOkhxyValuesChroma();
          }
        }

        if ((shiftKeyPressed && moveHorizontallyOnly) || !shiftKeyPressed) {
          const newXValue = Math.round(limitMouseHandlerValue(canvasX/pickerSize) * 100);

          if (currentColorModel === "oklch") {
            if (ctrlKeyPressed) {
              okhxyValues.x.value = Math.round(newXValue / oklchChromaScale);
            }
            else if (!ctrlKeyPressed) {
              okhxyValues.x.value = roundOneDecimal(newXValue / oklchChromaScale);
            }
            clampOkhxyValuesChroma();
          }
          else {
            if (ctrlKeyPressed && newXValue % 5 === 0) {
              okhxyValues.x.value = newXValue;
            }
            else if (!ctrlKeyPressed) {
              okhxyValues.x.value = newXValue;
            }
          }
        }

        updateCurrentRgbaFromOkhxyValues();
        
        updateManipulatorPositions.colorPicker();
        render.fillOrStrokeSelector();
        render.opacitySliderCanvas();
      }
      else if (mouseHandlerEventTargetId === "okhxy-h-slider") {
        canvasY = event.clientX - rect.left - 7;
        okhxyValues.hue.value = Math.round(limitMouseHandlerValue(canvasY/slider_size) * 360);

        if (currentColorModel === "oklch") {
          clampOkhxyValuesChroma();
          updateManipulatorPositions.colorPicker();
        }

        updateCurrentRgbaFromOkhxyValues();

        updateManipulatorPositions.hueSlider();
        render.all();
      }
      else if (mouseHandlerEventTargetId === "opacity-slider") {
        canvasY = event.clientX - rect.left - 7;
        updateOpacityValue(Math.round(limitMouseHandlerValue(canvasY/slider_size) * 100));

        updateManipulatorPositions.opacitySlider();
      }

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

  const inputHandler = function(event: KeyboardEvent | FocusEvent) {
    if (debugMode) { console.log("UI: InputHandler()"); }

    // To handle rare case where user could have entered a new value on an input but without validating it (like pressing "Enter") and then selecting another shape, without this check the new value of the input would be set on the new shape as the blur event would still trigger when user click on it.
    if (event.type === "blur" && mouseInsideDocument === false) { return; }

    const inputHandlesAllowedKeys = ["ArrowUp", "ArrowDown", "Enter", "Tab", "Escape"];
    const key = "key" in event ? event.key : "";

    if (!inputHandlesAllowedKeys.includes(key) && event.type !== "blur") { return; }
    
    if (key !== "Tab") { event.preventDefault(); }

    const eventTarget = event.target as HTMLInputElement;
    const eventTargetId: string = eventTarget.id;

    let eventTargetValue: number;

    let incrementValue: number;

    if (currentColorModel === "oklch" && eventTargetId === "x") {
      // If we are in OkLCH and user is changing the chroma value, he can enter a decimal value hence the parseFloat().
      eventTargetValue = roundOneDecimal(parseFloat(eventTarget.value));
    }
    else {
      // For all others inputs, we parse the value with parseInt to remove the decimals if user uses them.
      eventTargetValue = parseInt(eventTarget.value);
    }
    
    // If Not a Number we insert back the old value.
    if (Number.isNaN(eventTargetValue)) {
      if (eventTargetId === "hue" || eventTargetId === "x" || eventTargetId === "y") {
        eventTarget.value = okhxyValues[eventTargetId].value.toString();
      }
      else if (eventTargetId === "opacity") {
        updateOpacityValue(shapeInfos.colors[currentFillOrStroke].rgba[3]);
      }
      if (event.type !== "blur") { eventTarget.select(); }
      return;
    }

    // If we are in OkLCH and user is changing the chroma value, we use 0.1 for a more precise choice.
    if (currentColorModel === "oklch" && eventTargetId === "x") {
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
    const maxValue = eventTargetId === "hue" ? 360 : 100;
    eventTargetValue = clampNumber(eventTargetValue, 0, maxValue);
    
    let oldValue: number;

    if (eventTargetId === "hue" || eventTargetId === "x" || eventTargetId === "y") {
      oldValue = okhxyValues[eventTargetId].value;

      // We have to update input's value like this because if we don't we'll have some issues. For example if user set 0 on an input then -10 the signal will not update after the test because il will already be at 0 and thus will not refresh (from Preact's doc: "A signal will only update if you assign a new value to it"). Another example, without this code if user try to enter "5t" more than two times, the input value will stay at "5t".
      if (key !== "Escape" && okhxyValues[eventTargetId].value !== eventTargetValue) {
        // use roundOneDecimal() again because in some case we can have values like "3.8000000000000003" when using the up or down arrow keys.
        okhxyValues[eventTargetId].value = roundOneDecimal(eventTargetValue);
      }
      else {
        eventTarget.value = oldValue.toString();
      }
      
      if (currentColorModel === "oklch") {
        clampOkhxyValuesChroma();
      }

      updateCurrentRgbaFromOkhxyValues();

      if (eventTargetId === "hue") {
        render.colorPickerCanvas();
        updateManipulatorPositions.hueSlider();
      }
      
      // We test if currentColorModel === "oklch" because if we modify the hue there is a chance that the chroma value is now out of range and thus we need to update the color picker.
      if (eventTargetId === "x" || eventTargetId === "y" || currentColorModel === "oklch") {
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
    }

    if (event.type !== "blur") { eventTarget.select(); }
    sendNewShapeColorToPlugin();
  };



  /* 
  ** UPDATES TO PLUGIN
  */

  const sendNewShapeColorToPlugin = function() {
    if (debugMode) { console.log("UI: sendNewShapeColorToPlugin()"); }

    parent.postMessage({ pluginMessage: { type: "updateShapeColor", "newColor": shapeInfos.colors[currentFillOrStroke].rgba } }, "*");
  };

  const syncCurrentFillOrStrokeWithPlugin = function() {
    if (debugMode) { console.log("UI: syncCurrentFillOrStrokeWithPlugin()"); }

    parent.postMessage({ pluginMessage: { type: "syncCurrentFillOrStroke", "currentFillOrStroke": currentFillOrStroke } }, "*");
  };

  const syncCurrentColorModelWithPlugin = function() {
    if (debugMode) { console.log("UI: syncCurrentColorModelWithPlugin()"); }

    parent.postMessage({ pluginMessage: { type: "syncCurrentColorModel", "currentColorModel": currentColorModel } }, "*");
  }

  useEffect(() => {   
    if (debugMode) { console.log("UI: syncShowCssColorCodes()"); }
    
    // We check first if showCssColorCodes if undefined because we don't want to sync with the plugin on first render.
    if (showCssColorCodes !== undefined) {
     parent.postMessage({ pluginMessage: { type: "syncShowCssColorCodes", "showCssColorCodes": showCssColorCodes } }, "*");
    }
  }, [showCssColorCodes]);



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

      currentColorModel = event.data.pluginMessage.data.currentColorModel;
      setShowCssColorCodes(event.data.pluginMessage.data.showCssColorCodes);

      // We do this to avoid flickering on loading.
      colorModelSelect.current!.style.opacity = "1";

      colorModelSelect.current!.value = currentColorModel;

      scaleColorPickerCanvas();
    }

    if (pluginMessage === "newShapeColor") {
      // This value is false by default.
      let shouldRenderColorPickerCanvas: boolean = event.data.pluginMessage.shouldRenderColorPickerCanvas;

      if (UIMessageOn) {
        UIMessage.hide();
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
      
      render.opacitySliderCanvas();
      updateManipulatorPositions.all();
      render.fillOrStrokeSelector();

      // We don't render colorPicker if for example user has just deleted the stroke of a shape that had both fill and stroke.
      if (shouldRenderColorPickerCanvas) { render.colorPickerCanvas(); }
    }

    else if (pluginMessage === "displayUIMessage") {
      UIMessage.show(event.data.pluginMessage.UIMessageCode, event.data.pluginMessage.nodeType);
    }
  };


  
  return (
    <>
      <div class="c-color-picker" style={`width: ${pickerSize}px; height: ${pickerSize}px;`}>
        <div ref={colorPickerUIMessage} class="c-color-picker__message-wrapper u-display-none">
          <p class="c-color-picker__message-text"></p>
        </div>

        <canvas ref={colorPickerCanvas} class="c-color-picker__canvas" id="okhxy-xy-picker"></canvas>

        <svg class="c-color-picker__handler" width={pickerSize} height={pickerSize}>
          <g ref={manipulatorColorPicker} transform="translate(0,0)">
            <circle cx="0" cy="0" r="4.8" fill="none" stroke-width="2.8" stroke="#555555" ></circle>
            <circle cx="0" cy="0" r="4.8" fill="none" stroke-width="2.5" stroke="#ffffff" ></circle>
          </g>
        </svg>
      </div>

      <div class="c-bottom-controls">
        <div class="u-flex u-items-center u-justify-between u-px-16 u-mt-18">

          <div class="fill-stroke-selector" ref={fillOrStrokeSelector} onClick={fillOrStrokeHandle} data-has-fill="true" data-has-stroke="true" data-active="fill" >
            
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

              <div class="c-slider__handler">
                <svg ref={manipulatorHueSlider} transform="translate(0,0)" width="14" height="14">
                  <circle cx="7" cy="7" r="4.8" fill="none" stroke-width="2.8" stroke="#555555" ></circle>
                  <circle cx="7" cy="7" r="4.8" fill="none" stroke-width="2.5" stroke="#ffffff" ></circle>
                </svg>
              </div>
            </div>

            <div class="c-slider u-mt-14">
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
            </select>

          </div>

          <div class="input-wrapper c-select-input-controls__input-wrapper">
            <input onFocus={handleInputFocus} onBlur={inputHandler} onKeyDown={inputHandler} id="hue" value={okhxyValues.hue} spellcheck={false} />
            <input onFocus={handleInputFocus} onBlur={inputHandler} onKeyDown={inputHandler} id="x" value={okhxyValues.x} spellcheck={false} />
            <input onFocus={handleInputFocus} onBlur={inputHandler} onKeyDown={inputHandler} id="y" value={okhxyValues.y} spellcheck={false} />
            <input ref={opacityInput} onFocus={handleInputFocus} onBlur={inputHandler} onKeyDown={inputHandler} id="opacity" spellcheck={false} />
          </div>
        </div>

        <div class="c-css-colors">

          <div class="u-flex">
            <p class="c-css-colors__title" onClick={ () => setShowCssColorCodes(!showCssColorCodes) }>CSS color codes</p>
            
            <div class="c-css-colors__arrow-icon">
              <svg class="svg" width="8" height="8" viewBox="0 0 8 8" xmlns="http://www.w3.org/2000/svg"><path d="M.646 4.647l.708.707L4 2.707l2.646 2.647.708-.707L4 1.293.646 4.647z" fill-rule="nonzero" fill-opacity="1" fill="#fff" stroke="none"></path></svg>
            </div>
          </div>

          {showCssColorCodes && (
            <div class="u-mt-12 u-px-8">
              <div class="input-wrapper" onMouseEnter={() => setShowCopyActionCurrentModelInput(true)} onMouseLeave={() => setShowCopyActionCurrentModelInput(false)}>
                <input type="text" value="oklch(58.53% 0.195 258.5)" />
                { showCopyActionCurrentModelInput && <div class="c-css-colors__copy-action">Copy</div> }
              </div>

              <div class="input-wrapper u-mt-4" onMouseEnter={() => setShowCopyActionRgbInput(true)} onMouseLeave={() => setShowCopyActionRgbInput(false)}>
                <input type="text" value="rgb(201, 130, 259)" />
                { showCopyActionRgbInput && <div class="c-css-colors__copy-action">Copy</div> }
              </div>

              <div class="input-wrapper u-mt-4" onMouseEnter={() => setShowCopyActionHexInput(true)} onMouseLeave={() => setShowCopyActionHexInput(false)}>
                <input type="text" value="#501CFB" />
                { showCopyActionHexInput && <div class="c-css-colors__copy-action">Copy</div> }
              </div>
            </div>
          )}

        </div>
      </div>

    </>
  );
}

render(<App />, document.getElementById("root") as HTMLElement);