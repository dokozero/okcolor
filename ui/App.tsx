import { signal } from "@preact/signals";
import { useRef } from "preact/hooks";

import { colorConversion } from "../lib/bottosson/colorconversion";
import { render, render_okhsl } from "../lib/bottosson/render";
import { eps } from "../lib/bottosson/constants";

import { UIMessageTexts } from "./ui-messages";


const opacitysliderBackgroundImg = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAwIAAABUCAYAAAAxg4DPAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAJMSURBVHgB7dlBbQNAEATBcxQky5+Sl4pjAHmdLPnRVQTm3ZrH8/l8nQszc27s7rlhz549e/bs2bNnz569z+39HAAAIEcIAABAkBAAAIAgIQAAAEFCAAAAgoQAAAAECQEAAAgSAgAAECQEAAAgSAgAAECQEAAAgCAhAAAAQUIAAACCHq+3c2F3z42ZOTfs2bNnz549e/bs2bP3uT2PAAAABAkBAAAIEgIAABAkBAAAIEgIAABAkBAAAIAgIQAAAEFCAAAAgoQAAAAECQEAAAgSAgAAECQEAAAgSAgAAEDQ7+6eGzNzbtizZ8+ePXv27NmzZ+/7ex4BAAAIEgIAABAkBAAAIEgIAABAkBAAAIAgIQAAAEFCAAAAgoQAAAAECQEAAAgSAgAAECQEAAAgSAgAAECQEAAAgKDH6+1c2N1zY2bODXv27NmzZ+8/9uzZs2fvbs8jAAAAQUIAAACChAAAAAQJAQAACBICAAAQJAQAACBICAAAQJAQAACAICEAAABBQgAAAIKEAAAABAkBAAAIEgIAABD0u7vnxsycG/bs2bNnz549e/bs2fv+nkcAAACChAAAAAQJAQAACBICAAAQJAQAACBICAAAQJAQAACAICEAAABBQgAAAIKEAAAABAkBAAAIEgIAABAkBAAAIOjxejsXdvfcmJlzw549e/bs2bNnz549e5/b8wgAAECQEAAAgCAhAAAAQUIAAACChAAAAAQJAQAACBICAAAQJAQAACBICAAAQJAQAACAICEAAABBQgAAAIKEAAAABP0BZxb7duWmOFoAAAAASUVORK5CYII=";

// We don't use the picker_size constant from the constants file because if we modify we got a display bug with the results from the render function in render.js
const picker_size = 240;

// We use a different value for the slider as they take less room.
const slider_size = 148;

const okhxyValues = {
  hue: signal(0),
  x: signal(0),
  y: signal(0)
};

const opacitySliderStyle = signal("");


let init = true;

let UIMessageOn = false;

let currentColorDefault = {
  r: 255,
  g: 255,
  b: 255,
  opacity: 0
};

let currentColor = Object.assign({}, currentColorDefault);

// Default choice unless selected shape on launch has no fill.
let currentFillOrStroke = "fill";
let currentColorModel = "okhsl";

let activeMouseHandler = null;

// This var is to let user move the manipulators outside of their zone, if not the event of the others manipulator will trigger if keep the mousedown and go to other zones.
let mouseHandlerEventTargetId = "";

let shapeInfosDefault = {
  hasFillStroke: {
    fill: true,
    stroke: true
  },
  colors: {
    fill: {
      r: 255,
      g: 255,
      b: 255,
      opacity: 0,
    },
    stroke: {
      r: 255,
      g: 255,
      b: 255,
      opacity: 0
    }
  }
}

let shapeInfos = JSON.parse(JSON.stringify(shapeInfosDefault));

