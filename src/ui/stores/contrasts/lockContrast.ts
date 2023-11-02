import { action, atom } from 'nanostores'
import { logger } from '@nanostores/logger'
import { consoleLogInfos } from '../../../constants'
import { SyncLockContrastData } from '../../../types'
import sendMessageToBackend from '../../helpers/sendMessageToBackend'

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
})

if (consoleLogInfos.includes('Store updates')) {
  logger({
    lockContrast: $lockContrast
  })
}
