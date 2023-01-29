import { signal } from "@preact/signals";
import { useRef } from "preact/hooks";

import { colorConversion } from "../lib/bottosson/colorconversion";
import { render, render_okhsl, render_static } from "../lib/bottosson/render";
import { picker_size, eps } from "../lib/bottosson/constants";

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
  const canvasColorPicker = useRef(null);
  const canvasHueSlider = useRef(null);
  const canvasOpacitySlider = useRef(null);
  const manipulatorColorPicker = useRef(null);
  const manipulatorHueSlider = useRef(null);
  const manipulatorOpacitySlider = useRef(null);

  let init: boolean = true;

  let shapeFillStrokeInfo = {
    "hasFill": false,
    "hasStroke": false
  };

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
        okhxyValues.hue.value = Math.round(limitMouseHandlerValue(canvas_y/picker_size) * 360);

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
    if (event.data.pluginMessage.message == "new shape color") {
      // console.log("Update from backend - new shape color");

      // If the previous shape didn't have fill its radio button is disabled, so if the new one has it we enable it again.
      if (!shapeFillStrokeInfo.hasFill && event.data.pluginMessage.shapeFillStrokeInfo.hasFill && !init) {
        fillOrStrokeSelector.current.children.fill.disabled = false;
      }
      // If the previous shape didn't have stroke its radio button is disabled, so if the new one has it we enable it again.
      if (!shapeFillStrokeInfo.hasStroke && event.data.pluginMessage.shapeFillStrokeInfo.hasStroke && !init) {
        fillOrStrokeSelector.current.children.stroke.disabled = false;
      }

      shapeFillStrokeInfo = event.data.pluginMessage.shapeFillStrokeInfo;

      if (currentFillOrStroke == "fill") {
        if (!shapeFillStrokeInfo.hasFill) {
          currentFillOrStroke = "stroke";
          fillOrStrokeSelector.current.children.stroke.checked = true;
          fillOrStrokeSelector.current.children.fill.disabled = true;
        }
        else if (!shapeFillStrokeInfo.hasStroke) {
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
          fillOrStrokeSelector.current.children.fill.disabled = true;
        }
      }

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
    // We have this separate message only when we change between fill and stroke with the same shape, this is to avoid doing again the test in "new shape color" on shapeFillStrokeInfo.
    else if (event.data.pluginMessage.message == "current shape color") {
      // console.log("Update from backend - current shape color");

      rgbValues = event.data.pluginMessage.rgbValues;
      opacityValue.value = event.data.pluginMessage.opacityValue;
      updateOkhxyValuesFromRgbValues()
      renderOpacitySliderCanvas();
      updateManipulatorPositions.all();
      renderColorPickerCanvas(rgbValues);
    }
  }


  
  return (
    <>
      <div ref={fillOrStrokeSelector}>
        <input onChange={fillOrStrokeHandle} type="radio" id="fill" name="fill_or_stroke" value="fill" defaultChecked/>
        <label for="fill">Fill</label>

        <input onChange={fillOrStrokeHandle} type="radio" id="stroke" name="fill_or_stroke" value="stroke"/>
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