export function App() { 
  // We could use one canvas element but better no to avoid flickering when user change color model 
  const fillOrStrokeSelector = useRef(null);
  const fillOrStrokeSelector_fill = useRef(null);
  const fillOrStrokeSelector_stroke = useRef(null);
  const colorPickerUIMessage = useRef(null);
  const colorPicker = useRef(null);
  const hueSlider = useRef(null);
  const opacitySlider = useRef(null);
  const manipulatorColorPicker = useRef(null);
  const manipulatorHueSlider = useRef(null);
  const manipulatorOpacitySlider = useRef(null);
  const opacityInput = useRef(null);
  const bottomControls = useRef(null);

  console.log("Enter");
  


  /*
  ** HELPER FUNCTIONS
  */

  function clamp(num, min, max) {
    if (num < min) {
      return min;
    }
    else if (num > max) {
      return max;
    }
    return num;
  }

  function limitMouseHandlerValue(x) {
    return x < eps ? eps : (x > 1-eps ? 1-eps : x);
  }


  

  /* 
  ** UPDATES TO UI
  */

  const UIMessage = {
    hide() {
      UIMessageOn = false;

      bottomControls.current.classList.remove("u-deactivated");
      manipulatorColorPicker.current.classList.remove("u-display-none");
      colorPickerUIMessage.current.classList.add("u-display-none");
    },
    show(messageCode: string, nodeType: string) {
      UIMessageOn = true;

      resetInterface();

      bottomControls.current.classList.add("u-deactivated");
      manipulatorColorPicker.current.classList.add("u-display-none");
      colorPickerUIMessage.current.classList.remove("u-display-none");

      let message: string = UIMessageTexts[messageCode];
      if (nodeType != "") {
        message = message.replace("$SHAPE", nodeType.toLowerCase());
      }
      colorPickerUIMessage.current.children[0].innerHTML = message;
    }
  }

  // We use a function to update the opacity value in the input because we need to add the "%" sign and doing it directly in the value field with a fignal value doesn't work.
  function updateOpacityValue(newValue: number) {
    currentColor.opacity = newValue;
    opacityInput.current.value = `${newValue}%`;
  }


  function switchFillOrStrokeSelector() {
    if (currentFillOrStroke == "fill") {
      currentFillOrStroke = "stroke";
      fillOrStrokeSelector.current.setAttribute("data-active", "stroke");
    }
    else {
      currentFillOrStroke = "fill";
      fillOrStrokeSelector.current.setAttribute("data-active", "fill");
    }
  }


  function updateOkhxyValuesFromCurrentColor() {
    // console.log("convert Rgb To Okhxy Values");

    let newOkhxy = colorConversion("srgb", currentColorModel, currentColor.r, currentColor.g, currentColor.b);

    okhxyValues.hue.value = newOkhxy[0];
    okhxyValues.x.value = newOkhxy[1];
    okhxyValues.y.value = newOkhxy[2];
  }


  function renderColorPickerCanvas() {
    // console.log("render Color Picker Canvas");

    let results;
    let ctx = colorPicker.current.getContext("2d");

    // If we don't to this and for exemple we start the plugin with a [0, 0, 0] fill, the color picker hue will be red while the hue picker will be orange. Seems to be an inconsistency with the render functions.
    if (currentColor.r == 0 && currentColor.g == 0 && currentColor.b == 0) {
      currentColor.r = currentColor.g = currentColor.b = 0.01;
    }

    if (currentColorModel == "okhsl") {
      results = render_okhsl(currentColor.r, currentColor.g, currentColor.b);
      ctx.putImageData(results["okhsl_sl"], 0, 0);
    }
    else if (currentColorModel == "okhsv") {
      results = render(currentColor.r, currentColor.g, currentColor.b);
      ctx.putImageData(results["okhsv_sv"], 0, 0);
    }
    // else if (colorModel == "oklch") {
    //   results = render(currentColor.r, currentColor.r, currentColor.r);
    //   ctx.putImageData(results["oklch_lc"], 0, 0);
    // }
  }

  function renderOpacitySliderCanvas() {
    // console.log("render opacity Slider Canvas");
    opacitySliderStyle.value = `background-image: linear-gradient(to right, rgba(255, 255, 255, 0), rgba(${currentColor.r}, ${currentColor.g}, ${currentColor.b}, 1)), url(${opacitysliderBackgroundImg})`;
  }

  function renderFillOrStrokeSelector() {
    if (shapeInfos.hasFillStroke.fill && shapeInfos.hasFillStroke.stroke) {
      fillOrStrokeSelector.current.classList.remove("u-pointer-events-none");
    } else {
      fillOrStrokeSelector.current.classList.add("u-pointer-events-none");
    }
    
    fillOrStrokeSelector.current.setAttribute("data-has-fill", shapeInfos.hasFillStroke.fill);
    fillOrStrokeSelector.current.setAttribute("data-has-stroke", shapeInfos.hasFillStroke.stroke);
    
    fillOrStrokeSelector_fill.current.setAttribute("fill", shapeInfos.hasFillStroke.fill ? `rgb(${shapeInfos.colors.fill.r}, ${shapeInfos.colors.fill.g}, ${shapeInfos.colors.fill.b})` : "none");
    fillOrStrokeSelector_stroke.current.setAttribute("fill", shapeInfos.hasFillStroke.stroke ? `rgb(${shapeInfos.colors.stroke.r}, ${shapeInfos.colors.stroke.g}, ${shapeInfos.colors.stroke.b})` : "none");
  }


  function resetInterface() {
    okhxyValues.hue.value = 0;
    okhxyValues.x.value = 0;
    okhxyValues.y.value = 0;
    updateOpacityValue(0);
    currentColor = Object.assign({}, currentColorDefault);
    shapeInfos = JSON.parse(JSON.stringify(shapeInfosDefault));

    fillOrStrokeSelector.current.setAttribute("data-active", "fill");
    updateManipulatorPositions.all();
    renderOpacitySliderCanvas();
    renderFillOrStrokeSelector();

    let ctx = colorPicker.current.getContext("2d");
    ctx.clearRect(0, 0, colorPicker.current.width, colorPicker.current.height);
  }

  const updateManipulatorPositions = {
    colorPicker() {
      // console.log("update Manipulator Positions - color picker");
      let x = okhxyValues.x.value / 100;
      let y = okhxyValues.y.value / 100;
      manipulatorColorPicker.current.transform.baseVal.getItem(0).setTranslate(picker_size*x, picker_size*(1-y));
    },
    hueSlider() {
      // console.log("update Manipulator Positions - hue slider");
      let hue = okhxyValues.hue.value / 360;
      manipulatorHueSlider.current.transform.baseVal.getItem(0).setTranslate((slider_size*hue)+6, -1);
    },
    opacitySlider() {
      // console.log("update Manipulator Positions - opacity slider");
      let opacity = currentColor.opacity / 100;
      manipulatorOpacitySlider.current.transform.baseVal.getItem(0).setTranslate((slider_size*opacity)+6, -1);
    },
    all() {
      this.colorPicker();
      this.hueSlider();
      this.opacitySlider();
    }
  }


  /* 
  ** UPDATES FROM UI
  */

  function fillOrStrokeHandle() {
    // console.log("fill Or Stroke Handle");

    switchFillOrStrokeSelector();

    if (currentFillOrStroke == "fill") {
      currentColor = shapeInfos.colors.fill;
    }
    if (currentFillOrStroke == "stroke") {
      currentColor = shapeInfos.colors.stroke;
    }

    updateOpacityValue(currentColor.opacity);

    updateOkhxyValuesFromCurrentColor();
    renderOpacitySliderCanvas();
    updateManipulatorPositions.all();
    renderColorPickerCanvas();

    syncCurrentFillOrStrokeWithBackend();
  }


  function colorModelHandle(event) {
    // console.log("color Model Handle");

    currentColorModel = event.target.value;
    
    updateOkhxyValuesFromCurrentColor();
    updateManipulatorPositions.colorPicker();
    renderColorPickerCanvas();
  }


  function setupHandler(canvas) {
    // console.log("setup Handler - " + canvas.id);

    const mouseHandler = (event) => {
      let rect = canvas.getBoundingClientRect();

      let canvas_x: number;
      let canvas_y: number;

      if (mouseHandlerEventTargetId == "") {
        mouseHandlerEventTargetId = event.target.id;
      }

      if (mouseHandlerEventTargetId == "okhxy-xy-picker") {
        canvas_x = event.clientX - rect.left;
        canvas_y = event.clientY - rect.top;
        okhxyValues.x.value = Math.round(limitMouseHandlerValue(canvas_x/picker_size) * 100);
        okhxyValues.y.value = Math.round(limitMouseHandlerValue(1 - canvas_y/picker_size) * 100);

        Object.assign(currentColor, colorConversion(currentColorModel, "srgb", okhxyValues.hue.value, okhxyValues.x.value, okhxyValues.y.value));

        // Temp note - oklch code 1
        
        updateManipulatorPositions.colorPicker();
        renderFillOrStrokeSelector();
        renderOpacitySliderCanvas();
      }
      else if (mouseHandlerEventTargetId == "okhxy-h-slider") {
        canvas_y = event.clientX - rect.left;
        okhxyValues.hue.value = Math.round(limitMouseHandlerValue(canvas_y/slider_size) * 360);

        // We do this to be abble to change the hue value on the color picker canvas when we have a white or black value. If we don't to this fix, the hue value will always be the same on the color picker canvas.
        let x = clamp(okhxyValues.x.value, 0.1, 99.9);
        let y = clamp(okhxyValues.y.value, 0.1, 99.9);

        Object.assign(currentColor, colorConversion(currentColorModel, "srgb", okhxyValues.hue.value, x, y));

        // Temp note - oklch code 2
      
        updateManipulatorPositions.hueSlider();
        renderFillOrStrokeSelector();
        renderOpacitySliderCanvas();

        renderColorPickerCanvas();
      }
      else if (mouseHandlerEventTargetId == "opacity-slider") {
        canvas_y = event.clientX - rect.left;
        updateOpacityValue(Math.round(limitMouseHandlerValue(canvas_y/slider_size) * 100));

        updateManipulatorPositions.opacitySlider();
      }

      sendNewShapeColorToBackend();

    };

    canvas.addEventListener("mousedown", function(event) {
      activeMouseHandler = mouseHandler;
      activeMouseHandler(event);
    });
  }

  document.addEventListener("mousemove", function(event) {
    if (activeMouseHandler !== null) {
      activeMouseHandler(event);  
    }
  });

  function cancelMouseHandler() {
    if (activeMouseHandler !== null) {
      activeMouseHandler = null;
      mouseHandlerEventTargetId = "";
    }
  }

  document.addEventListener("mouseup", cancelMouseHandler);
  document.addEventListener("mouseleave", cancelMouseHandler);


  function handleInputFocus(event) {
    event.target.select();
  }

  function hxyInputHandle(event) {  
    if (event.key != "ArrowUp" && event.key != "ArrowDown" && event.key != "Enter" && event.key != "Tab") return;

    // console.log("hxy Input Handle");

    if (event.key != "Tab") { event.preventDefault(); }

    let eventTargetId: string = event.target.id;
    let eventTargetValue = parseInt(event.target.value);

    if (event.key == "ArrowUp") eventTargetValue++;
    else if (event.key == "ArrowDown") eventTargetValue--;
    
    // We test user's value and adjust it if enter one outside allowed range.
    if (eventTargetId == "hue") {
      eventTargetValue = clamp(eventTargetValue, 0, 360);
    }
    else if (eventTargetId == "x" || eventTargetId == "y") {
      eventTargetValue = clamp(eventTargetValue, 0, 100);
    }

    if (Number.isNaN(eventTargetValue)) {
      eventTargetValue = 0;
    }

    okhxyValues[eventTargetId].value = eventTargetValue;

    event.target.select();

    if (event.target.id == "hue") {
      let x = clamp(okhxyValues.x.value, 0.01, 99.99);
      let y = clamp(okhxyValues.y.value, 0.01, 99.99);
      Object.assign(currentColor, colorConversion(currentColorModel, "srgb", okhxyValues.hue.value, x, y));
    }
    else {
      Object.assign(currentColor, colorConversion(currentColorModel, "srgb", okhxyValues.hue.value, okhxyValues.x.value, okhxyValues.y.value));
    }

    sendNewShapeColorToBackend();

    if (event.target.id == "hue") {
      renderColorPickerCanvas();
      updateManipulatorPositions.hueSlider();
    }
    else {
      updateManipulatorPositions.colorPicker();
    }

    if (event.target.id != "opacity") {
      renderOpacitySliderCanvas();
      renderFillOrStrokeSelector();
    }
  }

  function opacityInputHandle(event) {
    if (event.key != "ArrowUp" && event.key != "ArrowDown" && event.key != "Enter" && event.key != "Tab") return;
    
    console.log("opacity Input Handle"); 

    if (event.key != "Tab") { event.preventDefault(); }

    let eventTargetValue = parseInt(event.target.value);

    if (event.key == "ArrowUp") eventTargetValue++;
    else if (event.key == "ArrowDown") eventTargetValue--;

    eventTargetValue = clamp(eventTargetValue, 0, 100);

    if (Number.isNaN(eventTargetValue)) {
      eventTargetValue = 100;
    }

    updateOpacityValue(eventTargetValue);

    event.target.select();

    updateManipulatorPositions.opacitySlider();

    sendNewShapeColorToBackend();
  }


  /* 
  ** UPDATES TO BACKEND
  */

  function sendNewShapeColorToBackend() {
    // console.log("update Shape Color");
    parent.postMessage({ pluginMessage: { type: "Update shape color", "newColor": currentColor } }, '*');
  }

  function syncCurrentFillOrStrokeWithBackend() {
    parent.postMessage({ pluginMessage: { type: "Sync currentFillOrStroke", "currentFillOrStroke": currentFillOrStroke } }, '*');
  }


  /* 
  ** UPDATES FROM BACKEND
  */

  onmessage = (event) => {
    const pluginMessage = event.data.pluginMessage.message;

    if (init) {
      // console.log("- Init function");

      setupHandler(colorPicker.current);
      setupHandler(hueSlider.current);
      setupHandler(opacitySlider.current);

      // console.log("- End init function");
      init = false;
    }

    if (pluginMessage == "new shape color") {
      // console.log("Update from backend - new shape color");

      // This value is false by default.
      let shouldRenderColorPickerCanvas = event.data.pluginMessage.shouldRenderColorPickerCanvas;

      if (UIMessageOn) {
        UIMessage.hide();
        shouldRenderColorPickerCanvas = true;
      }

      if (currentFillOrStroke != event.data.pluginMessage.currentFillOrStroke) {
        switchFillOrStrokeSelector();
        shouldRenderColorPickerCanvas = true;
      }
      
      currentFillOrStroke = event.data.pluginMessage.currentFillOrStroke;
      shapeInfos = event.data.pluginMessage.shapeInfos;
      
      
      if (currentFillOrStroke == "fill") {
        currentColor = event.data.pluginMessage.shapeInfos.colors.fill;
      }
      if (currentFillOrStroke == "stroke") {
        currentColor = event.data.pluginMessage.shapeInfos.colors.stroke;
      }

      updateOpacityValue(currentColor.opacity);

      updateOkhxyValuesFromCurrentColor();
      renderOpacitySliderCanvas();
      updateManipulatorPositions.all();
      renderFillOrStrokeSelector();

      // We don't render colorPicker if for example user has just deleted the stroke of a shape that had both.
      if (shouldRenderColorPickerCanvas) {
        renderColorPickerCanvas();
      }
    }

    else if (pluginMessage == "Display UI Message") {
      UIMessage.show(event.data.pluginMessage.UIMessageCode, event.data.pluginMessage.nodeType);
    }
  }


  
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
              <circle cx="0" cy="0" r="5" fill="none" stroke-width="1.5" stroke="#ffffff" ></circle>
              <circle cx="0" cy="0" r="6" fill="none" stroke-width="1" stroke="#e0e0e0" ></circle>
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
                    <circle cx="0" cy="0" r="4.5" fill="none" stroke-width="1.5" stroke="#ffffff" ></circle>
                    <circle cx="0" cy="0" r="5.5" fill="none" stroke-width="1" stroke="#e0e0e0" ></circle>
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
                    <circle cx="0" cy="0" r="4.5" fill="none" stroke-width="1.5" stroke="#ffffff" ></circle>
                    <circle cx="0" cy="0" r="5.5" fill="none" stroke-width="1" stroke="#e0e0e0" ></circle>
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
  )
}