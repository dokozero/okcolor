import { action, atom } from 'nanostores'
import { logger } from '@nanostores/logger'
import { ColorRgb, ColorRgba, CurrentBgOrFg, Opacity } from '../../../types'
import { consoleLogInfos } from '../../../constants'
import convertAbsoluteChromaToRelative from '../../helpers/colors/convertAbsoluteChromaToRelative'
import convertRgbToHxy from '../../helpers/colors/convertRgbToHxy'
import { setColorHxyaWithSideEffects, $colorHxya } from '../colors/colorHxya'
import { $colorsRgba } from '../colors/colorsRgba'
import { $currentColorModel } from '../colors/currentColorModel'
import { $fileColorProfile } from '../colors/fileColorProfile'
import { $lockRelativeChroma } from '../colors/lockRelativeChroma'
import { setRelativeChroma } from '../colors/relativeChroma'

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
    let opacity: Opacity = 100

    if ($currentBgOrFg.get() === 'bg') {
      newColorRgba = $colorsRgba.get().parentFill!
    } else {
      newColorRgba = $colorsRgba.get().fill!
      opacity = $colorsRgba.get().fill!.a
    }

    const newColorHxy = convertRgbToHxy({
      colorRgb: {
        r: newColorRgba.r,
        g: newColorRgba.g,
        b: newColorRgba.b
      },
      targetColorModel: $currentColorModel.get(),
      colorSpace: $fileColorProfile.get()
    })

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
      setRelativeChroma(convertAbsoluteChromaToRelative({ h: $colorHxya.get().h, x: $colorHxya.get().x, y: $colorHxya.get().y }))
    }
  }
})

if (consoleLogInfos.includes('Store updates')) {
  logger({
    currentBgOrFg: $currentBgOrFg
  })
}
