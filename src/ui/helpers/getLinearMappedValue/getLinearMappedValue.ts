type Props = {
  valueToMap: number
  originalRange: {
    min: number
    max: number
  }
  targetRange: {
    min: number
    max: number
  }
}

/**
 * Get valueToMap equivalent from originalRange in targetRange using linear interpolation.
 */
export default function getLinearMappedValue(props: Props): number {
  const { valueToMap, originalRange, targetRange } = props

  return ((valueToMap - originalRange.min) * (targetRange.max - targetRange.min)) / (originalRange.max - originalRange.min) + targetRange.min
}
