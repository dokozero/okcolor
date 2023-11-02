import { AbsoluteChroma, Lightness } from '../../types'
import roundWithDecimal from './numbers/roundWithDecimal'

// TODO - delete
export default function findYOnLockedChromaLine(
  targetX: AbsoluteChroma,
  pointA: [Lightness, AbsoluteChroma],
  pointB: [Lightness, AbsoluteChroma]
): Lightness {
  // calculate the slope
  const slope = (pointB[1] - pointA[1]) / (pointB[0] - pointA[0])

  // calculate the y-intercept
  const yIntercep = pointA[1]

  // calculate y
  const y = slope * targetX + yIntercep

  return roundWithDecimal(y, 1)
}
