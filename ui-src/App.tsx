import { signal } from "@preact/signals";
import { useRef, useEffect, useState } from "preact/hooks";

import { okhsl_to_srgb, srgb_to_okhsl, rgb_to_hex, srgb_to_okhsv, okhsv_to_srgb } from "../bottosson/colorconversion";
import { render, render_okhsl, render_static } from "../bottosson/render";

// import MyWorker from "./bottosson/workerokhsl?worker&inline";

export function App() { 

  // let blob = new Blob([
  //   document.querySelector('#workerokhsl').textContent
  // ], { type: "text/javascript" })

  // let worker_okhsl = new Worker(window.URL.createObjectURL(blob),{
  //   type: 'module'
  // });

  const picker_size = 257;
  const eps = 0.0001;

  const canvasColorPickerOkHSL = useRef(null);
  const canvasColorPickerOkHSV = useRef(null);
  const canvasHueSliderOkHSL = useRef(null);
  const manipulatorColorPickerOkHSL = useRef(null);
  const manipulatorColorPickerOkHSV = useRef(null);
  const manipulatorHueSlider = useRef(null);

  const [colorModel, setColorModel]  = useState("okhsl");
  const [initColorModel, setInitColorModel]  = useState(true);

  const colorModelHandle = (event) => {
    setColorModel(event.target.value);
  }

  function clamp(x) {
    return x < eps ? eps : (x > 1-eps ? 1-eps : x);
  }

  useEffect(() => {
    // setColorModel("okhsl");
    setup_hsl_handlers(srgb_to_okhsl, okhsl_to_srgb);

    // setColorModel("okhsv");
    setup_hsv_handler();

    update(true);

    let results = render_static();

    display_okhsl_slider(results);

    // setInitColorModel(false);

  }, []);

  useEffect(() => {
    console.log("useEffect colorModel");
    update(true);
  }, [colorModel]);

  
  // const worker_okhsl = new MyWorker();

  function display_results_okhsv(results) {
    let ctx = canvasColorPickerOkHSV.current.getContext('2d');
    ctx.putImageData(results["okhsv_sv"], 0, 0);
  }

  function display_results_okhsl(results) {
    let ctx = canvasColorPickerOkHSL.current.getContext('2d');
    ctx.putImageData(results["okhsl_sl"], 0, 0);
  }

  function display_okhsl_slider(results) {
    let ctx = canvasHueSliderOkHSL.current.getContext('2d');
    ctx.putImageData(results["okhsl_h"], 0, 0);
  }

  function update(reRender)  {

    let hsl = srgb_to_okhsl(rgbValues.r.value, rgbValues.g.value, rgbValues.b.value);

    if (colorModel == "okhsv" || initColorModel) {
      let okhsv = srgb_to_okhsv(rgbValues.r.value, rgbValues.g.value, rgbValues.b.value);

      document.getElementById(manipulatorColorPickerOkHSV.current.transform.baseVal.getItem(0).setTranslate(picker_size*okhsv[1],picker_size*(1-okhsv[2])));
      document.getElementById(manipulatorHueSlider.current.transform.baseVal.getItem(0).setTranslate(picker_size*hsl[0], 0));

      let hsvResult = srgb_to_okhsv(rgbValues.r.value, rgbValues.g.value, rgbValues.b.value);

      hsvValues.hue.value = Math.round(hsvResult[0] * 360);
      hsvValues.saturation.value = Math.round(hsvResult[1] * 100);
      hsvValues.value.value = Math.round(hsvResult[2] * 100);
    }

    if (colorModel == "okhsl" || initColorModel) {
      document.getElementById(manipulatorColorPickerOkHSL.current.transform.baseVal.getItem(0).setTranslate(picker_size*hsl[1], picker_size*(1-hsl[2])));
      document.getElementById(manipulatorHueSlider.current.transform.baseVal.getItem(0).setTranslate(picker_size*hsl[0], 0));

      let hslResult = srgb_to_okhsl(rgbValues.r.value, rgbValues.g.value, rgbValues.b.value);

      hslValues.hue.value = Math.round(hslResult[0] * 360);
      hslValues.saturation.value = Math.round(hslResult[1] * 100);
      hslValues.lightness.value = Math.round(hslResult[2] * 100);
    }

    // console.log("render: " + render);

    if (reRender) {
      // let pendingRender = true;
      setTimeout(function()
      {
        // pendingRender = false;
        
        if (colorModel == "okhsv" || initColorModel) {
          console.log("display_results_okhsv");
          display_results_okhsv(render(rgbValues.r.value, rgbValues.g.value, rgbValues.b.value));
        }
        
        if (colorModel == "okhsl" || initColorModel) {
          console.log("display_results_okhsl");
          display_results_okhsl(render_okhsl(rgbValues.r.value, rgbValues.g.value, rgbValues.b.value));
        }
      }, 5);
    }
  }

    
  let mouse_handler = null;

  function setup_handler(canvas, handler) {
    let outer_mouse_handler = function(event) {
      event.preventDefault();

      updateFromCanvas();

      let rect = canvas.getBoundingClientRect();

      let render: boolean = false;

      let x: number = 0;
      let y: number = 0;

      if (event.target.id == "okhsl_sl_canvas" || event.target.id == "okhsv_sv_canvas") {
        render = false;
        x = event.clientX - rect.left;
        y = event.clientY - rect.top;
      }
      else if (event.target.id == "okhsl_h_canvas") {
        render = true;
        y = event.clientX - rect.left;
        x = event.clientY - rect.top;
      }
      
      handler(x,y);

      update(render);

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

  function setup_hsl_handlers(to_hsl, from_hsl) {
    setup_handler(canvasColorPickerOkHSL.current, function(x, y) {
      let hsl = to_hsl(rgbValues.r.value, rgbValues.g.value, rgbValues.b.value);

      let new_s = clamp(x/picker_size);
      let new_v = clamp(1 - y/picker_size);

      let rgb = from_hsl(hsl[0], new_s, new_v);
      rgbValues.r.value = rgb[0];
      rgbValues.g.value = rgb[1];
      rgbValues.b.value = rgb[2];
    });

    setup_handler(canvasHueSliderOkHSL.current, function(x, y) {
      let h = clamp(y/picker_size);

      let hsl = to_hsl(rgbValues.r.value, rgbValues.g.value, rgbValues.b.value);
      let rgb = from_hsl(h, hsl[1], hsl[2]);
      rgbValues.r.value = rgb[0];
      rgbValues.g.value = rgb[1];
      rgbValues.b.value = rgb[2];
    });

  }

  function setup_hsv_handler() {
    setup_handler(canvasColorPickerOkHSV.current, function(x, y) {
      let hsv = srgb_to_okhsv(rgbValues.r.value, rgbValues.g.value, rgbValues.b.value);

      let new_s = clamp(x/picker_size);
      let new_v = clamp(1 - y/picker_size);

      let rgb = okhsv_to_srgb(hsv[0], new_s, new_v);
      rgbValues.r.value = rgb[0];
      rgbValues.g.value = rgb[1];
      rgbValues.b.value = rgb[2];
    });
  }
  




  

  const rgbValues = {
    r: signal(0),
    g: signal(0),
    b: signal(0)
  };

  const hslValues = {
    hue: signal(0),
    saturation: signal(0),
    lightness: signal(0),
  };

  const hsvValues = {
    hue: signal(0),
    saturation: signal(0),
    value: signal(0),
  };

  
  let fillOrStroke: string = "fill"; 

  const fillOrStrokeHandle = (event) => {
    fillOrStroke = event.target.id;
    
    parent.postMessage({ pluginMessage: { type: "updateUIColor", fillOrStroke: fillOrStroke} }, "*");
  }

  const updateFromInput = (event) => {
    let id = event.target.id;

    hslValues[id].value = parseInt(event.target.value);

    // TODO: Check here is values are within the boundaries?

    let values = {
      type: "hsl",
      hue: hslValues.hue.value,
      saturation: hslValues.saturation.value,
      lightness: hslValues.lightness.value
    };

    parent.postMessage({ pluginMessage: { type: "changeColor", fillOrStroke: fillOrStroke,  values } }, "*");

    const sRgbResult = okhsl_to_srgb(hslValues.hue.value / 360, hslValues.saturation.value / 100, hslValues.lightness.value / 100);

    const rgbInitials = ["r", "g", "b"];

    for (let i = 0; i < sRgbResult.length; i++) {
      if (sRgbResult[i] < 0) {
        rgbValues[rgbInitials[i]].value = 0;
      }
      else if (sRgbResult[i] > 255) {
        rgbValues[rgbInitials[i]].value = 255;
      }
      else {
        rgbValues[rgbInitials[i]].value = Math.round(sRgbResult[i]);
      }
    }

    // TODO: render true only if Hue has changed
    update(true);
    
  }

  const updateFromCanvas = () => {
    let values = {
      type: "rgb",
      r: rgbValues.r.value / 255,
      g: rgbValues.g.value / 255,
      b: rgbValues.b.value / 255
    };

    parent.postMessage({ pluginMessage: { type: "changeColor", fillOrStroke: fillOrStroke,  values } }, '*');
  }

  onmessage = (event) => {
    // console.log(event.data.pluginMessage);

    rgbValues.r.value = Math.round(event.data.pluginMessage.r);
    rgbValues.g.value = Math.round(event.data.pluginMessage.g);
    rgbValues.b.value = Math.round(event.data.pluginMessage.b);

    hslValues.hue.value = event.data.pluginMessage.okhsl.hue;
    hslValues.saturation.value = event.data.pluginMessage.okhsl.saturation;
    hslValues.lightness.value = event.data.pluginMessage.okhsl.lightness;

    hsvValues.hue.value = event.data.pluginMessage.okhsv.hue;
    hsvValues.saturation.value = event.data.pluginMessage.okhsv.saturation;
    hsvValues.value.value = event.data.pluginMessage.okhsv.lightness;

    update(true);
  }

  return (
    <>
      <div>
        <input onChange={fillOrStrokeHandle} type="radio" id="fill" name="fillOrStroke" value="fill" checked />
        <label for="fill">Fill</label>

        <input onChange={fillOrStrokeHandle} type="radio" id="stroke" name="fillOrStroke" value="stroke" />
        <label for="stroke">Stroke</label>
      </div>

      <div class="colorpicker">

        { (colorModel == "okhsl" || initColorModel) &&
          <div>
            <canvas ref={canvasColorPickerOkHSL} class="colorpicker__element" id="okhsl_sl_canvas" width="257" height="257"></canvas>

            <svg class="colorpicker__handler" width="257" height="257">
              <g transform="translate(0,0)">
                <g ref={manipulatorColorPickerOkHSL} id="okhsl_sl_manipulator" transform="translate(0,0)">
                  <circle cx="0" cy="0" r="5" fill="none" stroke-width="1.75" stroke="#ffffff" ></circle>
                  <circle cx="0" cy="0" r="6" fill="none" stroke-width="1.25" stroke="#000000" ></circle>
                </g>
              </g>
            </svg>
          </div>
        }

        { (colorModel == "okhsv" || initColorModel) &&
          <div>
            <canvas ref={canvasColorPickerOkHSV} class="colorpicker__element" id="okhsv_sv_canvas" width="257" height="257"></canvas>
            
            <svg class="colorpicker__handler" width="257" height="257">
              <g transform="translate(0,0)">
                <g ref={manipulatorColorPickerOkHSV} id="okhsv_sv_manipulator" transform="translate(0,0)">
                  <circle cx="0" cy="0" r="5" fill="none" stroke-width="1.75" stroke="#ffffff" ></circle>
                  <circle cx="0" cy="0" r="6" fill="none" stroke-width="1.25" stroke="#000000" ></circle>
                </g>
              </g>
            </svg>
          </div>
        }

      </div>

      <div class="colorslider">
        <canvas ref={canvasHueSliderOkHSL} class="colorslider__element" id="okhsl_h_canvas" width="15" height="257"></canvas>

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
        
      { (colorModel == "okhsl" || initColorModel) &&
        <div style="margin-top: 20px;">
          <h3>hsl</h3>
          {/* <label for="hue">Hue</label> */}
          <input onChange={updateFromInput} id="hue" type="number" min="0" max="360" value={hslValues.hue} spellcheck={false} />
        
          {/* <label for="saturation">Saturation</label> */}
          <input onChange={updateFromInput} id="saturation" type="number" min="0" max="100" value={hslValues.saturation} spellcheck={false} />
        
          {/* <label for="lightness">Lightness</label> */}
          <input onChange={updateFromInput} id="lightness" type="number" min="0" max="100" value={hslValues.lightness} spellcheck={false} />
        </div>
      }

      { (colorModel == "okhsv" || initColorModel) &&
        <div style="margin-top: 20px;">
          <h3>hsv</h3>
          <input onChange={updateFromInput} id="hue" type="number" min="0" max="360" value={hsvValues.hue} spellcheck={false} />
          <input onChange={updateFromInput} id="saturation" type="number" min="0" max="100" value={hsvValues.saturation} spellcheck={false} />
          <input onChange={updateFromInput} id="lightness" type="number" min="0" max="100" value={hsvValues.value} spellcheck={false} />
        </div>
      }
    </>
  )
  
}