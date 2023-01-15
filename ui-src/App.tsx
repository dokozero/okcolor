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

const okhslValues = {
  hue: signal(0),
  saturation: signal(0),
  lightness: signal(0),
};

const okhsvValues = {
  hue: signal(0),
  saturation: signal(0),
  value: signal(0),
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


  function computeOkhslValues() {
    let okhsl = srgb_to_okhsl(rgbValues.r.value, rgbValues.g.value, rgbValues.b.value);

    okhslValues.hue.value = Math.round(okhsl[0] * 360);
    okhslValues.saturation.value = Math.round(okhsl[1] * 100);
    okhslValues.lightness.value = Math.round(okhsl[2] * 100);
  }

  function computeOkhsvValues() {
    let okhsv = srgb_to_okhsv(rgbValues.r.value, rgbValues.g.value, rgbValues.b.value);

    okhsvValues.hue.value = Math.round(okhsv[0] * 360);
    okhsvValues.saturation.value = Math.round(okhsv[1] * 100);
    okhsvValues.value.value = Math.round(okhsv[2] * 100);
  }

  const colorModelHandle = (event) => {
    colorModel.value = event.target.value;
    
    if (colorModel.value == "okhsl") {
      computeOkhslValues();
    }
    else if (colorModel.value == "okhsv") {
      computeOkhsvValues();
    }
    
    updateManipulators();
    renderCanvas();
  }

  function display_results_okhsl(results) {
    // console.log("display_results_okhsl");
    let ctx = canvasColorPicker.current.getContext('2d');
    ctx.putImageData(results["okhsl_sl"], 0, 0);
  }

  function display_results_okhsv(results) {
    // console.log("display_results_okhsv");
    let ctx = canvasColorPicker.current.getContext('2d');
    ctx.putImageData(results["okhsv_sv"], 0, 0);
  }

  function display_hue_slider(results) {
    let ctx = canvasHueSlider.current.getContext('2d');
    ctx.putImageData(results["okhsl_h"], 0, 0);
  }

  function updateManipulators()  {

    if (colorModel.value == "okhsl") {

      let h = okhslValues.hue.value / 360;
      let s = okhslValues.saturation.value / 100;
      let l = okhslValues.lightness.value / 100;

      document.getElementById(manipulatorColorPicker.current.transform.baseVal.getItem(0).setTranslate(picker_size*s, picker_size*(1-l)));
      document.getElementById(manipulatorHueSlider.current.transform.baseVal.getItem(0).setTranslate(picker_size*h, 0));
    }

    if (colorModel.value == "okhsv") {

      let h = okhsvValues.hue.value / 360;
      let s = okhsvValues.saturation.value / 100;
      let v = okhsvValues.value.value / 100;

      document.getElementById(manipulatorColorPicker.current.transform.baseVal.getItem(0).setTranslate(picker_size*s,picker_size*(1-v)));
      document.getElementById(manipulatorHueSlider.current.transform.baseVal.getItem(0).setTranslate(picker_size*h, 0));
    }

  }

  function renderCanvas() {
    setTimeout(function(){
      if (colorModel.value == "okhsl") {
        display_results_okhsl(render_okhsl(rgbValues.r.value, rgbValues.g.value, rgbValues.b.value));
      }

      if (colorModel.value == "okhsv") {
        display_results_okhsv(render(rgbValues.r.value, rgbValues.g.value, rgbValues.b.value));
      }

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
      if (colorModel.value == "okhsl") {
        let h = okhslValues.hue.value / 360;
        let new_s = clamp(x/picker_size);
        let new_l = clamp(1 - y/picker_size);
  
        let rgb = okhsl_to_srgb(h, new_s, new_l);
  
        rgbValues.r.value = rgb[0];
        rgbValues.g.value = rgb[1];
        rgbValues.b.value = rgb[2];
  
        computeOkhslValues();
      }
      else if (colorModel.value == "okhsv") {
        let h = okhsvValues.hue.value / 360;
        let new_s = clamp(x/picker_size);
        let new_v = clamp(1 - y/picker_size);
  
        let rgb = okhsv_to_srgb(h, new_s, new_v);
  
        rgbValues.r.value = rgb[0];
        rgbValues.g.value = rgb[1];
        rgbValues.b.value = rgb[2];
  
        computeOkhsvValues();
      }
    });

    setup_handler(canvasHueSlider.current, function(x, y) {
      let new_h = clamp(y/picker_size);
      let rgb;

      if (colorModel.value == "okhsl") {
        let s = okhslValues.saturation.value / 100;
        let l = okhslValues.lightness.value / 100;

        rgb = okhsl_to_srgb(new_h, s, l);

        rgbValues.r.value = rgb[0];
        rgbValues.g.value = rgb[1];
        rgbValues.b.value = rgb[2];

        computeOkhslValues();
      }
      else if (colorModel.value == "okhsv") {
        let s = okhsvValues.saturation.value / 100;
        let v = okhsvValues.value.value / 100;

        rgb = okhsv_to_srgb(new_h, s, v);

        rgbValues.r.value = rgb[0];
        rgbValues.g.value = rgb[1];
        rgbValues.b.value = rgb[2];

        computeOkhsvValues();
      }

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

    if (colorModel.value == "okhsl") {
      okhslValues[event.target.id].value = parseInt(event.target.value);
      sRgbResult = okhsl_to_srgb(okhslValues.hue.value / 360, okhslValues.saturation.value / 100, okhslValues.lightness.value / 100);
    }
    else if (colorModel.value == "okhsv") {
      okhsvValues[event.target.id].value = parseInt(event.target.value);
      sRgbResult = okhsv_to_srgb(okhsvValues.hue.value / 360, okhsvValues.saturation.value / 100, okhsvValues.value.value / 100);
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

    let okhslResult = srgb_to_okhsl(rgbValues.r.value, rgbValues.g.value, rgbValues.b.value);
    let okhsvResult = srgb_to_okhsv(rgbValues.r.value, rgbValues.g.value, rgbValues.b.value);

    okhslValues.hue.value = Math.floor(okhslResult[0] * 360);
    okhslValues.saturation.value = Math.floor(okhslResult[1] * 100);
    okhslValues.lightness.value = Math.floor(okhslResult[2] * 100);

    okhsvValues.hue.value = Math.floor(okhsvResult[0] * 360);
    okhsvValues.saturation.value = Math.floor(okhsvResult[1] * 100);
    okhsvValues.value.value = Math.floor(okhsvResult[2] * 100);


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

      <div class={colorModel.value == "okhsl" ? "" : "u-display-none"} style="margin-top: 20px;">
        {/* <h3>hsl</h3> */}
        <input onChange={updateFromInput} id="hue" type="number" min="0" max="360" value={okhslValues.hue} spellcheck={false} />
        <input onChange={updateFromInput} id="saturation" type="number" min="0" max="100" value={okhslValues.saturation} spellcheck={false} />
        <input onChange={updateFromInput} id="lightness" type="number" min="0" max="100" value={okhslValues.lightness} spellcheck={false} />
      </div>

      <div class={colorModel.value == "okhsv" ? "" : "u-display-none"} style="margin-top: 20px;">
        {/* <h3>hsv</h3> */}
        <input onChange={updateFromInput} id="hue" type="number" min="0" max="360" value={okhsvValues.hue} spellcheck={false} />
        <input onChange={updateFromInput} id="saturation" type="number" min="0" max="100" value={okhsvValues.saturation} spellcheck={false} />
        <input onChange={updateFromInput} id="value" type="number" min="0" max="100" value={okhsvValues.value} spellcheck={false} />
      </div>
    </>
  )
}