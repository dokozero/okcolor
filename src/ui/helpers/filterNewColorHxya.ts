import { ColorHxya } from '../../types'
import { $contrast, $currentColorModel, $lockContrast, $lockRelativeChroma } from '../store'
import convertContrastToLightness from './convertContrastToLightness'
import convertRelativeChromaToAbsolute from './convertRelativeChromaToAbsolute'
import getClampedChroma from './getClampedChroma'

/**
 * This function is to filter the hxy values because when we are in oklch, we can receive values that are out of gamut or we might need to constrain them relative chroma or contrast are locked.
 */
export default function filterNewColorHxya(
  newColorHxya: ColorHxya,
  bypassLockRelativeChromaFilter: boolean,
  bypassLockContrastFilter: boolean
): ColorHxya {
  if (['okhsv', 'okhsl'].includes($currentColorModel.get()!)) return newColorHxya

  const filteredColorHxya = newColorHxya

  if ($lockRelativeChroma.get() && !bypassLockRelativeChromaFilter) {
    filteredColorHxya.x = convertRelativeChromaToAbsolute({
      colorHxya: filteredColorHxya
    })
  } else {
    // If lockRelativeChroma is true, we don't need to clamp the chroma because it always be inside, hence the below code in the else.
    filteredColorHxya.x = getClampedChroma({ h: newColorHxya.h!, x: newColorHxya.x, y: newColorHxya.y })
  }

  if ($lockContrast.get() && $contrast.get() !== 0 && !bypassLockContrastFilter) {
    const newHxy = convertContrastToLightness(
      {
        h: newColorHxya.h!,
        x: newColorHxya.x,
        y: newColorHxya.y,
        a: newColorHxya.a
      },
      $contrast.get()!
    )
    newColorHxya.y = newHxy.y
  }

  return filteredColorHxya
}
