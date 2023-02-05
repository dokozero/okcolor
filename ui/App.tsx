import { signal } from "@preact/signals";
import { useRef } from "preact/hooks";

import { colorConversion } from "../lib/bottosson/colorconversion";
import { render, render_okhsl } from "../lib/bottosson/render";
import { eps } from "../lib/bottosson/constants";

import { uiMessageTexts } from "./ui-messages";

// We don't use the picker_size constant from the constants file because if we modify we got a display bug with the results from the render function in render.js
const picker_size = 240;

// We use a different value for the slider as they take less room.
const slider_size = 170;

const okhxyValues = {
  hue: signal(0),
  x: signal(0),
  y: signal(0)
};

const opacityValue = signal(100);

export function App() { 

  /*
  ** VARIABLES DECLARATIONS
  */

  // We could use one canvas element but better no to avoid flickering when user change color model 
  const fillOrStrokeSelector = useRef(null);
  const canvasUiMessage = useRef(null);
  const canvasColorPicker = useRef(null);
  const canvasHueSlider = useRef(null);
  const canvasOpacitySlider = useRef(null);
  const manipulatorColorPicker = useRef(null);
  const manipulatorHueSlider = useRef(null);
  const manipulatorOpacitySlider = useRef(null);

  let init: boolean = true;

  let uiMessageOn: boolean = false;

  type ShapeFillStrokeInfo = {
    "hasFill": boolean,
    "hasStroke": boolean
  };

  let shapeFillStrokeInfo: ShapeFillStrokeInfo;

  let rgbValues: number[] = [0, 0, 0];

  // Default choice unless selected shape on launch has no fill.
  let currentFillOrStroke: string = "fill";
  let currentColorModel: string = "okhsl";

  let activeMouseHandler = null;

  // This var is to let user move the manipulators outside of their zone, if not the event of the others manipulator will trigger if keep the mousedown and go to other zones.
  let mouseHandlerEventTargetId = "";




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

  const uiMessage = {
    hide() {
      uiMessageOn = false;

      manipulatorColorPicker.current.classList.remove("u-display-none");
      canvasUiMessage.current.classList.add("u-display-none");
    },
    show(messageCode) {
      uiMessageOn = true;

      let ctx = canvasColorPicker.current.getContext("2d");
      ctx.clearRect(0, 0, canvasColorPicker.current.width, canvasColorPicker.current.height);

      manipulatorColorPicker.current.classList.add("u-display-none");

      canvasUiMessage.current.classList.remove("u-display-none");
      canvasUiMessage.current.children[0].innerHTML = uiMessageTexts[messageCode];
    }
  }
  

  function updateOkhxyValuesFromRgbValues() {
    // console.log("convert Rgb To Okhxy Values");

    let newOkhxy = colorConversion("srgb", currentColorModel, rgbValues[0], rgbValues[1], rgbValues[2]);

    okhxyValues.hue.value = newOkhxy[0];
    okhxyValues.x.value = newOkhxy[1];
    okhxyValues.y.value = newOkhxy[2];
  }


  function renderColorPickerCanvas(rgb) {
    // console.log("render Color Picker Canvas");

    let results;
    let ctx = canvasColorPicker.current.getContext("2d");

    // If we don't to this and for exemple we start the plugin with a [0, 0, 0] fill, the color picker hue will be red while the hue picker will be orange. Seems to be an inconsistency with the render functions.
    if (rgb.every(v => v == 0)) {
      rgb.fill(0.01);
    }

    if (currentColorModel == "okhsl") {
      results = render_okhsl(rgb[0], rgb[1], rgb[2]);
      ctx.putImageData(results["okhsl_sl"], 0, 0);
    }
    else if (currentColorModel == "okhsv") {
      results = render(rgb[0], rgb[1], rgb[2]);
      ctx.putImageData(results["okhsv_sv"], 0, 0);
    }
    // else if (colorModel == "oklch") {
    //   results = render(rgb[0], rgb[1], rgb[2]);
    //   ctx.putImageData(results["oklch_lc"], 0, 0);
    // }

    // setTimeout(function(){
    // }, 5);
  }

  function renderOpacitySliderCanvas() {
    // console.log("render opacity Slider Canvas");

    let ctx = canvasOpacitySlider.current.getContext("2d");
    const gradient = ctx.createLinearGradient(0, 0, slider_size, 0);
    
    gradient.addColorStop(0, "white");
    gradient.addColorStop(1, `rgba(${rgbValues[0]}, ${rgbValues[1]}, ${rgbValues[2]}, 1)`)

    // Set the fill style and draw a rectangle
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, slider_size, 15);
  }

  function syncWithNewShapeFillStrokeInfo(newData) {
    
    let oldShapeFillStrokeInfo = shapeFillStrokeInfo;
    shapeFillStrokeInfo = newData;
    

    if (oldShapeFillStrokeInfo !== undefined) { 
      // If the old shape didn't have fill its radio button is disabled, so if the new one has it we enable it again.
      if (!oldShapeFillStrokeInfo.hasFill && shapeFillStrokeInfo.hasFill) {
        fillOrStrokeSelector.current.children.fill.disabled = false;
        // return;
      }
      // If the old shape didn't have stroke its radio button is disabled, so if the new one has it we enable it again.
      if (!oldShapeFillStrokeInfo.hasStroke && shapeFillStrokeInfo.hasStroke) {
        fillOrStrokeSelector.current.children.stroke.disabled = false;
        // return;
      }
    }
    else {
      fillOrStrokeSelector.current.children.fill.disabled = false;
      fillOrStrokeSelector.current.children.stroke.disabled = false;
    }
    
    if (currentFillOrStroke == "fill") {
      if (!shapeFillStrokeInfo.hasFill) {
        currentFillOrStroke = "stroke";
        fillOrStrokeSelector.current.children.stroke.checked = true;
        fillOrStrokeSelector.current.children.fill.disabled = true;
      }
      else if (!shapeFillStrokeInfo.hasStroke) {
        fillOrStrokeSelector.current.children.fill.checked = true;
        fillOrStrokeSelector.current.children.stroke.disabled = true;
      }
    }
    else if (currentFillOrStroke == "stroke") {
      if (!shapeFillStrokeInfo.hasStroke) {
        currentFillOrStroke = "fill";
        fillOrStrokeSelector.current.children.fill.checked = true;
        fillOrStrokeSelector.current.children.stroke.disabled = true;
      }
      else if (!shapeFillStrokeInfo.hasFill) {
        fillOrStrokeSelector.current.children.stroke.checked = true;
        fillOrStrokeSelector.current.children.fill.disabled = true;
      }
    }
  }

  
  

  /* 
  ** UPDATES TO UI
  */

  const updateManipulatorPositions = {

    colorPicker() {
      // console.log("update Manipulator Positions - color picker");
      let x = okhxyValues.x.value / 100;
      let y = okhxyValues.y.value / 100;
      document.getElementById(manipulatorColorPicker.current.transform.baseVal.getItem(0).setTranslate(picker_size*x, picker_size*(1-y)));
    },
    hueSlider() {
      // console.log("update Manipulator Positions - hue slider");
      let hue = okhxyValues.hue.value / 360;
      document.getElementById(manipulatorHueSlider.current.transform.baseVal.getItem(0).setTranslate(slider_size*hue, 0));
    },
    opacitySlider() {
      // console.log("update Manipulator Positions - opacity slider");
      let opacity = opacityValue.value / 100;
      document.getElementById(manipulatorOpacitySlider.current.transform.baseVal.getItem(0).setTranslate(slider_size*opacity, 0));
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

  function fillOrStrokeHandle(event) {
    // console.log("fill Or Stroke Handle");

    currentFillOrStroke = event.target.id;

    parent.postMessage({ pluginMessage: { type: "send me shape color", "fillOrStroke": currentFillOrStroke} }, "*");
  }


  function colorModelHandle(event) {
    // console.log("color Model Handle");

    currentColorModel = event.target.value;
    
    updateOkhxyValuesFromRgbValues();
    updateManipulatorPositions.colorPicker();
    renderColorPickerCanvas(rgbValues);
  }


  function setupHandler(canvas) {
    // console.log("setup Handler - " + canvas.id);

    const mouseHandler = (event) => {
      let renderColorPicker: boolean = false;
      let rect = canvas.getBoundingClientRect();

      if (mouseHandlerEventTargetId == "") {
        mouseHandlerEventTargetId = event.target.id;
      }

      if (mouseHandlerEventTargetId == "okhxy_xy_canvas") {
        let canvas_x = event.clientX - rect.left;
        let canvas_y = event.clientY - rect.top;
        okhxyValues.x.value = Math.round(limitMouseHandlerValue(canvas_x/picker_size) * 100);
        okhxyValues.y.value = Math.round(limitMouseHandlerValue(1 - canvas_y/picker_size) * 100);

        rgbValues = colorConversion(currentColorModel, "srgb", okhxyValues.hue.value, okhxyValues.x.value, okhxyValues.y.value);

        // Temp note - oklch code 1
        
        updateShapeColor();
        updateManipulatorPositions.colorPicker();
      }
      else if (mouseHandlerEventTargetId == "okhxy_h_canvas") {
        let canvas_y = event.clientX - rect.left;
        okhxyValues.hue.value = Math.round(limitMouseHandlerValue(canvas_y/slider_size) * 360);

        // We do this to be abble to change the hue value on the color picker canvas when we have a white or black value. If we don't to this fix, the hue value will always be the same on the color picker canvas.
        let x = clamp(okhxyValues.x.value, 0.1, 99.9);
        let y = clamp(okhxyValues.y.value, 0.1, 99.9);
        rgbValues = colorConversion(currentColorModel, "srgb", okhxyValues.hue.value, x, y);

        // Temp note - oklch code 2

        renderColorPicker = true;
      
        updateShapeColor();
        updateManipulatorPositions.hueSlider();
      }
      else if (mouseHandlerEventTargetId == "opacity_canvas") {
        let canvas_y = event.clientX - rect.left;
        opacityValue.value = Math.round(limitMouseHandlerValue(canvas_y/slider_size) * 100);

        updateShapeOpacity();
        updateManipulatorPositions.opacitySlider();
      }

      renderOpacitySliderCanvas();

      if (renderColorPicker) {
        renderColorPickerCanvas(rgbValues);
      }
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



  function hxyInputHandle(event) {
    // console.log("hxy Input Handle");

    let eventTargetId = event.target.id;
    let eventTargetValue = parseInt(event.target.value);
    
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

    if (event.target.id == "hue") {
      let x = clamp(okhxyValues.x.value, 0.01, 99.99);
      let y = clamp(okhxyValues.y.value, 0.01, 99.99);

      rgbValues = colorConversion(currentColorModel, "srgb", okhxyValues.hue.value, x, y);
    }
    else {
      rgbValues = colorConversion(currentColorModel, "srgb", okhxyValues.hue.value, okhxyValues.x.value, okhxyValues.y.value);
    }


    updateShapeColor();
    renderOpacitySliderCanvas();

    if (event.target.id == "hue") {
      renderColorPickerCanvas(rgbValues);
      updateManipulatorPositions.hueSlider();
    }
    else {
      updateManipulatorPositions.colorPicker();
    }
  }

  function opacityInputHandle(event) {
    let eventTargetValue = clamp(parseInt(event.target.value), 0, 100);

    if (Number.isNaN(eventTargetValue)) {
      eventTargetValue = 100;
    }

    opacityValue.value = eventTargetValue;
    updateManipulatorPositions.opacitySlider();

    updateShapeOpacity();
  }


  /* 
  ** UPDATES TO BACKEND
  */

  function updateShapeColor() {
    // console.log("update Shape Color");
    parent.postMessage({ pluginMessage: { type: "update shape color", "fillOrStroke": currentFillOrStroke,  rgbValues } }, '*');
  }

  function updateShapeOpacity() {
    // console.log("update Shape Opacity");
    parent.postMessage({ pluginMessage: { type: "update shape opacity", "fillOrStroke": currentFillOrStroke,  "opacityValue": opacityValue.value } }, '*');
  }


  /* 
  ** UPDATES FROM BACKEND
  */

  onmessage = (event) => {
    const pluginMessage = event.data.pluginMessage.message;

    if (init) {
      // console.log("- Init function");

      setupHandler(canvasColorPicker.current);
      setupHandler(canvasHueSlider.current);
      setupHandler(canvasOpacitySlider.current);

      init = false;
      // console.log("- End init function");
    }

    if (pluginMessage == "new shape color") {
      // console.log("Update from backend - new shape color");

      if (uiMessageOn) uiMessage.hide();

      syncWithNewShapeFillStrokeInfo(event.data.pluginMessage.shapeFillStrokeInfo);

      rgbValues = event.data.pluginMessage.rgbValues;
      opacityValue.value = event.data.pluginMessage.opacityValue;
      updateOkhxyValuesFromRgbValues();

      // Init function were here.

      renderOpacitySliderCanvas();
      updateManipulatorPositions.all();
      renderColorPickerCanvas(rgbValues);
    }

    // We have this separate message only when we change between fill and stroke with the same shape, this is to avoid doing again the test in "new shape color" on shapeFillStrokeInfo.
    else if (pluginMessage == "current shape color") {
      // console.log("Update from backend - current shape color");

      if (uiMessageOn) uiMessage.hide();

      rgbValues = event.data.pluginMessage.rgbValues;
      opacityValue.value = event.data.pluginMessage.opacityValue;
      updateOkhxyValuesFromRgbValues()
      renderOpacitySliderCanvas();
      updateManipulatorPositions.all();
      renderColorPickerCanvas(rgbValues);
    }

    else if (pluginMessage == "new shapeFillStrokeInfo") {

      if (uiMessageOn) uiMessage.hide();

      syncWithNewShapeFillStrokeInfo(event.data.pluginMessage.shapeFillStrokeInfo);
    }

    else if (pluginMessage == "Display UI Message") {
      uiMessage.show(event.data.pluginMessage.uiMessageCode);
    }
  }


  
  return (
    <>
      <div class="colorpicker">

        <div ref={canvasUiMessage} class="colorpicker__message-wrapper u-display-none">
          <p class="colorpicker__message-text"></p>
        </div>

        <canvas ref={canvasColorPicker} class="colorpicker__canvas" id="okhxy_xy_canvas" width="240" height="240"></canvas>

        <svg class="colorpicker__handler" width="240" height="240">
          <g transform="translate(0,0)">
            <g ref={manipulatorColorPicker} id="okhsl_sl_manipulator" transform="translate(0,0)">
              <circle cx="0" cy="0" r="5" fill="none" stroke-width="1.5" stroke="#ffffff" ></circle>
              <circle cx="0" cy="0" r="6" fill="none" stroke-width="1" stroke="#e0e0e0" ></circle>
            </g>
          </g>
        </svg>

      </div>

      <div class="bottomcontrols">
        <div class="fillstrokeselector" ref={fillOrStrokeSelector}>
          <input onChange={fillOrStrokeHandle} type="radio" id="fill" name="fill_or_stroke" value="fill" disabled/>
          <label for="fill">Fill</label>

          <input onChange={fillOrStrokeHandle} type="radio" id="stroke" name="fill_or_stroke" value="stroke" disabled/>
          <label for="stroke">Stroke</label>
        </div>

        <div class="sliders">
          <div class="hueslider">
            <div ref={canvasHueSlider} class="hueslider__canvas" id="okhxy_h_canvas" width="15" height="170"></div>

            <svg class="hueslider__handler" width="170" height="15"> 
              <g transform="translate(0,7)">
                <g ref={manipulatorHueSlider} id="okhsl_h_manipulator" transform="translate(0,0)">
                  <circle cx="0" cy="0" r="5" fill="none" stroke-width="1.5" stroke="#ffffff" ></circle>
                  <circle cx="0" cy="0" r="6" fill="none" stroke-width="1" stroke="#e0e0e0" ></circle>
                </g>
              </g>
            </svg>
          </div>

          <div class="opacityslider">
            <canvas ref={canvasOpacitySlider} class="opacityslider__canvas" id="opacity_canvas" width="170" height="15"></canvas>

            <svg class="opacityslider__handler" width="170" height="15"> 
              <g transform="translate(0,7)">
                <g ref={manipulatorOpacitySlider} id="opacity_manipulator" transform="translate(0,0)">
                  <circle cx="0" cy="0" r="5" fill="none" stroke-width="1.5" stroke="#ffffff" ></circle>
                  <circle cx="0" cy="0" r="6" fill="none" stroke-width="1" stroke="#e0e0e0" ></circle>
                </g>
              </g>
            </svg>
          </div>
        </div>

        <div class="u-flex" style="margin-top: 20px;">
          <select onChange={colorModelHandle} name="color_model" id="color_model">
            <option value="okhsv">OkHSV</option>
            <option value="okhsl" selected>OkHSL</option>
          </select>

          <input class="valueInput" onChange={hxyInputHandle} id="hue" value={okhxyValues.hue} spellcheck={false} />
          <input class="valueInput" onChange={hxyInputHandle} id="x" value={okhxyValues.x} spellcheck={false} />
          <input class="valueInput" onChange={hxyInputHandle} id="y" value={okhxyValues.y} spellcheck={false} />
          <input class="valueInput" onChange={opacityInputHandle} id="opacity" value={opacityValue} spellcheck={false} />
        </div>

      </div>

    </>
  )
}