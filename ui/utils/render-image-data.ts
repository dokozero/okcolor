import { lowResPickerSize, lowResPickerSizeOklch, oklchChromaScale, debugMode } from "./constants";

import { converter, clampChromaInGamut } from "../../node_modules/culori/bundled/culori.mjs";
import type { Rgb, Oklch } from "../../node_modules/culori/bundled/culori.mjs";

const localDebugMode = false;

let colorSpace = "p3";

const convertToRgb = converter("rgb");

export const renderImageData = function(hue: number, colorModel: string): ImageData {
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

    let currentTheme: string;

    if (document.documentElement.classList.contains("figma-dark")) {
      currentTheme = "dark";
    }
    else {
      currentTheme = "light";
    }

    // For local debug if needed.
    let numberOfRenderedPixelsForCurrentLine = 0;
    let numberOfTotalRenderedPixels = 0;

    imageData = new ImageData(lowResPickerSizeOklch, lowResPickerSizeOklch);
    
    let rgbColor: Rgb;
    let pixelIndex: number;
    
    let bgColorLuminosity = 0;

    let chroma: number;
    let luminosity: number;

    let whitePixelRendered = false;

    let sRGBMaxChroma: Oklch;
    let P3MaxChroma: Oklch;

    if (currentTheme === "dark") {
      bgColorLuminosity = 35;
    }
    else {
      bgColorLuminosity = 70;
    }

    let bgColor = convertToRgb({mode: "oklch", h: hue, c: 1, l: bgColorLuminosity});

    for (let y = 0; y < lowResPickerSizeOklch; y++) {

      if (localDebugMode) {
        console.log("-");
        console.log("Luminosity = " + ((lowResPickerSizeOklch - y) / lowResPickerSizeOklch));
        numberOfRenderedPixelsForCurrentLine = 0;
      }

      luminosity = (lowResPickerSizeOklch - y) / lowResPickerSizeOklch;

      sRGBMaxChroma = clampChromaInGamut({ mode: "oklch", l: luminosity, c: 0.37, h: hue }, "oklch", "rgb");
      P3MaxChroma = clampChromaInGamut({ mode: "oklch", l: luminosity, c: 0.37, h: hue }, "oklch", "p3");

      for (let x = 0; x < lowResPickerSizeOklch; x++) {
        chroma = x / (lowResPickerSizeOklch * oklchChromaScale);
  
        pixelIndex = (y * lowResPickerSizeOklch + x) * 4;

        if (chroma > sRGBMaxChroma.c && !whitePixelRendered && colorSpace === "p3") {
          imageData.data[pixelIndex] = 255;
          imageData.data[pixelIndex + 1] = 255;
          imageData.data[pixelIndex + 2] = 255;
          imageData.data[pixelIndex + 3] = 255;
          whitePixelRendered = true;
        }
        else if ((colorSpace === "p3" && chroma > P3MaxChroma.c) || (colorSpace === "srgb" && chroma > sRGBMaxChroma.c)) {
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
      }
      
      // chromaIsClampedSrgb = false;
      // chromaIsClampedP3 = false;
      whitePixelRendered = false;
    }

    if (localDebugMode) {
      console.log("---");
      console.log("Done");
      console.log("Number of total rendered pixels = " + numberOfTotalRenderedPixels);
    }
  
  }

  return imageData!;
};