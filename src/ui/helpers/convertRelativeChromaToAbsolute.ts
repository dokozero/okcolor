import { MAX_CHROMA_P3 } from '../../constants'
import { ColorHxy } from '../../types'
import { $colorValueDecimals, $currentColorModel, $fileColorProfile, $relativeChroma } from '../store'
import { clampChromaInGamut } from './culori.mjs'
import { roundWithDecimal } from './others'

interface Props {
  colorHxy: ColorHxy
  relativeChroma?: number
}

/**
 * @returns {number} between 0 and MAX_CHROMA_P3 * 100 for oklch or 0 and MAX_CHROMA_P3 for oklchCss.
 */
export default function convertRelativeChromaToAbsolute(props: Props): number {
  const { colorHxy, relativeChroma = $relativeChroma.get()! } = props

  // We do this test because with a lightness of 0, we get an undefined value for currentMaxChroma.c.
  if (colorHxy.y === 0) return 0

  const currentMaxChroma = clampChromaInGamut(
    { mode: 'oklch', l: colorHxy.y / 100, c: MAX_CHROMA_P3, h: colorHxy.h },
    'oklch',
    $fileColorProfile.get()
  ).c
  let returnValue = relativeChroma * currentMaxChroma
  if ($currentColorModel.get() === 'oklchCss') returnValue /= 100

  return roundWithDecimal(returnValue, $colorValueDecimals.get()!.x)
}
