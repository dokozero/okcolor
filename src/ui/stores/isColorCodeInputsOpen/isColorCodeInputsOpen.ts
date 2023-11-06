import { action, atom } from 'nanostores'
import { logger } from '@nanostores/logger'
import { consoleLogInfos } from '../../../constants'
import { SyncIsColorCodeInputsOpenData } from '../../../types'
import sendMessageToBackend from '../../helpers/sendMessageToBackend/sendMessageToBackend'

export const $isColorCodeInputsOpen = atom(false)

export const setIsColorCodeInputsOpen = action(
  $isColorCodeInputsOpen,
  'setIsColorCodeInputsOpen',
  (isColorCodeInputsOpen, newIsColorCodeInputsOpen: boolean) => {
    isColorCodeInputsOpen.set(newIsColorCodeInputsOpen)
  }
)

type Props = {
  newIsColorCodeInputsOpen: boolean
  syncIsColorCodeInputsOpenWithBackend?: boolean
}

/**
 * Side effects (default to true): syncIsColorCodeInputsOpenWithBackend
 */
export const setIsColorCodeInputsOpenWithSideEffects = action(
  $isColorCodeInputsOpen,
  'setIsColorCodeInputsOpenWithSideEffects',
  (isColorCodeInputsOpen, props: Props) => {
    const { newIsColorCodeInputsOpen, syncIsColorCodeInputsOpenWithBackend = true } = props

    isColorCodeInputsOpen.set(newIsColorCodeInputsOpen)

    if (syncIsColorCodeInputsOpenWithBackend) {
      sendMessageToBackend<SyncIsColorCodeInputsOpenData>({
        type: 'syncIsColorCodeInputsOpen',
        data: {
          isColorCodeInputsOpen: newIsColorCodeInputsOpen
        }
      })
    }
  }
)

if (consoleLogInfos.includes('Store updates')) {
  logger({
    isColorCodeInputsOpen: $isColorCodeInputsOpen
  })
}
