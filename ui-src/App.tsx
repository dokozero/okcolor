import { signal } from "@preact/signals";
import { useRef } from "preact/hooks";

import { okhsl_to_srgb, srgb_to_okhsl, srgb_to_okhsv, okhsv_to_srgb } from "../bottosson/colorconversion";
import { render, render_okhsl, render_static } from "../bottosson/render";

let init = true;

const rgbValues = {
  r: signal(0),
  g: signal(0),
  b: signal(0)
};

const okhxyValues = {
  hue: signal(0),
  x: signal(0),
  y: signal(0),
};

const fillOrStroke = signal("fill");
const colorModel = signal("okhsl");

const picker_size = 257;
const eps = 0.0001;

function clamp(x) {
  return x < eps ? eps : (x > 1-eps ? 1-eps : x);
}

export function App() { 

  // We could use one canvas element but better no to avoid flickering when user change color model 
  const canvasColorPicker = useRef(null);
  const canvasHueSlider = useRef(null);
  const manipulatorColorPicker = useRef(null);
  const manipulatorHueSlider = useRef(null);


  function computeOkhxyValues() {   
    let okhxy;

    if (colorModel.value == "okhsl") {
      okhxy = srgb_to_okhsl(rgbValues.r.value, rgbValues.g.value, rgbValues.b.value);
    }
    else if (colorModel.value == "okhsv") {
      okhxy = srgb_to_okhsv(rgbValues.r.value, rgbValues.g.value, rgbValues.b.value);
    }

    okhxyValues.hue.value = Math.round(okhxy[0] * 360);
    okhxyValues.x.value = Math.round(okhxy[1] * 100);
    okhxyValues.y.value = Math.round(okhxy[2] * 100);
  }

  const colorModelHandle = (event) => {
    colorModel.value = event.target.value;
    
    computeOkhxyValues();    
    updateManipulators();
    renderCanvas();
  }

  function display_results_okhxy() {
    // console.log("display_results_okhxy");
    
    let results;
    let ctx;

    if (colorModel.value == "okhsl") {
      results = render_okhsl(rgbValues.r.value, rgbValues.g.value, rgbValues.b.value);
      ctx = canvasColorPicker.current.getContext('2d');
      ctx.putImageData(results["okhsl_sl"], 0, 0);
    }
    else if (colorModel.value == "okhsv") {
      results = render(rgbValues.r.value, rgbValues.g.value, rgbValues.b.value)
      ctx = canvasColorPicker.current.getContext('2d');
      ctx.putImageData(results["okhsv_sv"], 0, 0);
    }
  }

  function display_hue_slider(results) {
    let ctx = canvasHueSlider.current.getContext('2d');
    ctx.putImageData(results["okhsl_h"], 0, 0);
  }

  function updateManipulators()  {
    let h = okhxyValues.hue.value / 360;
    let x = okhxyValues.x.value / 100;
    let y = okhxyValues.y.value / 100;

    document.getElementById(manipulatorColorPicker.current.transform.baseVal.getItem(0).setTranslate(picker_size*x, picker_size*(1-y)));
    document.getElementById(manipulatorHueSlider.current.transform.baseVal.getItem(0).setTranslate(picker_size*h, 0));
  }

  function renderCanvas() {
    setTimeout(function(){
      display_results_okhxy();
    }, 5);
  }

  let mouse_handler = null;

  function setup_handler(canvas, handler) {
    let outer_mouse_handler = function(event) {
      event.preventDefault();

      let rect = canvas.getBoundingClientRect();

      let render: boolean = false;

      let x: number = 0;
      let y: number = 0;

      if (event.target.id == "okhsl_sl_canvas" || event.target.id == "okhsv_sv_canvas") {;
        x = event.clientX - rect.left;
        y = event.clientY - rect.top;
        
        render = false;
      }
      else if (event.target.id == "okhsl_h_canvas") {
        y = event.clientX - rect.left;
        x = event.clientY - rect.top;

        render = true;
      }
      
      handler(x,y);
      changeColorInPlugin();
      updateManipulators();

      if (render) {
        renderCanvas();
      }
    };

    canvas.addEventListener('mousedown', function(event) {
      mouse_handler = outer_mouse_handler;
      outer_mouse_handler(event);
    }, false);
  }

  document.addEventListener('mouseup', function(event) {
    if (mouse_handler !== null) {
      // mouse_handler(event);
      mouse_handler = null;
    }
  }, false);

  document.addEventListener('mousemove', function(event) {
    if (mouse_handler !== null) {
      mouse_handler(event);      
    }
  }, false);


  function setup_handlers() {
    // console.log("setup_hsl_handler()");

    setup_handler(canvasColorPicker.current, function(x, y) {
      let h = okhxyValues.hue.value / 360;
      let new_x = clamp(x/picker_size);
      let new_y = clamp(1 - y/picker_size);

      let rgb;

      if (colorModel.value == "okhsl") {
        rgb = okhsl_to_srgb(h, new_x, new_y);
      }
      else if (colorModel.value == "okhsv") {
        rgb = okhsv_to_srgb(h, new_x, new_y);
      }

      rgbValues.r.value = rgb[0];
      rgbValues.g.value = rgb[1];
      rgbValues.b.value = rgb[2];

      computeOkhxyValues();
    });

    setup_handler(canvasHueSlider.current, function(x, y) {
      let new_h = clamp(y/picker_size);
      let current_x = okhxyValues.x.value / 100;
      let current_y = okhxyValues.y.value / 100;

      let rgb;

      if (colorModel.value == "okhsl") {
        rgb = okhsl_to_srgb(new_h, current_x, current_y);
      }
      else if (colorModel.value == "okhsv") {
        rgb = okhsv_to_srgb(new_h, current_x, current_y);
      }

      rgbValues.r.value = rgb[0];
      rgbValues.g.value = rgb[1];
      rgbValues.b.value = rgb[2];

      computeOkhxyValues();

    });
  }

  

  const fillOrStrokeHandle = (event) => {    
    fillOrStroke.value = event.target.id;
    parent.postMessage({ pluginMessage: { type: "updateUIColor", fillOrStroke: fillOrStroke.value} }, "*");
  }


  const changeColorInPlugin = () => {
    // console.log("Update from canvas");

    let values = {
      r: rgbValues.r.value / 255,
      g: rgbValues.g.value / 255,
      b: rgbValues.b.value / 255
    };

    parent.postMessage({ pluginMessage: { type: "changeColor", fillOrStroke: fillOrStroke.value,  values } }, '*');
  }


  const updateFromInput = (event) => {
    // console.log("Update from input");

    let sRgbResult;

    // TODO: Check here if values from inputs are within the boundaries?

    okhxyValues[event.target.id].value = parseInt(event.target.value);

    if (colorModel.value == "okhsl") {
      sRgbResult = okhsl_to_srgb(okhxyValues.hue.value / 360, okhxyValues.x.value / 100, okhxyValues.y.value / 100);
    }
    else if (colorModel.value == "okhsv") {
      sRgbResult = okhsv_to_srgb(okhxyValues.hue.value / 360, okhxyValues.x.value / 100, okhxyValues.y.value / 100);
    }

    rgbValues.r.value = sRgbResult[0];
    rgbValues.g.value = sRgbResult[1];
    rgbValues.b.value = sRgbResult[2];

    // const rgbInitials = ["r", "g", "b"];

    // for (let i = 0; i < sRgbResult.length; i++) {
    //   if (sRgbResult[i] < 0) {
    //     rgbValues[rgbInitials[i]].value = 0;
    //   }
    //   else if (sRgbResult[i] > 255) {
    //     rgbValues[rgbInitials[i]].value = 255;
    //   }
    //   else {
    //     rgbValues[rgbInitials[i]].value = Math.round(sRgbResult[i]);
    //   }
    // }

    changeColorInPlugin();

    if (event.target.id == "hue") {
      updateManipulators();
      renderCanvas();
    }
    else {
      updateManipulators();
    }
    
  }

  onmessage = (event) => {
    // console.log(event.data.pluginMessage);
    // console.log("message from plugin");

    rgbValues.r.value = Math.round(event.data.pluginMessage.r);
    rgbValues.g.value = Math.round(event.data.pluginMessage.g);
    rgbValues.b.value = Math.round(event.data.pluginMessage.b);

    let okhxyResult;

    if (colorModel.value == "okhsl") {
      okhxyResult = srgb_to_okhsl(rgbValues.r.value, rgbValues.g.value, rgbValues.b.value);
    }
    else if (colorModel.value == "okhsv") {
      okhxyResult = srgb_to_okhsv(rgbValues.r.value, rgbValues.g.value, rgbValues.b.value);
    }

    okhxyValues.hue.value = Math.floor(okhxyResult[0] * 360);
    okhxyValues.x.value = Math.floor(okhxyResult[1] * 100);
    okhxyValues.y.value = Math.floor(okhxyResult[2] * 100);

    if (init) {
      // console.log("init functions");

      let results = render_static();
      display_hue_slider(results);
      setup_handlers();
      init = false;
    }

    updateManipulators();
    renderCanvas();
  }

  return (
    <>
      <div>
        <input onChange={fillOrStrokeHandle} type="radio" id="fill" name="fillOrStroke" value="fill" defaultChecked/>
        <label for="fill">Fill</label>

        <input onChange={fillOrStrokeHandle} type="radio" id="stroke" name="fillOrStroke" value="stroke" />
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
        <select onChange={colorModelHandle} name="colorModel" id="colorModel">
          <option value="okhsv">OkHSV</option>
          <option value="okhsl" selected>OkHSL</option>
        </select>
      </div>

      <div style="margin-top: 20px;">
        <input onChange={updateFromInput} id="hue" type="number" min="0" max="360" value={okhxyValues.hue} spellcheck={false} />
        <input onChange={updateFromInput} id="x" type="number" min="0" max="100" value={okhxyValues.x} spellcheck={false} />
        <input onChange={updateFromInput} id="y" type="number" min="0" max="100" value={okhxyValues.y} spellcheck={false} />
      </div>
    </>
  )
}