import { lowResPickerSize, lowResPickerSizeOklch, oklchChromaScale, debugMode } from "./constants";

import { converter, clampChroma } from "../../node_modules/culori/bundled/culori.mjs";
import type { Rgb, Oklch } from "../../node_modules/culori/bundled/culori.mjs";

let convertToRgb = converter('rgb');

export function renderImageData(hue: number, colorModel: string, isDarkMode: boolean): ImageData {
  if (debugMode) { console.log("UI: renderImageData()"); }

  let imageData: ImageData;
  let okhxyX: number;
  let okhxyY: number;
  let pixelIndex: number;
  
  if (colorModel === "okhsl" || colorModel === "okhsv") {
    imageData = new ImageData(lowResPickerSize, lowResPickerSize);

    for (let y = 0; y < lowResPickerSize; y++) {
      for (let x = 0; x < lowResPickerSize; x++) {

        okhxyX = x / lowResPickerSize;
        okhxyY = (lowResPickerSize - y) / lowResPickerSize;

        let rgbColor: Rgb;

        if (colorModel === "okhsl") {
          rgbColor = convertToRgb({mode: "okhsl", h: hue, s: okhxyX, l: okhxyY});
        }
        else if (colorModel === "okhsv") {
          rgbColor = convertToRgb({mode: "okhsv", h: hue, s: okhxyX, v: okhxyY});
        }

        pixelIndex = (y * lowResPickerSize + x) * 4;
        imageData.data[pixelIndex] = rgbColor.r * 255;
        imageData.data[pixelIndex + 1] = rgbColor.g * 255;
        imageData.data[pixelIndex + 2] = rgbColor.b * 255;
        imageData.data[pixelIndex + 3] = 255;
      }
    }
  }
  else if (colorModel === "oklch") {
    imageData = new ImageData(lowResPickerSizeOklch, lowResPickerSizeOklch);
    
    let chromaIsClamped = false;
    let clamped: Oklch;
    let rgbColor: Rgb;
    let pixelIndex: number;
    
    let bgColorLuminosity = 0;

    if (isDarkMode) {
      bgColorLuminosity = 35;
    }
    else {
      bgColorLuminosity = 70;
    }

    let bgColor = convertToRgb({mode: "oklch", h: hue, c: 1, l: bgColorLuminosity});

    let previousClampedChroma = 0;

    // let numberOfClampChromaCalls = 0;
    // let numberOfconvertToRgbCalls = 0;

    let chroma: number;
    let luminosity: number;

    for (let y = 0; y < lowResPickerSizeOklch; y++) {
      for (let x = 0; x < lowResPickerSizeOklch; x++) {

        chroma = x / (lowResPickerSizeOklch * oklchChromaScale);
        luminosity = (lowResPickerSizeOklch - y) / lowResPickerSizeOklch;
        
        if (!chromaIsClamped && chroma > previousClampedChroma) {
          // numberOfClampChromaCalls++;
          clamped = clampChroma({ mode: 'oklch', l: luminosity, c: chroma, h: hue }, 'oklch');

          if ( chroma > clamped.c) {
            chroma = clamped.c;

            chromaIsClamped = true;
            previousClampedChroma = clamped.c;
          }
        }
  
        pixelIndex = (y * lowResPickerSizeOklch + x) * 4;

        if (chromaIsClamped) {
          imageData.data[pixelIndex] = bgColor.r;
          imageData.data[pixelIndex + 1] = bgColor.g;
          imageData.data[pixelIndex + 2] = bgColor.b;
          imageData.data[pixelIndex + 3] = 255;
        }
        else {
          rgbColor = convertToRgb({mode: "oklch", h: hue, c: chroma, l: luminosity});
          // numberOfconvertToRgbCalls++;
          imageData.data[pixelIndex] = rgbColor.r * 255;
          imageData.data[pixelIndex + 1] = rgbColor.g * 255;
          imageData.data[pixelIndex + 2] = rgbColor.b * 255;
          imageData.data[pixelIndex + 3] = 255;
        }
      }
      chromaIsClamped = false;
    }

    // console.log(numberOfClampChromaCalls, numberOfconvertToRgbCalls);
  
  }

  return imageData;
}