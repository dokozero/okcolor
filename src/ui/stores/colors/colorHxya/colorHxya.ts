// We use default values in the atoms but they are not used, because we get these values from backend.
// They are useful however to not use null in their type (although some of them have it when we have to).
// More infos in the comment on top in App component.

import { map, action } from 'nanostores'
import { logger } from '@nanostores/logger'
import { consoleLogInfos } from '../../../../constants'
import { ColorHxya } from '../../../../types'
import convertAbsoluteChromaToRelative from '../../../helpers/colors/convertAbsoluteChromaToRelative/convertAbsoluteChromaToRelative'
import convertHxyToRgb from '../../../helpers/colors/convertHxyToRgb/convertHxyToRgb'
import filterNewColorHxya from '../../../helpers/colors/filterNewColorHxya/filterNewColorHxya'
import { $currentBgOrFg } from '../../contrasts/currentBgOrFg/currentBgOrFg'
import { $currentFillOrStroke } from '../../currentFillOrStroke/currentFillOrStroke'
import { setColorsRgbaWithSideEffects, $colorsRgba } from '../colorsRgba/colorsRgba'
import { $currentColorModel } from '../currentColorModel/currentColorModel'
import { $lockRelativeChroma } from '../lockRelativeChroma/lockRelativeChroma'
import { setRelativeChroma } from '../relativeChroma/relativeChroma'
import { $lockContrast } from '../../contrasts/lockContrast/lockContrast'
import merge from 'lodash/merge'

// This map contain the current color being used in the UI, it can be the fill or the stroke of the foreground but also the background (colorsRgba.parentFill) of the current selected object.
export const $colorHxya = map<ColorHxya>({
  h: 0,
  x: 0,
  y: 0,
  a: 0
})

export const setColorHxya = action($colorHxya, 'setColorHxya', (colorHxya, newColorHxya: Partial<ColorHxya>) => {
  const { h, x, y, a } = filterNewColorHxya({
    newColorHxya: newColorHxya,
    lockRelativeChroma: false,
    lockContrast: false
  })

  colorHxya.set({
    h: h !== undefined ? h : colorHxya.get().h,
    x: x !== undefined ? x : colorHxya.get().x,
    y: y !== undefined ? y : colorHxya.get().y,
    a: a !== undefined ? a : colorHxya.get().a
  })
})

export type SideEffects = {
  lockRelativeChroma: boolean
  lockContrast: boolean
  colorsRgba: Partial<{
    syncColorsRgba: boolean
    syncContrast: boolean
  }>
  syncRelativeChroma: boolean
}

type Props = {
  newColorHxya: Partial<ColorHxya>
  sideEffects?: Partial<SideEffects>
}

export const defaultSideEffects: SideEffects = {
  lockRelativeChroma: $lockRelativeChroma.get(),
  lockContrast: $lockContrast.get(),
  colorsRgba: {
    syncColorsRgba: true,
    syncContrast: true
  },
  syncRelativeChroma: true
}

export const setColorHxyaWithSideEffects = action($colorHxya, 'setColorHxyaWithSideEffects', (colorHxya, props: Props) => {
  const { newColorHxya, sideEffects: partialSideEffects } = props

  const sideEffects = JSON.parse(JSON.stringify(defaultSideEffects))
  merge(sideEffects, partialSideEffects)

  const filteredNewColorHxya = filterNewColorHxya({
    newColorHxya: newColorHxya,
    lockRelativeChroma: sideEffects.lockRelativeChroma,
    lockContrast: sideEffects.lockContrast
  })

  colorHxya.set(filteredNewColorHxya)

  const newColorRgb = convertHxyToRgb({ colorHxy: filteredNewColorHxya })

  if (sideEffects.colorsRgba.syncColorsRgba) {
    const key = $currentBgOrFg.get() === 'bg' ? 'parentFill' : `${$currentFillOrStroke.get()}`

    setColorsRgbaWithSideEffects({
      newColorsRgba: { ...$colorsRgba.get(), [key]: { ...newColorRgb, a: colorHxya.get().a } },
      sideEffects: {
        colorHxya: {
          syncColorHxya: false
        },
        syncContrast: sideEffects.colorsRgba.syncContrast,
        lockContrast: sideEffects.lockContrast
      }
    })
  }

  if (sideEffects.syncRelativeChroma) {
    if (['okhsv', 'okhsl'].includes($currentColorModel.get())) return

    // We don't want to get a new relative chroma value if the lock is on, but we also check if relativeChroma value is not undefined, if that the case we first need to set it.
    // And if lightness is 0 or 100, there is no need to continue either.
    if (sideEffects.lockRelativeChroma || newColorHxya.y === 0 || newColorHxya.y === 100) return

    setRelativeChroma(
      convertAbsoluteChromaToRelative({
        colorHxy: colorHxya.get()
      })
    )
  }
})

if (consoleLogInfos.includes('Store updates')) {
  logger({
    colorHxya: $colorHxya
  })
}
