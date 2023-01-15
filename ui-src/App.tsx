import { signal } from "@preact/signals";
import { useRef } from "preact/hooks";

import {okhsl_to_srgb as okhslToSrgb, srgb_to_okhsl as srgbToOkhsl, srgb_to_okhsv as srgbToOkhsv, okhsv_to_srgb as okhsvToSrgb} from "../bottosson/colorconversion";
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

  let rgbValues = {
    r: 0,
    g: 0,
    b: 0
  };

  let fillOrStroke: string = "fill";
  let colorModel: string = "okhsl";

  const eps = 0.0001;

  let activeMouseHandler = null;
  let mouseHandlerEventTargetId = "";




  /*
  ** HELPER FUNCTIONS
  */

  function clamp(x) {
    if (x < eps)
      return eps;
    else if (x > 1-eps)
      return 1-eps;
    
    return x;
  }

  function convertRgbToOkhxyValues() {
    // console.log("convert Rgb To Okhxy Values");

    let newOkhxy;

    if (colorModel == "okhsl") {
      newOkhxy = srgbToOkhsl(rgbValues.r, rgbValues.g, rgbValues.b);
    }
    else if (colorModel == "okhsv") {
      newOkhxy = srgbToOkhsv(rgbValues.r, rgbValues.g, rgbValues.b);
    }

    okhxyValues.hue.value = Math.round(newOkhxy[0] * 360);
    okhxyValues.x.value = Math.round(newOkhxy[1] * 100);
    okhxyValues.y.value = Math.round(newOkhxy[2] * 100);
  }


  function renderHueSliderCanvas() {
    // console.log("render Hue Slider Canvas");

    let results = render_static();
    let ctx = canvasHueSlider.current.getContext('2d');
    ctx.putImageData(results["okhsl_h"], 0, 0);
  }


  function renderColorPickerCanvas() {
    // console.log("render Color Picker Canvas");

    let results;
    let ctx = canvasColorPicker.current.getContext('2d');

    if (colorModel == "okhsl") {
      results = render_okhsl(rgbValues.r, rgbValues.g, rgbValues.b);
      ctx.putImageData(results["okhsl_sl"], 0, 0);
    }
    else if (colorModel == "okhsv") {
      results = render(rgbValues.r, rgbValues.g, rgbValues.b);
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
    
    convertRgbToOkhxyValues();
    updateManipulatorPositions();
    renderColorPickerCanvas();
  }


  function setupHandler(canvas) {
    // console.log("setup Handler - " + canvas.id);

    const mouseHandler = (event) => {
      event.preventDefault();

      let render: boolean = false;

      let rect = canvas.getBoundingClientRect();

      let newHxy = {
        "hue": okhxyValues.hue.value / 360,
        "x": okhxyValues.x.value / 100,
        "y": okhxyValues.y.value / 100
      };

      let newRgb;

      if (mouseHandlerEventTargetId == "") {
        mouseHandlerEventTargetId = event.target.id;
      }

      if (mouseHandlerEventTargetId == "okhsl_sl_canvas" || mouseHandlerEventTargetId == "okhsv_sv_canvas") {
        let canvas_x = event.clientX - rect.left;
        let canvas_y = event.clientY - rect.top;
        newHxy.x = clamp(canvas_x/picker_size);
        newHxy.y = clamp(1 - canvas_y/picker_size); 
      }
      else if (mouseHandlerEventTargetId == "okhsl_h_canvas") {
        let canvas_y = event.clientX - rect.left;
        newHxy.hue = clamp(canvas_y/picker_size);
        render = true;
      }

      if (colorModel == "okhsl") {
        newRgb = okhslToSrgb(newHxy.hue, newHxy.x, newHxy.y);
      }
      else if (colorModel == "okhsv") {
        newRgb = okhsvToSrgb(newHxy.hue, newHxy.x, newHxy.y);
      }

      rgbValues.r = newRgb[0];
      rgbValues.g = newRgb[1];
      rgbValues.b = newRgb[2];

      convertRgbToOkhxyValues();

      updateShapeColor();
      updateManipulatorPositions();

      if (render) {
        renderColorPickerCanvas();
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

    let newRgb;

    let eventTargetId = event.target.id;
    let eventTargetValue = parseInt(event.target.value);
    
    if (eventTargetId == "hue") {
      if (eventTargetValue < 0) {
        eventTargetValue = 0;
      }
      else if (eventTargetValue > 360) {
        eventTargetValue = 360;
      }
    }
    else if (eventTargetId == "x" || eventTargetId == "y") {
      if (eventTargetValue < 0) {
        eventTargetValue = 0;
      }
      else if (eventTargetValue > 100) {
        eventTargetValue = 100;
      }
    }

    okhxyValues[eventTargetId].value = eventTargetValue;

    let hue = okhxyValues.hue.value / 360;
    let x = okhxyValues.x.value / 100;
    let y = okhxyValues.y.value / 100;

    if (colorModel == "okhsl") {
      newRgb = okhslToSrgb(hue, x, y);
    }
    else if (colorModel == "okhsv") {
      newRgb = okhsvToSrgb(hue, x, y);
    }

    rgbValues.r = newRgb[0];
    rgbValues.g = newRgb[1];
    rgbValues.b = newRgb[2];

    updateShapeColor();
    updateManipulatorPositions();

    if (event.target.id == "hue") {
      renderColorPickerCanvas();
    }    
  }


  /* 
  ** UPDATES TO BACKEND
  */

  function updateShapeColor() {
    // console.log("update Shape Color");

    // This code is to be sure we don't have value outside range because it looks like there is a bug with okhslToSrgb and okhsvToSrgb functions that return out of rage values when for exemple we have hue set to 0 or 100 and saturation as well.
    const rgbInitials = ["r", "g", "b"];
    for (let i = 0; i < Object.keys(rgbValues).length; i++) {
      if (rgbValues[rgbInitials[i]] < 0) {
        rgbValues[rgbInitials[i]] = 0;
      }
      else if (rgbValues[rgbInitials[i]] > 255) {
        rgbValues[rgbInitials[i]] = 255;
      }
    }

    let preparedRgbValue = {
      r: rgbValues.r / 255,
      g: rgbValues.g / 255,
      b: rgbValues.b / 255
    };

    parent.postMessage({ pluginMessage: { type: "update shape color", "fillOrStroke": fillOrStroke,  preparedRgbValue } }, '*');
  }


  /* 
  ** UPDATES FROM BACKEND
  */

  onmessage = (event) => {
    if (event.data.pluginMessage.message == "new shape color") {
      rgbValues.r = event.data.pluginMessage.rgb.r;
      rgbValues.g = event.data.pluginMessage.rgb.g;
      rgbValues.b = event.data.pluginMessage.rgb.b;

      convertRgbToOkhxyValues();

      if (init) {
        // console.log("- Init function");

        renderHueSliderCanvas();

        setupHandler(canvasColorPicker.current);
        setupHandler(canvasHueSlider.current);

        init = false;

        // console.log("- End init function");

      }

      updateManipulatorPositions();
      renderColorPickerCanvas();
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