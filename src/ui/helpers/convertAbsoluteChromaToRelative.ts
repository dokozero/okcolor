import { MAX_CHROMA_P3 } from '../../constants'
import { ColorHxy } from '../../types'
import { $fileColorProfile } from '../store'
import { clampChromaInGamut } from './culori.mjs'
import { clampNumber } from './others'

/**
 * @returns {number} between 0 and 100
 */
export default function convertAbsoluteChromaToRelative(colorHxy: ColorHxy): number {
  // We do this test because with a lightness of 0, we get an undefined value for currentMaxChroma.c
  if (colorHxy.y === 0) return 0

  // 0 - MAX_CHROMA_P3
  const currentMaxChroma: number = clampChromaInGamut(
    { mode: 'oklch', l: colorHxy.y / 100, c: MAX_CHROMA_P3, h: colorHxy.h },
    'oklch',
    $fileColorProfile.get()
  ).c

  // Some times we can get 101%, like with #FFFF00, so we use clampNumber().
  return clampNumber(Math.round((colorHxy.x * 100) / currentMaxChroma), 0, 100)
}
