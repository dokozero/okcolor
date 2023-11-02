import { action, atom } from 'nanostores'
import { logger } from '@nanostores/logger'
import { consoleLogInfos } from '../../../constants'
import { SyncLockRelativeChromaData } from '../../../types'
import sendMessageToBackend from '../../helpers/sendMessageToBackend'

export const $lockRelativeChroma = atom(false)

export const setLockRelativeChroma = action($lockRelativeChroma, 'setLockRelativeChroma', (lockRelativeChroma, newLockRelativeChroma: boolean) => {
  lockRelativeChroma.set(newLockRelativeChroma)
})

type Props = {
  newLockRelativeChroma: boolean
  syncLockRelativeChromaWithBackend?: boolean
}

/**
 * Side effects (true by default): syncLockRelativeChromaWithBackend.
 */
export const setLockRelativeChromaWithSideEffects = action(
  $lockRelativeChroma,
  'setLockRelativeChromaWithSideEffects',
  (lockRelativeChroma, props: Props) => {
    const { newLockRelativeChroma, syncLockRelativeChromaWithBackend = true } = props
    lockRelativeChroma.set(newLockRelativeChroma)

    if (syncLockRelativeChromaWithBackend) {
      sendMessageToBackend<SyncLockRelativeChromaData>({
        type: 'syncLockRelativeChroma',
        data: {
          lockRelativeChroma: newLockRelativeChroma
        }
      })
    }
  }
)

if (consoleLogInfos.includes('Store updates')) {
  logger({
    lockRelativeChroma: $lockRelativeChroma
  })
}
