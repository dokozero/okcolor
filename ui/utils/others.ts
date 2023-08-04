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