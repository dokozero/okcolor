import { signal } from "@preact/signals";
import { useRef, useEffect } from "preact/hooks";

import { okhsl_to_srgb, srgb_to_okhsl, rgb_to_hex } from "./bottosson/colorconversion";
import { render_okhsl, render_static } from "./bottosson/render";

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
  const canvasHueSliderOkHSL = useRef(null);
  const manipulatorColorPickerOkHSL = useRef(null);
  const manipulatorHueSliderOkHSL = useRef(null);

  function clamp(x) {
    return x < eps ? eps : (x > 1-eps ? 1-eps : x);
  }

  useEffect(() => {
    setup_hsl_handlers(srgb_to_okhsl, okhsl_to_srgb);
    update(true);

    let results = render_static();

    display_okhsl_slider(results);
  }, []);

  
  // const worker_okhsl = new MyWorker();

  function display_results_okhsl(results) {
    let ctx = canvasColorPickerOkHSL.current.getContext('2d');
    ctx.putImageData(results["okhsl_sl"], 0, 0);
  }

  function display_okhsl_slider(results) {
    let ctx = canvasHueSliderOkHSL.current.getContext('2d');
    ctx.putImageData(results["okhsl_h"], 0, 0);
  }

  function update(render)  {

    // Previously in update_hsl_manipulators()
    let hsl = srgb_to_okhsl(rgbValues.r.value, rgbValues.g.value, rgbValues.b.value);

    document.getElementById(manipulatorColorPickerOkHSL.current.transform.baseVal.getItem(0).setTranslate(picker_size*hsl[1], picker_size*(1-hsl[2])));
    document.getElementById(manipulatorHueSliderOkHSL.current.transform.baseVal.getItem(0).setTranslate(picker_size*hsl[0], 0));

    let hslResult = srgb_to_okhsl(rgbValues.r.value, rgbValues.g.value, rgbValues.b.value);

    hslValues.hue.value = Math.round(hslResult[0] * 360);
    hslValues.saturation.value = Math.round(hslResult[1] * 100);
    hslValues.lightness.value = Math.round(hslResult[2] * 100);


    if (render) {
      let pendingRender = true;
      setTimeout(function()
      {
        pendingRender = false;
        display_results_okhsl(render_okhsl(rgbValues.r.value, rgbValues.g.value, rgbValues.b.value));
      }, 5);
    }        
  }

    
  let mouse_handler = null;

  function setup_handler(canvas, handler) {
    let outer_mouse_handler = function(event) {
      event.preventDefault();

      updateFromCanvas();

      if (event.target.id == "okhsl_sl_canvas") {
        let rect = canvas.getBoundingClientRect();      
        let x = event.clientX - rect.left;
        let y = event.clientY - rect.top;

        handler(x,y);

        update(false);
      }
      else if (event.target.id == "okhsl_h_canvas") {
        let rect = canvas.getBoundingClientRect();      
        let y = event.clientX - rect.left;
        let x = event.clientY - rect.top;

        handler(x,y);

        update(true);
      }

    };

    canvas.addEventListener('mousedown', function(event) {
      mouse_handler = outer_mouse_handler;
      outer_mouse_handler(event);
    }, false);
  }

  document.addEventListener('mouseup', function(event) {
    if (mouse_handler !== null) {
      mouse_handler(event);
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

    parent.postMessage({ pluginMessage: { type: 'changeFillColor', values, } }, '*');

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

    parent.postMessage({ pluginMessage: { type: "changeFillColor", values, } }, '*');
  }

  onmessage = (event) => {
    rgbValues.r.value = Math.round(event.data.pluginMessage.r);
    rgbValues.g.value = Math.round(event.data.pluginMessage.g);
    rgbValues.b.value = Math.round(event.data.pluginMessage.b);

    update(true);

    hslValues.hue.value = event.data.pluginMessage.hue;
    hslValues.saturation.value = event.data.pluginMessage.saturation;
    hslValues.lightness.value = event.data.pluginMessage.lightness;
  }

  return (
    <>
      <div class="colorpicker">
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

      <div class="colorslider">
        <canvas ref={canvasHueSliderOkHSL} class="colorslider__element" id="okhsl_h_canvas" width="15" height="257"></canvas>

        <svg class="colorslider__handler" width="257" height="15"> 
          <g transform="translate(0,7)">
            <g ref={manipulatorHueSliderOkHSL} id="okhsl_h_manipulator" transform="translate(0,0)">
              <circle cx="0" cy="0" r="5" fill="none" stroke-width="1.75" stroke="#ffffff" ></circle>
              <circle cx="0" cy="0" r="6" fill="none" stroke-width="1.25" stroke="#000000" ></circle>
            </g>
          </g>
        </svg>
      </div>
      
      <div style="margin-top: 30px;">
        {/* <label for="hue">Hue</label> */}
        <input onChange={updateFromInput} id="hue" type="number" min="0" max="360" value={hslValues.hue} spellcheck={false} />
      
        {/* <label for="saturation">Saturation</label> */}
        <input onChange={updateFromInput} id="saturation" type="number" min="0" max="100" value={hslValues.saturation} spellcheck={false} />
      
        {/* <label for="lightness">Lightness</label> */}
        <input onChange={updateFromInput} id="lightness" type="number" min="0" max="100" value={hslValues.lightness} spellcheck={false} />
      </div>
    </>
  )
  
}