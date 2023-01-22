import { signal } from "@preact/signals";
import { useRef } from "preact/hooks";

import { colorConversion } from "../bottosson/colorconversion";
import { render, render_okhsl, render_static } from "../bottosson/render";
import {picker_size} from "../bottosson/constants";

const okhxyValues = {
  hue: signal(0),
  x: signal(0),
  y: signal(0)
};

export function App() { 

  /*
  ** VARIABLES DECLARATIONS
  */

  // We could use one canvas element but better no to avoid flickering when user change color model 
  const canvasColorPicker = useRef(null);
  const canvasHueSlider = useRef(null);
  const manipulatorColorPicker = useRef(null);
  const manipulatorHueSlider = useRef(null);

  let init = true;

  let rgbValues = [0, 0, 0];

  let fillOrStroke: string = "fill";
  let colorModel: string = "okhsl";

  const eps = 0.0001;

  let activeMouseHandler = null;
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
  

  function updateOkhxyValuesFromRgbValues() {
    // console.log("convert Rgb To Okhxy Values");

    let newOkhxy = colorConversion("srgb", colorModel, rgbValues[0], rgbValues[1], rgbValues[2]);

    okhxyValues.hue.value = newOkhxy[0];
    okhxyValues.x.value = newOkhxy[1];
    okhxyValues.y.value = newOkhxy[2];
  }


  function renderHueSliderCanvas() {
    // console.log("render Hue Slider Canvas");

    let results = render_static();
    let ctx = canvasHueSlider.current.getContext('2d');
    ctx.putImageData(results["okhsl_h"], 0, 0);
  }


  function renderColorPickerCanvas(rgb) {
    // console.log("render Color Picker Canvas");

    let results;
    let ctx = canvasColorPicker.current.getContext('2d');

    // If we don't to this and for exemple we start the plugin with a [0, 0, 0] fill, the color picker hue will be red while the hue picker will be orange. Seems to be an inconsistency with the render functions.
    if (rgb.every(v => v == 0)) {
      rgb.fill(0.01);
    }

    if (colorModel == "okhsl") {
      results = render_okhsl(rgb[0], rgb[1], rgb[2]);
      ctx.putImageData(results["okhsl_sl"], 0, 0);
    }
    else if (colorModel == "okhsv") {
      results = render(rgb[0], rgb[1], rgb[2]);
      ctx.putImageData(results["okhsv_sv"], 0, 0);
    }

    // setTimeout(function(){
    // }, 5);
  }


  
  

  /* 
  ** UPDATES TO UI
  */

  function updateManipulatorPositions()  {
    // console.log("update Manipulator Positions");

    let hue = okhxyValues.hue.value / 360;
    let x = okhxyValues.x.value / 100;
    let y = okhxyValues.y.value / 100;

    document.getElementById(manipulatorColorPicker.current.transform.baseVal.getItem(0).setTranslate(picker_size*x, picker_size*(1-y)));
    document.getElementById(manipulatorHueSlider.current.transform.baseVal.getItem(0).setTranslate(picker_size*hue, 0));
  }


  /* 
  ** UPDATES FROM UI
  */

  function fillOrStrokeHandle(event) {
    // console.log("fill Or Stroke Handle");

    fillOrStroke = event.target.id;

    parent.postMessage({ pluginMessage: { type: "send me shape color", "fillOrStroke": fillOrStroke} }, "*");
  }


  function colorModelHandle(event) {
    // console.log("color Model Handle");

    colorModel = event.target.value;
    
    updateOkhxyValuesFromRgbValues();
    updateManipulatorPositions();
    renderColorPickerCanvas(rgbValues);
  }


  function setupHandler(canvas) {
    // console.log("setup Handler - " + canvas.id);

    const mouseHandler = (event) => {
      event.preventDefault();

      let render: boolean = false;
      let rect = canvas.getBoundingClientRect();

      if (mouseHandlerEventTargetId == "") {
        mouseHandlerEventTargetId = event.target.id;
      }

      if (mouseHandlerEventTargetId == "okhsl_sl_canvas" || mouseHandlerEventTargetId == "okhsv_sv_canvas") {
        let canvas_x = event.clientX - rect.left;
        let canvas_y = event.clientY - rect.top;
        okhxyValues.x.value = Math.round(limitMouseHandlerValue(canvas_x/picker_size) * 100);
        okhxyValues.y.value = Math.round(limitMouseHandlerValue(1 - canvas_y/picker_size) * 100);

        rgbValues = colorConversion(colorModel, "srgb", okhxyValues.hue.value, okhxyValues.x.value, okhxyValues.y.value);
      }
      else if (mouseHandlerEventTargetId == "okhsl_h_canvas") {
        let canvas_y = event.clientX - rect.left;
        okhxyValues.hue.value = Math.round(limitMouseHandlerValue(canvas_y/picker_size) * 360);

        // We do this to be abble to change the hue value on the color picker canvas when we have a white or black value. If we don't to this fix, the hue value will always be the same on the color picker canvas.
        let x = clamp(okhxyValues.x.value, 0.1, 99.9);
        let y = clamp(okhxyValues.y.value, 0.1, 99.9);
        rgbValues = colorConversion(colorModel, "srgb", okhxyValues.hue.value, x, y);

        render = true;
      }

      updateShapeColor();
      updateManipulatorPositions();

      if (render) {
        renderColorPickerCanvas(rgbValues);
      }
    };

    canvas.addEventListener("mousedown", function(event) {
      activeMouseHandler = mouseHandler;
      mouseHandler(event);
    }, false);
  }

  document.addEventListener("mouseup", function(event) {
    if (activeMouseHandler !== null) {
      activeMouseHandler = null;
      mouseHandlerEventTargetId = "";
    }
  }, false);

  document.addEventListener("mousemove", function(event) {
    if (activeMouseHandler !== null) {
      activeMouseHandler(event);  
    }
  }, false);



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

      rgbValues = colorConversion(colorModel, "srgb", okhxyValues.hue.value, x, y);
    }
    else {
      rgbValues = colorConversion(colorModel, "srgb", okhxyValues.hue.value, okhxyValues.x.value, okhxyValues.y.value);
    }


    updateShapeColor();
    updateManipulatorPositions();

    if (event.target.id == "hue") {
      renderColorPickerCanvas(rgbValues);
    }    
  }


  /* 
  ** UPDATES TO BACKEND
  */

  function updateShapeColor() {
    // console.log("update Shape Color");
    parent.postMessage({ pluginMessage: { type: "update shape color", "fillOrStroke": fillOrStroke,  rgbValues } }, '*');
  }


  /* 
  ** UPDATES FROM BACKEND
  */

  onmessage = (event) => {
    if (event.data.pluginMessage.message == "new shape color") {
      rgbValues = event.data.pluginMessage.rgbValues;

      updateOkhxyValuesFromRgbValues();

      if (init) {
        // console.log("- Init function");

        renderHueSliderCanvas();

        setupHandler(canvasColorPicker.current);
        setupHandler(canvasHueSlider.current);

        init = false;

        // console.log("- End init function");
      }

      updateManipulatorPositions();
      renderColorPickerCanvas(rgbValues);
    }
  }


  
  return (
    <>
      <div>
        <input onChange={fillOrStrokeHandle} type="radio" id="fill" name="fill_or_stroke" value="fill" defaultChecked/>
        <label for="fill">Fill</label>

        <input onChange={fillOrStrokeHandle} type="radio" id="stroke" name="fill_or_stroke" value="stroke" />
        <label for="stroke">Stroke</label>
      </div>

      <div class="colorpicker">

        <canvas ref={canvasColorPicker} class="colorpicker__canvas" id="okhsl_sl_canvas" width="257" height="257"></canvas>

        <svg class="colorpicker__handler" width="257" height="257">
          <g transform="translate(0,0)">
            <g ref={manipulatorColorPicker} id="okhsl_sl_manipulator" transform="translate(0,0)">
              <circle cx="0" cy="0" r="5" fill="none" stroke-width="1.75" stroke="#ffffff" ></circle>
              <circle cx="0" cy="0" r="6" fill="none" stroke-width="1.25" stroke="#000000" ></circle>
            </g>
          </g>
        </svg>

      </div>

      <div class="colorslider">
        <canvas ref={canvasHueSlider} class="colorslider__element" id="okhsl_h_canvas" width="15" height="257"></canvas>

        <svg class="colorslider__handler" width="257" height="15"> 
          <g transform="translate(0,7)">
            <g ref={manipulatorHueSlider} id="okhsl_h_manipulator" transform="translate(0,0)">
              <circle cx="0" cy="0" r="5" fill="none" stroke-width="1.75" stroke="#ffffff" ></circle>
              <circle cx="0" cy="0" r="6" fill="none" stroke-width="1.25" stroke="#000000" ></circle>
            </g>
          </g>
        </svg>
      </div>

      <div style="margin-top: 20px;">
        <select onChange={colorModelHandle} name="color_model" id="color_model">
          <option value="okhsv">OkHSV</option>
          <option value="okhsl" selected>OkHSL</option>
        </select>
      </div>

      <div style="margin-top: 20px;">
        <input onChange={hxyInputHandle} id="hue" type="number" min="0" max="360" value={okhxyValues.hue} spellcheck={false} />
        <input onChange={hxyInputHandle} id="x" type="number" min="0" max="100" value={okhxyValues.x} spellcheck={false} />
        <input onChange={hxyInputHandle} id="y" type="number" min="0" max="100" value={okhxyValues.y} spellcheck={false} />
      </div>
    </>
  )
}