import { debugMode } from "./constants";

export const clampNumber = function(num: number, min: number, max: number): number {
  if (debugMode) { console.log(`UI: clampNumber(${num}, ${min}, ${max})`); }

  if (num < min) {
    return min;
  }
  else if (num > max) {
    return max;
  }
  else {
    return num;
  }
};

// To constrain the handlers in their limits.
export const limitMouseHandlerValue = function(value: number): number {
  if (debugMode) { console.log("UI: limitMouseHandlerValue()"); }

  if (value < 0.0001) {
    return 0.0001;
  }
  else if (value > 1-0.0001) {
    return 1-0.0001;
  }
  else {
    return value;
  }
};

export const is2DMovementMoreVerticalOrHorizontal = function(prevX: number, prevY: number, actualX: number, actualY: number): string {
  if (debugMode) { console.log("UI: is2DMovementMoreVerticalOrHorizontal()"); }

  const dX = actualX - prevX;
  const dY = actualY - prevY;
  
  if (Math.abs(dX) > Math.abs(dY)) {
    return "horizontal";
  }
  else if (Math.abs(dX) < Math.abs(dY)) {
    return "vertical";
  }
  else {
    return "";
  }
};

export const roundWithDecimal = function(value: number, numberOfDecimal = 1): number {
  if (debugMode) { console.log("UI: roundWithDecimal()"); }

  const roundFormulaValue = Math.pow(10, numberOfDecimal);

  return Math.round(value * roundFormulaValue) / roundFormulaValue;
};


// Thanks to https://forum.figma.com/t/write-to-clipboard-from-custom-plugin/11860/17
const unsecuredCopyToClipboard = function(textToCopy: string) {
  // Create a textarea element
  const textArea = document.createElement("textarea");
  textArea.value = textToCopy;
  document.body.appendChild(textArea);

  // Focus and select the textarea content



  // TODO focus and select already done on input?



  textArea.focus();
  textArea.select();

  // Attempt to copy the text to the clipboard
  try {
    document.execCommand("copy");
  } catch (e) {
    console.log("Unable to copy content to clipboard!", e);
  }

  // Remove the textarea element from the DOM
  document.body.removeChild(textArea);
}

export const copyToClipboard = function(textToCopy: string) {
  // If the context is secure and clipboard API is available, use it
  if ( window.isSecureContext && typeof navigator?.clipboard?.writeText === "function"){
    navigator.clipboard.writeText(textToCopy);
  }
  // Otherwise, use the unsecured fallback
  else {
    unsecuredCopyToClipboard(textToCopy);
  }
}

export const isColorCodeInGoodFormat = function(color: string, format: string, currentColorModel: string): boolean {
  let regex;
  let match;

  let value1;
  let value2;
  let value3;
  let value4;

  if (format === "oklch") {
    regex = /oklch\((\d+(\.\d+)?)%\s(\d+(\.\d+)?)\s(\d+(\.\d+)?)(\s\/\s(\d+(\.\d+)?))?\)/;
    match = color.match(regex);

    if (!match) { return false; }

    value1 = parseFloat(match[1]);
    value2 = parseFloat(match[3]);
    value3 = parseFloat(match[5]);
    value4 = match[8] ? parseFloat(match[8]) : null;

    if (value1 < 0 || value1 > 100) { return false; }
    if (value2 < 0 || value2 > 1) { return false; }
    if (value3 < 0 || value3 > 360) { return false; }
    if (value4 !== null && (value4 < 0 || value4 > 1)) { return false; }
  }
  else if (format === "okhsl") {
    regex = /h:\s*(\d+)\s*,\s*s:\s*(\d+)\s*,\s*l:\s*(\d+)\s*/;
    match = color.match(regex);

    if (!match) { return false; }

    value1 = parseInt(match[1]);
    value2 = parseInt(match[2]);
    value3 = parseInt(match[3]);

    if (value1 < 0 || value1 > 360) { return false; }
    if (value2 < 0 || value2 > 100) { return false; }
    if (value3 < 0 || value3 > 100) { return false; }
  }
  else if (format === "okhsv") {
    regex = /h:\s*(\d+)\s*,\s*s:\s*(\d+)\s*,\s*v:\s*(\d+)\s*/;
    match = color.match(regex);

    if (!match) { return false; }

    value1 = parseInt(match[1]);
    value2 = parseInt(match[2]);
    value3 = parseInt(match[3]);

    if (value1 < 0 || value1 > 360) { return false; }
    if (value2 < 0 || value2 > 100) { return false; }
    if (value3 < 0 || value3 > 100) { return false; }
  }
  else if (format === "color") {
    if (currentColorModel === "okhsl" || currentColorModel === "okhsv") {
      regex = /color\(srgb\s(\d+(\.\d+)?)\s(\d+(\.\d+)?)\s(\d+(\.\d+)?)(\s\/\s(\d+(\.\d+)?))?\)/;
    }
    else {
      regex = /color\(display-p3\s(\d+(\.\d+)?)\s(\d+(\.\d+)?)\s(\d+(\.\d+)?)(\s\/\s(\d+(\.\d+)?))?\)/;
    }
    
    match = color.match(regex);

    if (!match) { return false; }

    value1 = parseFloat(match[1]);
    value2 = parseFloat(match[3]);
    value3 = parseFloat(match[5]);
    value4 = match[8] ? parseFloat(match[8]) : null;

    if (value1 < 0 || value1 > 1) { return false; }
    if (value2 < 0 || value2 > 1) { return false; }
    if (value3 < 0 || value3 > 1) { return false; }
    if (value4 !== null && (value4 < 0 || value4 > 1)) { return false; }
  }
  else if (format === "rgba") {
    regex = /rgba\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(,\s*(\d+(\.\d+)?))?\s*\)/;
    match = color.match(regex);
    
    if (!match) {
      regex = /rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)/;
      match = color.match(regex);
      if (!match) { return false; }
    }

    value1 = parseInt(match[1]);
    value2 = parseInt(match[2]);
    value3 = parseInt(match[3]);
    value4 = match[5] ? parseFloat(match[5]) : null;

    if (value1 < 0 || value1 > 255) { return false; }
    if (value2 < 0 || value2 > 255) { return false; }
    if (value3 < 0 || value3 > 255) { return false; }
    if (value4 !== null && (value4 < 0 || value4 > 1)) { return false; }
  }

  return true;
};