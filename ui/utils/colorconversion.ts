import { converter, formatHex, clampChroma } from "../../node_modules/culori/bundled/culori.mjs";
import type { Rgb, Okhsl, Okhsv, Oklch } from "../../node_modules/culori/bundled/culori.mjs";

import { clampNumber } from "./others";

const convertToRgb = converter('rgb');
const convertToOkhsl = converter('okhsl');
const convertToOkhsv = converter('okhsv');
const convertToOklch = converter('oklch');

export function colorConversion(from: string, to: string, param1: number, param2: number, param3: number): [number, number, number] {
  let culoriResult: Rgb | Okhsl | Okhsv | Oklch;
  let result: [number, number, number] = [0, 0, 0];

  // We do this before calling convertToRgb() to send back the correct peak values. If we don't to this, the to_srgb color conversion function will not send peak rgb values when needed.
  if (from === "okhsl" || from === "okhsv") {

    const pickColorRgb: { [key: string]: [number, number, number] } = {
      "red": [255, 0, 0],
      "green": [0, 255, 0],
      "blue": [0, 0, 255],
      "yellow": [255, 255, 0],
      "pink": [255, 0, 255],
      "cyan": [0, 255, 255],
    }

    const pickColorConditions: { [key: string]: { [key: string]: boolean } } = {
      "okhsl": {
        "red": (from === "okhsl" && param1 === 29 && param2 > 99 && param3 === 57),
        "green": (from === "okhsl" && param1 === 142 && param2 > 99 && param3 === 84),
        "blue": (from === "okhsl" && param1 === 264 && param2 > 99 && param3 === 37),
        "yellow": (from === "okhsl" && param1 === 110 && param2 > 99 && param3 === 96),
        "pink": (from === "okhsl" && param1 === 328 && param2 > 99 && param3 === 65),
        "cyan": (from === "okhsl" && param1 === 195 && param2 > 99 && param3 === 89)
      },
      "okhsv": {
          "red": (from === "okhsv" && param1 === 29 && param2 > 99 && param3 > 99),
          "green": (from === "okhsv" && param1 === 142 && param2 > 99 && param3 > 99),
          "blue": (from === "okhsv" && param1 === 264 && param2 > 99 && param3 > 99),
          "yellow": (from === "okhsv" && param1 === 110 && param2 > 99 && param3 > 99),
          "pink": (from === "okhsv" && param1 === 328 && param2 > 99 && param3 > 99),
          "cyan": (from === "okhsv" && param1 === 195 && param2 > 99 && param3 > 99)
      }
    };

    let currentKey;

    for (let i = 0; i < Object.keys(pickColorRgb).length; i++) {
      currentKey = Object.keys(pickColorRgb)[i];

      if (pickColorConditions.okhsl[currentKey] || pickColorConditions.okhsv[currentKey]) {
        result = pickColorRgb[currentKey];
        return result;
      }
    }
  }

  if (to === "srgb") {
      // convertToRgb() needs these values between 0 and 1.
      param2 = param2 / 100;
      param3 = param3 / 100;
  }

  if (from === "srgb") {
    param1 = param1 / 255;
    param2 = param2 / 255;
    param3 = param3 / 255;
  }

  let clamped: Oklch;

  if (from === "oklch") {
    clamped = clampChroma({ mode: 'oklch', l: param3, c: param2, h: param1 }, 'oklch');
    param2 = clamped.c;
  }

  // We have to use formatHex for converting from srgb because if not we get wrong saturation values (like 0.5 instead of 1).
  if (from === "okhsl" && to === "srgb") { culoriResult = convertToRgb({mode: "okhsl", h: param1, s: param2, l: param3}); }
  else if (from === "okhsv" && to === "srgb") { culoriResult = convertToRgb({mode: "okhsv", h: param1, s: param2, v: param3}); }
  else if (from === "oklch" && to === "srgb") { culoriResult = convertToRgb({mode: "oklch", h: param1, c: param2, l: param3}); }
  else if (from === "srgb" && to === "okhsl") { culoriResult = convertToOkhsl(formatHex({mode: "rgb", r: param1, g: param2, b: param3})); }
  else if (from === "srgb" && to === "okhsv") { culoriResult = convertToOkhsv(formatHex({mode: "rgb", r: param1, g: param2, b: param3})); }
  else if (from === "srgb" && to === "oklch") { culoriResult = convertToOklch(formatHex({mode: "rgb", r: param1, g: param2, b: param3})); }


  if (to === "srgb") {
    if (param3 === 0) {
      // If we have a black color (luminosity / value = 0), convertToRgb() return NaN for the RGb values so we fix this.
      result[0] = 0;
      result[1] = 0;
      result[2] = 0;
    }
    else {
      result[0] = clampNumber(culoriResult.r*255, 0, 255);
      result[1] = clampNumber(culoriResult.g*255, 0, 255);
      result[2] = clampNumber(culoriResult.b*255, 0, 255);
    }
  }
  else if (to === "okhsl") {
    result[0] = Math.round(culoriResult.h);
    result[1] = Math.round(culoriResult.s*100);
    result[2] = Math.round(culoriResult.l*100);
  }
  else if (to === "okhsv") {
    result[0] = Math.round(culoriResult.h);
    result[1] = Math.round(culoriResult.s*100);
    result[2] = Math.round(culoriResult.v*100);
  }
  else if (to === "oklch") {
    result[0] = Math.round(culoriResult.h);
    result[1] = Math.round(culoriResult.c*100);
    result[2] = Math.round(culoriResult.l*100);
  }

  // If we have a black or white color, we will not get a hue so we set it to 0.
  if (from === "srgb" && Number.isNaN(result[0])) {
    result[0] = 0;
  }
  // else if (from === "srgb" && to === "oklch") {

  //   // Temporary fix of #0000FF being out of the triangle shape (same problem with oklch.com, see https://github.com/evilmartians/oklch-picker/issues/78. Might come from CuloriJS, but on https://bottosson.github.io/misc/colorpicker/#0000ff we have it also, if we insert #0000FF in the HEx input then change the H input on OkLCH from 265 back to 264, the OkLCH triangle shape doesn't render the same.)
  //   if (param1 <= 5/255 && param2 <= 5/255 && param3 <= 255/255) {
  //     result[0] = 265;
  //   }
  // }

  return result;
}
