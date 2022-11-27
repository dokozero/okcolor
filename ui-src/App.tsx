import { signal } from "@preact/signals";
import { useRef, useEffect } from "preact/hooks";

import { okhsl_to_srgb, srgb_to_okhsl, rgb_to_hex } from "./bottosson/colorconversion";
// import { eps, picker_size } from "./bottosson/constants";
import { render_okhsl } from "./bottosson/render";

// import MyWorker from "./bottosson/workerokhsl?worker&inline";

export function App() { 

  // let blob = new Blob([
  //   document.querySelector('#workerokhsl').textContent
  // ], { type: "text/javascript" })

  // let worker_okhsl = new Worker(window.URL.createObjectURL(blob),{
  //   type: 'module'
  // });

  const canvas = useRef(null);
  const manipulator = useRef(null);

  useEffect(() => {
    const el2 = canvas.current;

    setup_hsl_handlers("okhsl", srgb_to_okhsl, okhsl_to_srgb);
    update(true);
  }, []);

  // const worker_okhsl = new MyWorker();


  const picker_size = 257;
  const eps = 0.0001;


  // m = location.hash.match(/^#([0-9a-f]{6})$/i);
  // if (m) 
  // {
  //     r = eps + (1-2*eps)*parseInt(m[1].substr(0,2),16);
  //     g = eps + (1-2*eps)*parseInt(m[1].substr(2,2),16);
  //     b = eps + (1-2*eps)*parseInt(m[1].substr(4,2),16);
  // }


  // let worker_okhsl = new Worker('workerokhsl.js');    
  // worker_okhsl.onmessage = function(e) 
  // {
  //     display_results_okhsl(e.data);
  // };

  function update_canvas(image) {
      let ctx = canvas.current.getContext('2d');
      ctx.putImageData(image, 0, 0);
  }

  function display_results_okhsl(results) {
      update_canvas(results["okhsl_sl"]);
  }

  function update(render)  {

    function update_hsl_manipulators(prefix, to_hsl) {
      let hsl = to_hsl(rgbValues.r.value, rgbValues.g.value, rgbValues.b.value);
      document.getElementById(manipulator.current.transform.baseVal.getItem(0).setTranslate(picker_size*hsl[1],picker_size*(1-hsl[2])));
      updateFromCanvas();

      let hslResult = srgb_to_okhsl(rgbValues.r.value, rgbValues.g.value, rgbValues.b.value);

      hslValues.hue.value = Math.round(hslResult[0] * 360);
      hslValues.saturation.value = Math.round(hslResult[1] * 100);
      hslValues.lightness.value = Math.round(hslResult[2] * 100);
    }

    update_hsl_manipulators("okhsl", srgb_to_okhsl);

    if (render) {
      display_results_okhsl(render_okhsl(rgbValues.r.value, rgbValues.g.value, rgbValues.b.value));
    }        
  }

    
  let mouse_handler = null;
  let touch_handler = null;

  // function update_url()
  // {
  //     history.replaceState(null, null, rgb_to_hex(rgbValues.r.value, rgbValues.g.value, rgbValues.b.value));
  // }

  function setup_handler(canvas, handler)
  {
      let outer_mouse_handler = function(event) 
      {
          event.preventDefault();

          let rect = canvas.getBoundingClientRect();      
          let x = event.clientX - rect.left;
          let y = event.clientY - rect.top;

          handler(x,y);

          update(false);
      };

      let outer_touch_handler = function(event) 
      {
          event.preventDefault();

          touch = event.touches[0];

          let rect = canvas.getBoundingClientRect();
          let x = touch.clientX - rect.left;
          let y = touch.clientY - rect.top;

          handler(x,y);

          update(false);
      };

      canvas.addEventListener('mousedown', function(event)
      {
          mouse_handler = outer_mouse_handler;
          outer_mouse_handler(event);

      }, false);

      canvas.addEventListener('touchstart', function(event)
      {
          if (event.touches.length === 1)
          {
              touch_handler = outer_touch_handler;
              outer_touch_handler(event);
          }
          else
          {
              touch_handler = null;
          }

      }, false);
  }

  function clamp(x)
  {
      return x < eps ? eps : (x > 1-eps ? 1-eps : x);
  }

  document.addEventListener('mouseup', function(event)
  {
      if (mouse_handler !== null)
      {
          mouse_handler(event);
          mouse_handler = null;
          // update_url();
      }

  }, false);
  document.addEventListener('mousemove', function(event)
  {
      if (mouse_handler !== null)
      {
          mouse_handler(event);      
      }
  }, false);


  function setup_hsl_handlers(prefix, to_hsl, from_hsl)
  {
      setup_handler(canvas.current, function(x, y) 
      {
          let hsl = to_hsl(rgbValues.r.value, rgbValues.g.value, rgbValues.b.value);

          let new_s = clamp(x/picker_size);
          let new_v = clamp(1 - y/picker_size);

          let rgb = from_hsl(hsl[0], new_s, new_v);
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

    // Check here is values are within the boundaries?

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
        <canvas ref={canvas} class="colorpicker_square" id="okhsl_sl_canvas" width="257" height="257"></canvas>
        {/* <canvas class="colorpicker_slider" id="okhsl_h_canvas" width="31" height="257"></canvas> */}

        <svg class="colorpicker" width="326" height="276"> 
          <g transform="translate(10,10)">
            <g ref={manipulator} id="okhsl_sl_manipulator" transform="translate(0,0)">
              <circle cx="0" cy="0" r="5" fill="none" stroke-width="1.75" stroke="#ffffff" ></circle>
              <circle cx="0" cy="0" r="6" fill="none" stroke-width="1.25" stroke="#000000" ></circle>
            </g>
          </g>
        </svg>
      </div>
      
      <div>
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