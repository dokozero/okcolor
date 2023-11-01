import { action, atom } from 'nanostores'
import { logger } from '@nanostores/logger'
import { CurrentContrastMethod, SyncCurrentContrastMethodData } from '../../../types'
import { consoleLogInfos } from '../../../constants'
import sendMessageToBackend from '../../helpers/sendMessageToBackend'

export const $currentContrastMethod = atom<CurrentContrastMethod>('apca')

export const setCurrentContrastMethod = action(
  $currentContrastMethod,
  'setCurrentContrastMethod',
  (currentContrastMethod, newCurrentContrastMethod: CurrentContrastMethod) => {
    currentContrastMethod.set(newCurrentContrastMethod)
  }
)

type Props = {
  newCurrentContrastMethod: CurrentContrastMethod
  syncCurrentContrastMethodWithBackend?: boolean
}

/**
 * Side effects (default to true): syncCurrentContrastMethodWithBackend
 */
export const setCurrentContrastMethodWithSideEffects = action(
  $currentContrastMethod,
  'setCurrentContrastMethodWithSideEffects',
  (currentContrastMethod, props: Props) => {
    const { newCurrentContrastMethod, syncCurrentContrastMethodWithBackend = true } = props
    currentContrastMethod.set(newCurrentContrastMethod)

    if (syncCurrentContrastMethodWithBackend) {
      sendMessageToBackend<SyncCurrentContrastMethodData>({
        type: 'syncCurrentContrastMethod',
        data: {
          currentContrastMethod: newCurrentContrastMethod
        }
      })
    }
  }
)

if (consoleLogInfos.includes('Store updates')) {
  logger({
    currentContrastMethod: $currentContrastMethod
  })
}
