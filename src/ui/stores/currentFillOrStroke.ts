import { action, atom } from 'nanostores'
import { logger } from '@nanostores/logger'
import { CurrentFillOrStroke, SyncCurrentFillOrStrokeData } from '../../types'
import { consoleLogInfos } from '../../constants'
import convertRgbToHxy from '../helpers/colors/convertRgbToHxy'
import sendMessageToBackend from '../helpers/sendMessageToBackend'
import { setColorHxya } from './colors/colorHxya'
import { $colorsRgba } from './colors/colorsRgba'
import { $currentColorModel } from './colors/currentColorModel'
import { $fileColorProfile } from './colors/fileColorProfile'
import { $lockContrast, setLockContrast } from './contrasts/lockContrast'

export const $currentFillOrStroke = atom<CurrentFillOrStroke>('fill')

export const setCurrentFillOrStroke = action(
  $currentFillOrStroke,
  'setCurrentFillOrStroke',
  (currentFillOrStroke, newCurrentFillOrStroke: CurrentFillOrStroke) => {
    currentFillOrStroke.set(newCurrentFillOrStroke)
  }
)

type Props = {
  newCurrentFillOrStroke: CurrentFillOrStroke
  syncColorHxya?: boolean
  syncCurrentFillOrStrokeWithBackend?: boolean
}

/**
 * Side effects (true by default): syncColorHxya, syncCurrentFillOrStrokeWithBackend.
 */
export const setCurrentFillOrStrokeWithSideEffects = action(
  $currentFillOrStroke,
  'setCurrentFillOrStrokeWithSideEffects',
  (currentFillOrStroke, props: Props) => {
    const { newCurrentFillOrStroke, syncColorHxya = true, syncCurrentFillOrStrokeWithBackend = true } = props

    currentFillOrStroke.set(newCurrentFillOrStroke)

    if (newCurrentFillOrStroke === 'stroke' && $lockContrast.get()) setLockContrast(false)

    const newColorRgba = $colorsRgba.get()[newCurrentFillOrStroke]

    if (!newColorRgba) return

    if (syncColorHxya) {
      const newColorHxy = convertRgbToHxy({
        colorRgb: {
          r: newColorRgba.r,
          g: newColorRgba.g,
          b: newColorRgba.b
        },
        targetColorModel: $currentColorModel.get(),
        fileColorProfile: $fileColorProfile.get()
      })

      setColorHxya({ ...newColorHxy, a: newColorRgba.a })
    }

    if (syncCurrentFillOrStrokeWithBackend) {
      sendMessageToBackend<SyncCurrentFillOrStrokeData>({
        type: 'syncCurrentFillOrStroke',
        data: {
          currentFillOrStroke: newCurrentFillOrStroke
        }
      })
    }
  }
)

if (consoleLogInfos.includes('Store updates')) {
  logger({
    currentFillOrStroke: $currentFillOrStroke
  })
}
