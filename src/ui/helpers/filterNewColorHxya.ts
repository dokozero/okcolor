import { ColorHxya } from '../../types'
import { $colorHxya } from '../stores/colors/colorHxya'
import { $currentColorModel } from '../stores/colors/currentColorModel'
import { $lockRelativeChroma } from '../stores/colors/lockRelativeChroma'
import { $contrast } from '../stores/contrasts/contrast'
import { $lockContrast } from '../stores/contrasts/lockContrast'
import convertContrastToLightness from './convertContrastToLightness'
import convertRelativeChromaToAbsolute from './convertRelativeChromaToAbsolute'
import getClampedChroma from './getClampedChroma'

/**
 * This function is to filter the hxy values because when we are in oklch, we can receive values that are out of gamut or we might need to constrain them relative chroma or contrast are locked.
 */
export default function filterNewColorHxya(
  newColorHxya: Partial<ColorHxya>,
  bypassLockRelativeChromaFilter: boolean,
  bypassLockContrastFilter: boolean
): ColorHxya {
  const filteredColorHxya: ColorHxya = {
    h: newColorHxya.h !== undefined ? newColorHxya.h : $colorHxya.get().h,
    x: newColorHxya.x !== undefined ? newColorHxya.x : $colorHxya.get().x,
    y: newColorHxya.y !== undefined ? newColorHxya.y : $colorHxya.get().y,
    a: newColorHxya.a !== undefined ? newColorHxya.a : $colorHxya.get().a
  }

  if (['okhsv', 'okhsl'].includes($currentColorModel.get())) return filteredColorHxya

  if ($lockRelativeChroma.get() && !bypassLockRelativeChromaFilter) {
    filteredColorHxya.x = convertRelativeChromaToAbsolute({
      colorHxya: filteredColorHxya
    })
  } else {
    // If lockRelativeChroma is true, we don't need to clamp the chroma because it always be inside, hence the below code in the else.
    filteredColorHxya.x = getClampedChroma({ h: filteredColorHxya.h, x: filteredColorHxya.x, y: filteredColorHxya.y })
  }

  if (!$lockContrast.get() || $contrast.get() === 0 || bypassLockContrastFilter) return filteredColorHxya
  // if ($lockContrastStartY.get() === null || $lockContrastEndY.get() === null) return filteredColorHxya
  // if (newColorHxya.x === undefined && newColorHxya.y === undefined && newColorHxya.a === undefined) return filteredColorHxya

  const newHxy = convertContrastToLightness(
    {
      h: filteredColorHxya.h,
      x: filteredColorHxya.x,
      y: filteredColorHxya.y,
      a: filteredColorHxya.a
    },
    $contrast.get()!
  )
  filteredColorHxya.y = newHxy.y

  // const clampedChroma = getClampedChroma({
  //   h: filteredColorHxya.h,
  //   x: 0.37,
  //   y: $lockContrastEndY.get()!
  // })

  // filteredColorHxya.y = findYOnLockedChromaLine(filteredColorHxya.x, [0, $lockContrastStartY.get()!], [clampedChroma, $lockContrastEndY.get()!])

  return filteredColorHxya
}
