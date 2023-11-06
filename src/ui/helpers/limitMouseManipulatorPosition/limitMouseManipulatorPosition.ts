// To avoid getting the manipulators going off, for example the canvas of ColorPicker.
export default function limitMouseManipulatorPosition(value: number): number {
  const minThreshold = 0.0001
  const maxThreshold = 1 - minThreshold

  if (value < minThreshold) return minThreshold
  else if (value > maxThreshold) return maxThreshold
  else return value
}
