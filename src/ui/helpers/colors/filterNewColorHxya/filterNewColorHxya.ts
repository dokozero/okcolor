import { ColorHxya } from '../../../../types'
import { $colorHxya } from '../../../stores/colors/colorHxya/colorHxya'
import { $currentColorModel } from '../../../stores/colors/currentColorModel/currentColorModel'
import { $lockRelativeChroma } from '../../../stores/colors/lockRelativeChroma/lockRelativeChroma'
import { $contrast } from '../../../stores/contrasts/contrast/contrast'
import { $lockContrast } from '../../../stores/contrasts/lockContrast/lockContrast'
import getNewXandYFromContrast from '../../contrasts/getNewXandYFromContrast/getNewXandYFromContrast'
import convertRelativeChromaToAbsolute from '../convertRelativeChromaToAbsolute/convertRelativeChromaToAbsolute'
import getClampedChroma from '../getClampedChroma/getClampedChroma'

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
      h: filteredColorHxya.h,
      y: filteredColorHxya.y
    })
  } else {
    // If lockRelativeChroma is true, we don't need to clamp the chroma because it always be inside, hence the below code in the else.
    filteredColorHxya.x = getClampedChroma({ h: filteredColorHxya.h, x: filteredColorHxya.x, y: filteredColorHxya.y })
  }

  if (!$lockContrast.get() || bypassLockContrastFilter) return filteredColorHxya

  const newXy = getNewXandYFromContrast({
    h: filteredColorHxya.h,
    x: filteredColorHxya.x,
    targetContrast: $contrast.get()
  })

  filteredColorHxya.y = newXy.y

  return filteredColorHxya
}
