import { debugMode } from "./constants";

export const clampNumber = function(num: number, min: number, max: number): number {
  if (debugMode) { console.log("UI: clampNumber()"); }

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

export const roundOneDecimal = function(value: number): number {
  if (debugMode) { console.log("UI: roundOneDecimal()"); }
  
  return Math.round(value * 10) / 10;
};