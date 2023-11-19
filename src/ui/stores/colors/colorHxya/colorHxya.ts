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

type SetColorHxyaProps = {
  newColorHxya: Partial<ColorHxya>
  lockRelativeChroma?: boolean
  lockContrast?: boolean
}

export const setColorHxya = action($colorHxya, 'setColorHxya', (colorHxya, props: SetColorHxyaProps) => {
  const { newColorHxya, lockRelativeChroma = $lockRelativeChroma.get(), lockContrast = $lockContrast.get() } = props

  colorHxya.set(
    filterNewColorHxya({
      newColorHxya: newColorHxya,
      lockRelativeChroma: lockRelativeChroma,
      lockContrast: lockContrast
    })
  )
})

export type SideEffects = {
  colorsRgba: Partial<{
    syncColorsRgba: boolean
    syncContrast: boolean
  }>
  syncRelativeChroma: boolean
}

type SetColorHxyaWithSideEffectsProps = {
  newColorHxya: Partial<ColorHxya>
  sideEffects?: Partial<SideEffects>
  lockRelativeChroma?: boolean
  lockContrast?: boolean
}

export const defaultSideEffects: SideEffects = {
  colorsRgba: {
    syncColorsRgba: true,
    syncContrast: true
  },
  syncRelativeChroma: true
}

export const setColorHxyaWithSideEffects = action($colorHxya, 'setColorHxyaWithSideEffects', (colorHxya, props: SetColorHxyaWithSideEffectsProps) => {
  const { newColorHxya, sideEffects: partialSideEffects, lockRelativeChroma = $lockRelativeChroma.get(), lockContrast = $lockContrast.get() } = props

  const sideEffects = JSON.parse(JSON.stringify(defaultSideEffects))
  merge(sideEffects, partialSideEffects)

  const filteredNewColorHxya = filterNewColorHxya({
    newColorHxya: newColorHxya,
    lockRelativeChroma: lockRelativeChroma,
    lockContrast: lockContrast
  })

  colorHxya.set(filteredNewColorHxya)

  const newColorRgb = convertHxyToRgb({ colorHxy: filteredNewColorHxya })

  if (sideEffects.colorsRgba.syncColorsRgba) {
    const key = $currentBgOrFg.get() === 'bg' ? 'parentFill' : `${$currentFillOrStroke.get()}`

    setColorsRgbaWithSideEffects({
      newColorsRgba: { ...$colorsRgba.get(), [key]: { ...newColorRgb, a: filteredNewColorHxya.a } },
      sideEffects: {
        colorHxya: {
          syncColorHxya: false
        },
        syncContrast: sideEffects.colorsRgba.syncContrast
      },
      lockContrast: lockContrast
    })
  }

  if (sideEffects.syncRelativeChroma) {
    if (['okhsv', 'okhsl'].includes($currentColorModel.get())) return

    // We don't want to get a new relative chroma value if the lock is on, but we also check if relativeChroma value is not undefined, if that the case we first need to set it.
    // And if lightness is 0 or 100, there is no need to continue either.
    if (lockRelativeChroma || newColorHxya.y === 0 || newColorHxya.y === 100) return

    setRelativeChroma(
      convertAbsoluteChromaToRelative({
        colorHxy: filteredNewColorHxya
      })
    )
  }
})

if (consoleLogInfos.includes('Store updates')) {
  logger({
    colorHxya: $colorHxya
  })
}
