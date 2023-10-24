import { ColorHxy } from '../../types'
import { $fileColorProfile } from '../store'
import { clampChromaInGamut } from './culori.mjs'
import { roundWithDecimal } from './others'

/**
 * @returns {number} between 0 and MAX_CHROMA_P3.
 */
export default function getClampedChroma(props: ColorHxy): number {
  const { h, x, y } = props

  const clamped = clampChromaInGamut({ mode: 'oklch', l: y / 100, c: x, h: h }, 'oklch', $fileColorProfile.get())

  // If we send a pure black to clampChromaInGamut (l and c to 0), clamped.c will be undefined.
  if (!clamped.c) return 0

  if (x > clamped.c) return roundWithDecimal(clamped.c, 3)

  return x
}
