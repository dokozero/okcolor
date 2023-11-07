import { action, atom } from 'nanostores'
import { logger } from '@nanostores/logger'
import { consoleLogInfos } from '../../../../constants'
import { SyncLockContrastData } from '../../../../types'
import getNewXandYFromContrast from '../../../helpers/contrasts/getNewXandYFromContrast/getNewXandYFromContrast'
import sendMessageToBackend from '../../../helpers/sendMessageToBackend/sendMessageToBackend'
import { $colorHxya, setColorHxyaWithSideEffects } from '../../colors/colorHxya/colorHxya'
import { $lockRelativeChroma } from '../../colors/lockRelativeChroma/lockRelativeChroma'
import { $contrast } from '../contrast/contrast'

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
      h: $colorHxya.get().h,
      x: $colorHxya.get().x,
      targetContrast: $contrast.get(),
      lockRelativeChroma: $lockRelativeChroma.get()
    })

    setColorHxyaWithSideEffects({
      newColorHxya: newXy,
      sideEffects: {
        colorsRgba: {
          syncContrast: false
        }
      }
    })
  }
})

if (consoleLogInfos.includes('Store updates')) {
  logger({
    lockContrast: $lockContrast
  })
}
