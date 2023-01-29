import { signal } from "@preact/signals";
import { useRef } from "preact/hooks";

import { colorConversion } from "../bottosson/colorconversion";
import { render, render_okhsl, render_static } from "../bottosson/render";
import { picker_size, eps } from "../bottosson/constants";

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
  const canvasColorPicker = useRef(null);
  const canvasHueSlider = useRef(null);
  const canvasOpacitySlider = useRef(null);
  const manipulatorColorPicker = useRef(null);
  const manipulatorHueSlider = useRef(null);
  const manipulatorOpacitySlider = useRef(null);

  let init = true;

  let rgbValues = [0, 0, 0];

  let fillOrStroke: string = "fill";
  let colorModel: string = "okhsl";

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


  function renderColorPickerCanvas(rgb) {
    // console.log("render Color Picker Canvas");

    let results;
    let ctx = canvasColorPicker.current.getContext("2d");

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
    // else if (colorModel == "oklch") {
    //   results = render(rgb[0], rgb[1], rgb[2]);
    //   ctx.putImageData(results["oklch_lc"], 0, 0);
    // }

    // setTimeout(function(){
    // }, 5);
  }

  function renderHueSliderCanvas() {
    // console.log("render Hue Slider Canvas");

    let results = render_static();
    let ctx = canvasHueSlider.current.getContext("2d");
    ctx.putImageData(results["okhsl_h"], 0, 0);
  }

  function renderOpacitySliderCanvas() {
    // console.log("render opacity Slider Canvas");

    let ctx = canvasOpacitySlider.current.getContext("2d");
    const gradient = ctx.createLinearGradient(0, 0, 0, picker_size);
    
    gradient.addColorStop(0, "white");
    gradient.addColorStop(1, `rgba(${rgbValues[0]}, ${rgbValues[1]}, ${rgbValues[2]}, 1)`)

    // Set the fill style and draw a rectangle
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 15, picker_size);

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
      document.getElementById(manipulatorHueSlider.current.transform.baseVal.getItem(0).setTranslate(picker_size*hue, 0));
    },
    opacitySlider() {
      // console.log("update Manipulator Positions - opacity slider");
      let opacity = opacityValue.value / 100;
      document.getElementById(manipulatorOpacitySlider.current.transform.baseVal.getItem(0).setTranslate(picker_size*opacity, 0));
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

    fillOrStroke = event.target.id;

    parent.postMessage({ pluginMessage: { type: "send me shape color", "fillOrStroke": fillOrStroke} }, "*");
  }


  function colorModelHandle(event) {
    // console.log("color Model Handle");

    colorModel = event.target.value;
    
    updateOkhxyValuesFromRgbValues();
    updateManipulatorPositions.colorPicker();
    renderColorPickerCanvas(rgbValues);
  }


  // TODO - handle case where mouse go out plugin's window.
  function setupHandler(canvas) {
    // console.log("setup Handler - " + canvas.id);

    const mouseHandler = (event) => {
      event.preventDefault();

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

        rgbValues = colorConversion(colorModel, "srgb", okhxyValues.hue.value, okhxyValues.x.value, okhxyValues.y.value);

        // Temp note - oklch code 1
        
        updateShapeColor();
        updateManipulatorPositions.colorPicker();
      }
      else if (mouseHandlerEventTargetId == "okhxy_h_canvas") {
        let canvas_y = event.clientX - rect.left;
        okhxyValues.hue.value = Math.round(limitMouseHandlerValue(canvas_y/picker_size) * 360);

        // We do this to be abble to change the hue value on the color picker canvas when we have a white or black value. If we don't to this fix, the hue value will always be the same on the color picker canvas.
        let x = clamp(okhxyValues.x.value, 0.1, 99.9);
        let y = clamp(okhxyValues.y.value, 0.1, 99.9);
        rgbValues = colorConversion(colorModel, "srgb", okhxyValues.hue.value, x, y);

        // Temp note - oklch code 2

        renderColorPicker = true;
      
        updateShapeColor();
        updateManipulatorPositions.hueSlider();
      }
      else if (mouseHandlerEventTargetId == "opacity_canvas") {
        let canvas_y = event.clientX - rect.left;
        opacityValue.value = Math.round(limitMouseHandlerValue(canvas_y/picker_size) * 100);

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
    parent.postMessage({ pluginMessage: { type: "update shape color", "fillOrStroke": fillOrStroke,  rgbValues } }, '*');
  }

  function updateShapeOpacity() {
    // console.log("update Shape Opacity");
    parent.postMessage({ pluginMessage: { type: "update shape opacity", "fillOrStroke": fillOrStroke,  "opacityValue": opacityValue.value } }, '*');
  }


  /* 
  ** UPDATES FROM BACKEND
  */

  onmessage = (event) => {
    if (event.data.pluginMessage.message == "new shape color") {
      rgbValues = event.data.pluginMessage.rgbValues;

      opacityValue.value = event.data.pluginMessage.opacityValue;

      updateOkhxyValuesFromRgbValues();

      if (init) {
        // console.log("- Init function");

        renderHueSliderCanvas();

        setupHandler(canvasColorPicker.current);
        setupHandler(canvasHueSlider.current);
        setupHandler(canvasOpacitySlider.current);

        init = false;

        // console.log("- End init function");
      }

      renderOpacitySliderCanvas();
      updateManipulatorPositions.all();
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

        <canvas ref={canvasColorPicker} class="colorpicker__canvas" id="okhxy_xy_canvas" width="257" height="257"></canvas>

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
        <canvas ref={canvasHueSlider} class="colorslider__canvas" id="okhxy_h_canvas" width="15" height="257"></canvas>

        <svg class="colorslider__handler" width="257" height="15"> 
          <g transform="translate(0,7)">
            <g ref={manipulatorHueSlider} id="okhsl_h_manipulator" transform="translate(0,0)">
              <circle cx="0" cy="0" r="5" fill="none" stroke-width="1.75" stroke="#ffffff" ></circle>
              <circle cx="0" cy="0" r="6" fill="none" stroke-width="1.25" stroke="#000000" ></circle>
            </g>
          </g>
        </svg>
      </div>

      <div class="opacityslider" style="margin-top: 16px;">
        <canvas ref={canvasOpacitySlider} class="opacityslider__canvas" id="opacity_canvas" width="15" height="257"></canvas>

        <svg class="opacityslider__handler" width="257" height="15"> 
          <g transform="translate(0,7)">
            <g ref={manipulatorOpacitySlider} id="opacity_manipulator" transform="translate(0,0)">
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
        <input onChange={opacityInputHandle} id="opacity" type="number" min="0" max="100" value={opacityValue} spellcheck={false} />
      </div>
    </>
  )
}