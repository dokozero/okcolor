import { action, atom } from 'nanostores'
import { logger } from '@nanostores/logger'
import { consoleLogInfos } from '../../../constants'
import { CurrentFillOrStroke, SyncCurrentFillOrStrokeData } from '../../../types'
import convertRgbToHxy from '../../helpers/colors/convertRgbToHxy/convertRgbToHxy'
import sendMessageToBackend from '../../helpers/sendMessageToBackend/sendMessageToBackend'
import { setColorHxya } from '../colors/colorHxya/colorHxya'
import { $colorsRgba } from '../colors/colorsRgba/colorsRgba'
import { $lockContrast, setLockContrast } from '../contrasts/lockContrast/lockContrast'
import merge from 'lodash/merge'

export const $currentFillOrStroke = atom<CurrentFillOrStroke>('fill')

export const setCurrentFillOrStroke = action(
  $currentFillOrStroke,
  'setCurrentFillOrStroke',
  (currentFillOrStroke, newCurrentFillOrStroke: CurrentFillOrStroke) => {
    currentFillOrStroke.set(newCurrentFillOrStroke)
  }
)

type SideEffects = {
  syncColorHxya: boolean
  syncCurrentFillOrStrokeWithBackend: boolean
}

type Props = {
  newCurrentFillOrStroke: CurrentFillOrStroke
  sideEffects?: Partial<SideEffects>
}

const defaultSideEffects: SideEffects = {
  syncColorHxya: true,
  syncCurrentFillOrStrokeWithBackend: true
}

export const setCurrentFillOrStrokeWithSideEffects = action(
  $currentFillOrStroke,
  'setCurrentFillOrStrokeWithSideEffects',
  (currentFillOrStroke, props: Props) => {
    const { newCurrentFillOrStroke, sideEffects: partialSideEffects } = props

    const sideEffects = JSON.parse(JSON.stringify(defaultSideEffects))
    merge(sideEffects, partialSideEffects)

    currentFillOrStroke.set(newCurrentFillOrStroke)

    if (newCurrentFillOrStroke === 'stroke' && $lockContrast.get()) setLockContrast(false)

    if (sideEffects.syncColorHxya) {
      const newColorRgba = $colorsRgba.get()[newCurrentFillOrStroke]
      const newColorHxy = convertRgbToHxy({ colorRgb: newColorRgba! })

      setColorHxya({
        newColorHxya: { ...newColorHxy, a: newColorRgba!.a },
        lockRelativeChroma: false,
        lockContrast: false
      })
    }

    if (sideEffects.syncCurrentFillOrStrokeWithBackend) {
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
