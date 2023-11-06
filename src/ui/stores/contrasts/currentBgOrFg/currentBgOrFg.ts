import { action, atom } from 'nanostores'
import { logger } from '@nanostores/logger'
import { consoleLogInfos } from '../../../../constants'
import { CurrentBgOrFg, ColorRgb, ColorRgba, Opacity } from '../../../../types'
import convertAbsoluteChromaToRelative from '../../../helpers/colors/convertAbsoluteChromaToRelative/convertAbsoluteChromaToRelative'
import convertRgbToHxy from '../../../helpers/colors/convertRgbToHxy/convertRgbToHxy'
import { setColorHxyaWithSideEffects, $colorHxya } from '../../colors/colorHxya/colorHxya'
import { $colorsRgba } from '../../colors/colorsRgba/colorsRgba'
import { $lockRelativeChroma } from '../../colors/lockRelativeChroma/lockRelativeChroma'
import { setRelativeChroma } from '../../colors/relativeChroma/relativeChroma'

export const $currentBgOrFg = atom<CurrentBgOrFg>('fg')

export const setCurrentBgOrFg = action($currentBgOrFg, 'setCurrentBgOrFg', (currentBgOrFg, newCurrentBgOrFg: CurrentBgOrFg) => {
  currentBgOrFg.set(newCurrentBgOrFg)
})

type Props = {
  newCurrentBgOrFg: CurrentBgOrFg
  syncColorHxya?: boolean
  syncRelativeChroma?: boolean
}

/**
 * Side effects (default to true): syncColorHxya, syncRelativeChroma.
 */
export const setCurrentBgOrFgWithSideEffects = action($currentBgOrFg, 'setCurrentBgOrFgWithSideEffects', (currentBgOrFg, props: Props) => {
  const { newCurrentBgOrFg, syncColorHxya = true, syncRelativeChroma = true } = props

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
      syncColorsRgba: false,
      syncColorRgbWithBackend: false,
      bypassLockRelativeChromaFilter: true,
      bypassLockContrastFilter: true
    })
  }

  if (syncRelativeChroma) {
    // If the relative chroma is locked, we need to update it as the Bg can have a different one.
    if ($lockRelativeChroma.get()) {
      setRelativeChroma(
        convertAbsoluteChromaToRelative({
          colorHxy: {
            h: $colorHxya.get().h,
            x: $colorHxya.get().x,
            y: $colorHxya.get().y
          }
        })
      )
    }
  }
})

if (consoleLogInfos.includes('Store updates')) {
  logger({
    currentBgOrFg: $currentBgOrFg
  })
}
