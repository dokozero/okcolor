import { deepMap, action } from 'nanostores'
import { logger } from '@nanostores/logger'
import { consoleLogInfos } from '../../../../constants'
import { ColorsRgba, ApcaContrast, WcagContrast } from '../../../../types'
import convertRgbToHxy from '../../../helpers/colors/convertRgbToHxy/convertRgbToHxy'
import getContrastFromBgandFgRgba from '../../../helpers/contrasts/getContrastFromBgandFgRgba/getContrastFromBgandFgRgba'
import { setContrast } from '../../contrasts/contrast/contrast'
import { $lockContrast } from '../../contrasts/lockContrast/lockContrast'
import { $currentFillOrStroke } from '../../currentFillOrStroke/currentFillOrStroke'
import { setColorHxyaWithSideEffects } from '../colorHxya/colorHxya'
import { $currentColorModel } from '../currentColorModel/currentColorModel'
import { $fileColorProfile } from '../fileColorProfile/fileColorProfile'

export const $colorsRgba = deepMap<ColorsRgba>({
  parentFill: null,
  fill: {
    r: 0,
    g: 0,
    b: 0,
    a: 0
  },
  stroke: null
})

export const setColorsRgba = action($colorsRgba, 'setColorsRgba', (colorsRgba, newColorsRgba: ColorsRgba) => {
  colorsRgba.set(newColorsRgba)
})

// TODO - add parent object "syncColorHxyaOptions" for bypassLockContrastFilter. Same with others store actions.
type Props = {
  newColorsRgba: ColorsRgba
  syncColorHxya?: boolean
  syncContrast?: boolean
  keepOklchDoubleDigit?: boolean
  bypassLockContrastFilter?: boolean
  bypassLockRelativeChromaFilter?: boolean
}

/**
 * Side effects (true by default): syncColorHxya, syncContrast.
 */
export const setColorsRgbaWithSideEffects = action($colorsRgba, 'setColorsRgbaWithSideEffects', (colorsRgba, props: Props) => {
  const {
    newColorsRgba,
    syncColorHxya = true,
    syncContrast = true,
    keepOklchDoubleDigit = false,
    bypassLockContrastFilter = false,
    bypassLockRelativeChromaFilter = false
  } = props

  colorsRgba.set(newColorsRgba)

  const newColorRgba = newColorsRgba[`${$currentFillOrStroke.get()}`]

  const newColorHxy = convertRgbToHxy({
    colorRgb: {
      r: newColorRgba!.r,
      g: newColorRgba!.g,
      b: newColorRgba!.b
    },
    targetColorModel: $currentColorModel.get(),
    colorSpace: $fileColorProfile.get(),
    keepOklchDoubleDigit: keepOklchDoubleDigit
  })

  if (syncColorHxya) {
    setColorHxyaWithSideEffects({
      newColorHxya: {
        h: newColorHxy.h,
        x: newColorHxy.x,
        y: newColorHxy.y,
        a: newColorRgba!.a
      },
      syncColorsRgba: false,
      syncColorRgbWithBackend: false,
      bypassLockContrastFilter: bypassLockContrastFilter,
      bypassLockRelativeChromaFilter: bypassLockRelativeChromaFilter
    })
  }

  if (syncContrast) {
    if (['okhsv', 'okhsl'].includes($currentColorModel.get())) return
    if (!newColorsRgba.parentFill || !newColorsRgba.fill || $lockContrast.get()) return

    const newContrast: ApcaContrast | WcagContrast = getContrastFromBgandFgRgba(newColorsRgba.fill!, newColorsRgba.parentFill!)
    setContrast(newContrast)
  }
})

if (consoleLogInfos.includes('Store updates')) {
  logger({
    colorsRgba: $colorsRgba
  })
}
