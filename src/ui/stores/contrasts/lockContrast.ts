import { action, atom } from 'nanostores'
import { logger } from '@nanostores/logger'
import { consoleLogInfos } from '../../../constants'
import { SyncLockContrastData } from '../../../types'
import sendMessageToBackend from '../../helpers/sendMessageToBackend'
import { $contrast } from './contrast'
import getNewXandYFromContrast from '../../helpers/contrasts/getNewXandYFromContrast'
import { $colorHxya, setColorHxyaWithSideEffects } from '../colors/colorHxya'
import { $lockRelativeChroma } from '../colors/lockRelativeChroma'

export const $lockContrast = atom(false)

export const setLockContrast = action($lockContrast, 'setLockContrast', (lockContrast, newLockContrast: boolean) => {
  lockContrast.set(newLockContrast)
})

type Props = {
  newLockContrast: boolean
  syncLockContrastWithBackend?: boolean
}

/**
 * Side effects (true by default): syncLockContrastWithBackend.
 */
export const setLockContrastWithSideEffects = action($lockContrast, 'setLockContrastWithSideEffects', (lockContrast, props: Props) => {
  const { newLockContrast, syncLockContrastWithBackend = true } = props
  lockContrast.set(newLockContrast)

  if (syncLockContrastWithBackend) {
    sendMessageToBackend<SyncLockContrastData>({
      type: 'syncLockContrast',
      data: {
        lockContrast: newLockContrast
      }
    })
  }

  // if lockConstrat is true, and the contrast is equal to 0 (in APCA it can be 0 but not -1 or 1) or -1 or 1 in WCAG, we run this code to adjust the Y (and X). That's because, for example in APCA, we frequently have multiple Y values for a contrast of 0, so without this correction, when setting lockChroma to true, the manipulator in the color picker could be out of the lockContrast line.
  if (newLockContrast && $contrast.get() >= -1 && $contrast.get() <= 1) {
    const newXy = getNewXandYFromContrast({
      currentH: $colorHxya.get().h,
      currentX: $colorHxya.get().x,
      targetContrast: 0,
      lockRelativeChroma: $lockRelativeChroma.get()
    })

    setColorHxyaWithSideEffects({
      newColorHxya: newXy,
      syncContrast: false
    })
  }
})

if (consoleLogInfos.includes('Store updates')) {
  logger({
    lockContrast: $lockContrast
  })
}
