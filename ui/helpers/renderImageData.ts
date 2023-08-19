// We keep this file for archive purpose just in case but know the rendering of color picker is done with WebGL shaders.

import { LOW_RES_PICKER_SIZE, LOW_RES_PICKER_SIZE_OKLCH, OKLCH_CHROMA_SCALE, debugMode } from "../constants";

import { converter, clampChromaInGamut } from "../helpers/culori.mjs";
import type { Rgb, Oklch } from "../helpers/culori.mjs";

const localDebugMode = false;

const convertToRgb = converter("rgb");

export const renderImageData = function(hue: number, colorModel: string, fileColorProfile: string): ImageData {
  if (debugMode) { console.log("UI: renderImageData()"); }

  let imageData: ImageData;
  let okhxyX: number;
  let okhxyY: number;
  let pixelIndex: number;
  
  if (colorModel === "okhsl" || colorModel === "okhsv") {
    imageData = new ImageData(LOW_RES_PICKER_SIZE, LOW_RES_PICKER_SIZE);

    for (let y = 0; y < LOW_RES_PICKER_SIZE; y++) {
      for (let x = 0; x < LOW_RES_PICKER_SIZE; x++) {

        okhxyX = x / LOW_RES_PICKER_SIZE;
        okhxyY = (LOW_RES_PICKER_SIZE - y) / LOW_RES_PICKER_SIZE;

        let rgbColor: Rgb;

        if (colorModel === "okhsl") {
          rgbColor = convertToRgb({mode: "okhsl", h: hue, s: okhxyX, l: okhxyY});
        }
        else if (colorModel === "okhsv") {
          rgbColor = convertToRgb({mode: "okhsv", h: hue, s: okhxyX, v: okhxyY});
        }

        pixelIndex = (y * LOW_RES_PICKER_SIZE + x) * 4;
        imageData.data[pixelIndex] = rgbColor.r * 255;
        imageData.data[pixelIndex + 1] = rgbColor.g * 255;
        imageData.data[pixelIndex + 2] = rgbColor.b * 255;
        imageData.data[pixelIndex + 3] = 255;
      }
    }
  }
  else if (colorModel === "oklch" || colorModel === "oklchCss") {
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

    imageData = new ImageData(LOW_RES_PICKER_SIZE_OKLCH, LOW_RES_PICKER_SIZE_OKLCH);
    
    let rgbColor: Rgb;
    let pixelIndex: number;
    
    let bgColorLuminosity = 0;

    let currentChroma: number;
    let currentLuminosity: number;

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

    for (let y = 0; y < LOW_RES_PICKER_SIZE_OKLCH; y++) {

      if (localDebugMode) {
        console.log("-");
        console.log("Luminosity = " + ((LOW_RES_PICKER_SIZE_OKLCH - y) / LOW_RES_PICKER_SIZE_OKLCH));
        numberOfRenderedPixelsForCurrentLine = 0;
      }

      currentLuminosity = (LOW_RES_PICKER_SIZE_OKLCH - y) / LOW_RES_PICKER_SIZE_OKLCH;

      sRGBMaxChroma = clampChromaInGamut({ mode: "oklch", l: currentLuminosity, c: 0.37, h: hue }, "oklch", "rgb");
      P3MaxChroma = clampChromaInGamut({ mode: "oklch", l: currentLuminosity, c: 0.37, h: hue }, "oklch", "p3");

      for (let x = 0; x < LOW_RES_PICKER_SIZE_OKLCH; x++) {
        currentChroma = x / (LOW_RES_PICKER_SIZE_OKLCH * OKLCH_CHROMA_SCALE);
  
        pixelIndex = (y * LOW_RES_PICKER_SIZE_OKLCH + x) * 4;

        if (currentChroma > sRGBMaxChroma.c && !whitePixelRendered && fileColorProfile === "p3") {
          imageData.data[pixelIndex] = 255;
          imageData.data[pixelIndex + 1] = 255;
          imageData.data[pixelIndex + 2] = 255;
          imageData.data[pixelIndex + 3] = 255;
          whitePixelRendered = true;
        }
        else if ((fileColorProfile === "p3" && currentChroma > P3MaxChroma.c) || (fileColorProfile === "rgb" && currentChroma > sRGBMaxChroma.c)) {
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

          rgbColor = convertToRgb({mode: "oklch", h: hue, c: currentChroma, l: currentLuminosity});
          imageData.data[pixelIndex] = rgbColor.r * 255;
          imageData.data[pixelIndex + 1] = rgbColor.g * 255;
          imageData.data[pixelIndex + 2] = rgbColor.b * 255;
          imageData.data[pixelIndex + 3] = 255;
        }
      }
      
      if (localDebugMode) {
        console.log("Number of rendered pixels for current line = " + numberOfRenderedPixelsForCurrentLine);
      }
      
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