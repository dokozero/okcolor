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
    lockRelativeChroma: boolean
  }>
  syncContrast: boolean
  lockContrast: boolean
}

type Props = {
  newColorsRgba: ColorsRgba
  keepOklchDoubleDigit?: boolean
  sideEffects?: Partial<SideEffects>
}

const defaultSideEffects: SideEffects = {
  syncColorRgbWithBackend: true,
  colorHxya: {
    syncColorHxya: true,
    syncRelativeChroma: true,
    lockRelativeChroma: $lockRelativeChroma.get()
  },
  syncContrast: true,
  lockContrast: $lockContrast.get()
}

export const setColorsRgbaWithSideEffects = action($colorsRgba, 'setColorsRgbaWithSideEffects', (colorsRgba, props: Props) => {
  const { newColorsRgba, keepOklchDoubleDigit = false, sideEffects: partialSideEffects } = props

  const sideEffects = JSON.parse(JSON.stringify(defaultSideEffects))
  merge(sideEffects, partialSideEffects)

  colorsRgba.set(newColorsRgba)

  if (sideEffects.syncColorRgbWithBackend) {
    sendMessageToBackend<UpdateShapeColorData>({
      type: 'updateShapeColor',
      data: {
        newColorRgba: $currentBgOrFg.get() === 'bg' ? { ...newColorsRgba.parentFill!, a: $colorHxya.get().a } : newColorsRgba.fill!,
        currentBgOrFg: $currentBgOrFg.get()
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
        syncRelativeChroma: sideEffects.colorHxya.syncRelativeChroma,
        lockRelativeChroma: sideEffects.colorHxya.lockRelativeChroma,
        lockContrast: sideEffects.lockContrast
      }
    })
  }

  if (sideEffects.syncContrast) {
    if (['okhsv', 'okhsl'].includes($currentColorModel.get())) return
    if (sideEffects.lockContrast || !newColorsRgba.parentFill || !newColorsRgba.fill) return

    const newContrast: ApcaContrast | WcagContrast = getContrastFromBgandFgRgba(newColorsRgba.fill!, newColorsRgba.parentFill!)
    setContrast(newContrast)
  }
})

if (consoleLogInfos.includes('Store updates')) {
  logger({
    colorsRgba: $colorsRgba
  })
}
