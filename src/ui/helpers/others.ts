export const clampNumber = (num: number, min: number, max: number): number => {
  if (num < min) return min
  else if (num > max) return max
  else return num
}

// To avoid getting the handlers going off the canvas.
export const limitMouseManipulatorPosition = (value: number): number => {
  const minThreshold = 0.0001
  const maxThreshold = 1 - minThreshold

  if (value < minThreshold) return minThreshold
  else if (value > maxThreshold) return maxThreshold
  else return value
}

export const selectInputContent = (event: React.MouseEvent<HTMLInputElement>) => {
  ;(event.target as HTMLInputElement).select()
}

export const roundWithDecimal = (value: number, numberOfDecimal = 1): number => {
  const roundFormulaValue = Math.pow(10, numberOfDecimal)
  return Math.round(value * roundFormulaValue) / roundFormulaValue
}
