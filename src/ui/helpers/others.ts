export const clampNumber = (num: number, min: number, max: number): number => {
  if (num < min) return min
  else if (num > max) return max
  else return num
}

// To avoid getting the manipulators going off, for example the canvas of ColorPicker.
export const limitMouseManipulatorPosition = (value: number): number => {
  const minThreshold = 0.0001
  const maxThreshold = 1 - minThreshold

  if (value < minThreshold) return minThreshold
  else if (value > maxThreshold) return maxThreshold
  else return value
}

export const selectInputContent = (event: React.MouseEvent<HTMLInputElement>) => {
  const eventTarget = event.target as HTMLInputElement

  eventTarget.select()

  // This is a fix as in some cases, if the user update the value of an input then click again inside it, in some cases the above select will not work. To counter this, we use this setTimeout callback.
  setTimeout(() => {
    eventTarget.select()
  }, 10)
}

export const roundWithDecimal = (value: number, numberOfDecimal = 1): number => {
  const roundFormulaValue = Math.pow(10, numberOfDecimal)
  return Math.round(value * roundFormulaValue) / roundFormulaValue
}
