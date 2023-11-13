import { deepMap, action } from 'nanostores'
import { logger } from '@nanostores/logger'
import { consoleLogInfos } from '../../../../constants'
import { ColorsRgba, ApcaContrast, WcagContrast, UpdateShapeColorData } from '../../../../types'
import convertRgbToHxy from '../../../helpers/colors/convertRgbToHxy/convertRgbToHxy'
import getContrastFromBgandFgRgba from '../../../helpers/contrasts/getContrastFromBgandFgRgba/getContrastFromBgandFgRgba'
import { setContrast } from '../../contrasts/contrast/contrast'
import { $lockContrast } from '../../contrasts/lockContrast/lockContrast'
import { $currentFillOrStroke } from '../../currentFillOrStroke/currentFillOrStroke'
import { $colorHxya, setColorHxyaWithSideEffects } from '../colorHxya/colorHxya'
import { $currentColorModel } from '../currentColorModel/currentColorModel'
import { $lockRelativeChroma } from '../lockRelativeChroma/lockRelativeChroma'
import sendMessageToBackend from '../../../helpers/sendMessageToBackend/sendMessageToBackend'
import { $currentBgOrFg } from '../../contrasts/currentBgOrFg/currentBgOrFg'
import merge from 'lodash/merge'

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

type SideEffects = {
  syncColorRgbWithBackend: boolean
  colorHxya: Partial<{
    syncColorHxya: boolean
    syncRelativeChroma: boolean
  }>
  syncContrast: boolean
}

type Props = {
  newColorsRgba: ColorsRgba
  keepOklchDoubleDigit?: boolean
  sideEffects?: Partial<SideEffects>
  lockRelativeChroma?: boolean
  lockContrast?: boolean
}

const defaultSideEffects: SideEffects = {
  syncColorRgbWithBackend: true,
  colorHxya: {
    syncColorHxya: true,
    syncRelativeChroma: true
  },
  syncContrast: true
}

export const setColorsRgbaWithSideEffects = action($colorsRgba, 'setColorsRgbaWithSideEffects', (colorsRgba, props: Props) => {
  const {
    newColorsRgba,
    keepOklchDoubleDigit = false,
    sideEffects: partialSideEffects,
    lockRelativeChroma = $lockRelativeChroma.get(),
    lockContrast = $lockContrast.get()
  } = props

  const sideEffects = JSON.parse(JSON.stringify(defaultSideEffects))
  merge(sideEffects, partialSideEffects)

  colorsRgba.set(newColorsRgba)

  if (sideEffects.syncColorRgbWithBackend) {
    sendMessageToBackend<UpdateShapeColorData>({
      type: 'updateShapeColor',
      data: {
        newColorRgba:
          $currentBgOrFg.get() === 'bg' ? { ...newColorsRgba.parentFill!, a: $colorHxya.get().a } : newColorsRgba[`${$currentFillOrStroke.get()}`]!,
        newCurrentBgOrFg: $currentBgOrFg.get()
      }
    })
  }

  const newColorRgbaCurrentFillOrStroke = newColorsRgba[`${$currentFillOrStroke.get()}`]

  if (sideEffects.colorHxya.syncColorHxya) {
    const newColorHxy = convertRgbToHxy({
      colorRgb: newColorRgbaCurrentFillOrStroke!,
      keepOklchDoubleDigit: keepOklchDoubleDigit
    })

    setColorHxyaWithSideEffects({
      newColorHxya: { ...newColorHxy, a: newColorRgbaCurrentFillOrStroke!.a },
      sideEffects: {
        colorsRgba: {
          syncColorsRgba: false
        },
        syncRelativeChroma: sideEffects.colorHxya.syncRelativeChroma
      },
      lockRelativeChroma: lockRelativeChroma,
      lockContrast: lockContrast
    })
  }

  if (sideEffects.syncContrast) {
    if (['okhsv', 'okhsl'].includes($currentColorModel.get())) return
    if (lockContrast || !newColorsRgba.parentFill || !newColorsRgba.fill) return

    const newContrast: ApcaContrast | WcagContrast = getContrastFromBgandFgRgba({
      fg: newColorsRgba.fill!,
      bg: newColorsRgba.parentFill!
    })
    setContrast(newContrast)
  }
})

if (consoleLogInfos.includes('Store updates')) {
  logger({
    colorsRgba: $colorsRgba
  })
}
