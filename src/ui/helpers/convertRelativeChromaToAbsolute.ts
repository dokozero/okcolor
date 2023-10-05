import { ColorHxy } from '../../types'
import { $colorValueDecimals, $currentColorModel, $fileColorProfile, $relativeChroma } from '../store'
import { clampChromaInGamut } from './culori.mjs'
import { roundWithDecimal } from './others'

interface Props {
  colorHxy: ColorHxy
  relativeChroma?: number
}

/**
 * @returns {number} between 0 and 37 for oklch or 0 and 0.37 for oklchCss
 */
export default function convertRelativeChromaToAbsolute(props: Props): number {
  const { colorHxy, relativeChroma = $relativeChroma.get()! } = props

  // We do this test because with a lightness of 0, we get an undefined value for currentMaxChroma.c
  if (colorHxy.y === 0) return 0

  const currentMaxChroma = clampChromaInGamut({ mode: 'oklch', l: colorHxy.y / 100, c: 0.37, h: colorHxy.h }, 'oklch', $fileColorProfile.get()).c
  let returnValue = relativeChroma * currentMaxChroma
  if ($currentColorModel.get() === 'oklchCss') returnValue /= 100

  return roundWithDecimal(returnValue, $colorValueDecimals.get()!.x)
}
