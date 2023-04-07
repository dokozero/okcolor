import { lowResPickerSize, lowResPickerSizeOklch, oklchChromaScale, debugMode } from "./constants";

import { converter, clampChroma } from "../../node_modules/culori/bundled/culori.mjs";
import type { Rgb, Oklch } from "../../node_modules/culori/bundled/culori.mjs";

const localDebugMode = false;

const convertToRgb = converter("rgb");

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

    // For local debug if needed.
    let numberOfClampChromaTestsForCurrentLine = 0;
    let numberOfTotalClampChromaTests = 0;
    let numberOfRenderedPixelsForCurrentLine = 0;
    let numberOfTotalRenderedPixels = 0;

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

    let chroma: number;
    let luminosity: number;
    let previousClampedChroma = 0;

    for (let y = 0; y < lowResPickerSizeOklch; y++) {

      if (localDebugMode) {
        console.log("-");
        console.log("Luminosity = " + ((lowResPickerSizeOklch - y) / lowResPickerSizeOklch));
        numberOfRenderedPixelsForCurrentLine = 0;
      }

      for (let x = 0; x < lowResPickerSizeOklch; x++) {
        chroma = x / (lowResPickerSizeOklch * oklchChromaScale);
        luminosity = (lowResPickerSizeOklch - y) / lowResPickerSizeOklch;
        
        if (!chromaIsClamped && chroma > previousClampedChroma) {

          if (localDebugMode) {
            numberOfClampChromaTestsForCurrentLine++;
            numberOfTotalClampChromaTests++;
          }

          clamped = clampChroma({ mode: "oklch", l: luminosity, c: chroma, h: hue }, "oklch");
          
          if (chroma > clamped.c) {
            chroma = clamped.c;
            chromaIsClamped = true;

            // We store this value to avoid testing the chroma if we don't have reached the previous value. The 0.005 is to avoid rendering a bit too far when we render the curve from the pick chroma to black.
            previousClampedChroma = clamped.c - 0.005;

            if (localDebugMode) { console.log("Number of clamp chroma tests = " + numberOfClampChromaTestsForCurrentLine); }
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
          if (localDebugMode) {
            numberOfRenderedPixelsForCurrentLine++;
            numberOfTotalRenderedPixels++;
          }

          rgbColor = convertToRgb({mode: "oklch", h: hue, c: chroma, l: luminosity});
          imageData.data[pixelIndex] = rgbColor.r * 255;
          imageData.data[pixelIndex + 1] = rgbColor.g * 255;
          imageData.data[pixelIndex + 2] = rgbColor.b * 255;
          imageData.data[pixelIndex + 3] = 255;
        }
      }
      
      if (localDebugMode) {
        console.log("Number of rendered pixles for current line = " + numberOfRenderedPixelsForCurrentLine);
        numberOfClampChromaTestsForCurrentLine = 0;
      }
      
      chromaIsClamped = false;
    }

    if (localDebugMode) {
      console.log("---");
      console.log("Done");
      console.log("Number of total clamp chroma tests = " + numberOfTotalClampChromaTests);
      console.log("Number of total rendered pixels = " + numberOfTotalRenderedPixels);
    }
  
  }

  return imageData;
}