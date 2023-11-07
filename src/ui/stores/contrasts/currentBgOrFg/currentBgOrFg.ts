import { action, atom } from 'nanostores'
import { logger } from '@nanostores/logger'
import { consoleLogInfos } from '../../../../constants'
import { CurrentBgOrFg, ColorRgb, ColorRgba, Opacity } from '../../../../types'
import convertRgbToHxy from '../../../helpers/colors/convertRgbToHxy/convertRgbToHxy'
import { setColorHxyaWithSideEffects } from '../../colors/colorHxya/colorHxya'
import { $colorsRgba } from '../../colors/colorsRgba/colorsRgba'

export const $currentBgOrFg = atom<CurrentBgOrFg>('fg')

export const setCurrentBgOrFg = action($currentBgOrFg, 'setCurrentBgOrFg', (currentBgOrFg, newCurrentBgOrFg: CurrentBgOrFg) => {
  currentBgOrFg.set(newCurrentBgOrFg)
})

type Props = {
  newCurrentBgOrFg: CurrentBgOrFg
  syncColorHxya?: boolean
}

/**
 * Side effects (default to true): syncColorHxya, syncRelativeChroma.
 */
export const setCurrentBgOrFgWithSideEffects = action($currentBgOrFg, 'setCurrentBgOrFgWithSideEffects', (currentBgOrFg, props: Props) => {
  const { newCurrentBgOrFg, syncColorHxya = true } = props

  currentBgOrFg.set(newCurrentBgOrFg)

  if (syncColorHxya) {
    let newColorRgba: ColorRgb | ColorRgba
    let opacity: Opacity = 1

    if ($currentBgOrFg.get() === 'bg') {
      newColorRgba = $colorsRgba.get().parentFill!
    } else {
      newColorRgba = $colorsRgba.get().fill!
      opacity = $colorsRgba.get().fill!.a
    }

    const newColorHxy = convertRgbToHxy({ colorRgb: newColorRgba })

    setColorHxyaWithSideEffects({
      newColorHxya: { ...newColorHxy, a: opacity },
      sideEffects: {
        colorsRgba: {
          syncColorsRgba: false
        }
      },
      lockRelativeChroma: false,
      lockContrast: false
    })
  }
})

if (consoleLogInfos.includes('Store updates')) {
  logger({
    currentBgOrFg: $currentBgOrFg
  })
}
