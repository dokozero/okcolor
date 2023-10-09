import { ColorHxy } from '../../types'
import { $currentColorModel, $fileColorProfile } from '../store'
import { clampChromaInGamut } from './culori.mjs'
import { roundWithDecimal } from './others'

/**
 * @returns {number} between 0 and MAX_CHROMA_P3 * 100 for oklch or 0 and MAX_CHROMA_P3 for oklchCss.
 */
export default function getClampedChroma(props: ColorHxy): number {
  const { h, x, y } = props

  const chroma = $currentColorModel.get() === 'oklch' ? x / 100 : x

  const clamped = clampChromaInGamut({ mode: 'oklch', l: y / 100, c: chroma, h: h }, 'oklch', $fileColorProfile.get())

  // If we send a pure black to clampChromaInGamut (l and c to 0), clamped.c will be undefined.
  if (!clamped.c) {
    return 0
  }

  if (chroma > clamped.c) {
    if ($currentColorModel.get() === 'oklch') {
      return roundWithDecimal(clamped.c * 100, 1)
    } else {
      return roundWithDecimal(clamped.c, 3)
    }
  }

  return x
}
