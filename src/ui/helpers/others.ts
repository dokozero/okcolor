import { AbsoluteChroma, Lightness } from '../../types'

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
  // Update, we deactivate it for now as updating multiple time the same input lead to error because the below select can happen while editing the input.
  // setTimeout(() => {
  //   eventTarget.select()
  // }, 10)
}

export const roundWithDecimal = (value: number, numberOfDecimal = 1): number => {
  const roundFormulaValue = Math.pow(10, numberOfDecimal)
  return Math.round(value * roundFormulaValue) / roundFormulaValue
}

export const findYOnLockedChromaLine = (
  targetX: AbsoluteChroma,
  pointA: [Lightness, AbsoluteChroma],
  pointB: [Lightness, AbsoluteChroma]
): Lightness => {
  // calculate the slope
  const slope = (pointB[1] - pointA[1]) / (pointB[0] - pointA[0])

  // calculate the y-intercept
  const yIntercep = pointA[1]

  // calculate y
  const y = slope * targetX + yIntercep

  return roundWithDecimal(y, 1)
}
