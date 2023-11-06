import { action, atom } from 'nanostores'
import { logger } from '@nanostores/logger'
import { consoleLogInfos } from '../../../constants'
import { CurrentFillOrStroke, SyncCurrentFillOrStrokeData } from '../../../types'
import convertRgbToHxy from '../../helpers/colors/convertRgbToHxy/convertRgbToHxy'
import sendMessageToBackend from '../../helpers/sendMessageToBackend/sendMessageToBackend'
import { setColorHxya } from '../colors/colorHxya/colorHxya'
import { $colorsRgba } from '../colors/colorsRgba/colorsRgba'
import { $lockContrast, setLockContrast } from '../contrasts/lockContrast/lockContrast'

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
      const newColorHxy = convertRgbToHxy({ colorRgb: newColorRgba })

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
