import { ColorHxy } from '../../types'
import { $fileColorProfile, $currentColorModel } from '../store'
import { clampChromaInGamut } from './culori.mjs'
import { clampNumber } from './others'

/*
return 0 - 100
*/
export default function convertAbsoluteChromaToRelative(colorHxy: ColorHxy): number {
  // We do this test because with a lightness of 0, we get an undefined value for currentMaxChroma.c
  if (colorHxy.y === 0) return 0

  // 0 - 0.37
  const currentMaxChroma: number = clampChromaInGamut(
    { mode: 'oklch', l: colorHxy.y / 100, c: 0.37, h: colorHxy.h },
    'oklch',
    $fileColorProfile.get()
  ).c

  // 0 - 0.37
  const actualChromaFormated = $currentColorModel.get() === 'oklchCss' ? colorHxy.x : colorHxy.x / 100

  // Some times we can get 101%, like with #FFFF00, so we use clampNumber().
  return clampNumber(Math.round((actualChromaFormated * 100) / currentMaxChroma), 0, 100)
}
