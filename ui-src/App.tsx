import { signal } from "@preact/signals";

export function App() { 

  const hslValues = {
    hue: signal(0),
    saturation: signal(0),
    lightness: signal(0),
  };

  const sendData = (event) => {
    let id = event.target.id;

    hslValues[id].value = parseInt(event.target.value);

    // Check here is values are within the boundaries?

    let values = {
      hue: hslValues.hue.value,
      saturation: hslValues.saturation.value,
      lightness: hslValues.lightness.value
    };

    parent.postMessage({ pluginMessage: { type: 'changeFillColor', id, values, } }, '*');
  }

  onmessage = (event) => {
    hslValues.hue.value = event.data.pluginMessage.hue;
    hslValues.saturation.value = event.data.pluginMessage.saturation;
    hslValues.lightness.value = event.data.pluginMessage.lightness;
  }

  return (
    <>      
      <div>
        <canvas class="colorpicker_square" id="okhsl_sl_canvas" width="257" height="257"></canvas>
      </div>
      
      <div>
        <label for="hue">Hue</label>
        <input onChange={sendData} id="hue" type="number" min="0" max="360" value={hslValues.hue} spellcheck={false} />
      
        <label for="saturation">Saturation</label>
        <input onChange={sendData} id="saturation" type="number" min="0" max="100" value={hslValues.saturation} spellcheck={false} />
      
        <label for="lightness">Lightness</label>
        <input onChange={sendData} id="lightness" type="number" min="0" max="100" value={hslValues.lightness} spellcheck={false} />
      </div>
    </>
  )

  
}