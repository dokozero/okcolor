import { ApcaContrast, ColorHxya, WcagContrast } from '../../../../types'
import { $colorHxya } from '../../../stores/colors/colorHxya/colorHxya'
import { $currentColorModel } from '../../../stores/colors/currentColorModel/currentColorModel'
import { $contrast } from '../../../stores/contrasts/contrast/contrast'
import getNewXandYFromContrast from '../../contrasts/getNewXandYFromContrast/getNewXandYFromContrast'
import convertRelativeChromaToAbsolute from '../convertRelativeChromaToAbsolute/convertRelativeChromaToAbsolute'
import getClampedChroma from '../getClampedChroma/getClampedChroma'
import round from 'lodash/round'

type Props = {
  newColorHxya: Partial<ColorHxya>
  lockRelativeChroma: boolean
  lockContrast: boolean
  contrast?: ApcaContrast | WcagContrast
}

/**
 * This function is to filter the hxy values because when we are in oklch, we can receive values that are out of gamut or we might need to constrain them relative chroma or contrast are locked.
 */
export default function filterNewColorHxya(props: Props): ColorHxya {
  const { newColorHxya, lockRelativeChroma, lockContrast, contrast = $contrast.get() } = props

  const filteredColorHxya: ColorHxya = {
    h: newColorHxya.h !== undefined ? newColorHxya.h : $colorHxya.get().h,
    x: newColorHxya.x !== undefined ? newColorHxya.x : $colorHxya.get().x,
    y: newColorHxya.y !== undefined ? newColorHxya.y : $colorHxya.get().y,
    a: newColorHxya.a !== undefined ? newColorHxya.a : $colorHxya.get().a
  }

  filteredColorHxya.a = round(filteredColorHxya.a, 2)

  // In these two color models, we don't have realtive chroma or contrast activated.
  if (['okhsv', 'okhsl'].includes($currentColorModel.get())) return filteredColorHxya

  if (lockRelativeChroma) {
    filteredColorHxya.x = convertRelativeChromaToAbsolute({
      h: filteredColorHxya.h,
      y: filteredColorHxya.y
    })
  } else {
    // If lockRelativeChroma is true, we don't need to clamp the chroma because it always be inside, hence the below code in the else.
    filteredColorHxya.x = getClampedChroma(filteredColorHxya)
  }

  if (lockContrast) {
    const newXy = getNewXandYFromContrast({
      h: filteredColorHxya.h,
      x: filteredColorHxya.x,
      targetContrast: contrast
    })
    filteredColorHxya.y = newXy.y
  }

  return filteredColorHxya
}
