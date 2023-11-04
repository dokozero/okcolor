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

  // if lockConstrat is true, we need to adjust x and Y value as for example we can multiple Y values for the same contrast, without this, when setting lockContrast to true, we can have the manipulator on the color picker slightly of the lock line.
  if (newLockContrast) {
    const newXy = getNewXandYFromContrast({
      currentH: $colorHxya.get().h,
      currentX: $colorHxya.get().x,
      targetContrast: $contrast.get(),
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
