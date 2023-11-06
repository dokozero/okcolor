import { action, atom } from 'nanostores'
import { logger } from '@nanostores/logger'
import { consoleLogInfos } from '../../../../constants'
import { SyncIsContrastInputOpenData } from '../../../../types'
import sendMessageToBackend from '../../../helpers/sendMessageToBackend/sendMessageToBackend'

export const $isContrastInputOpen = atom(false)

export const setIsContrastInputOpen = action(
  $isContrastInputOpen,
  'setIsContrastInputOpen',
  (isContrastInputOpen, newIsContrastInputOpen: boolean) => {
    isContrastInputOpen.set(newIsContrastInputOpen)
  }
)

type Props = {
  newIsContrastInputOpen: boolean
  syncIsContrastInputOpenWithBackend?: boolean
}

/**
 * Side effects (default to true): syncIsContrastInputOpenWithBackend
 */
export const setIsContrastInputOpenWithSideEffects = action(
  $isContrastInputOpen,
  'setIsContrastInputOpenWithSideEffects',
  (isContrastInputOpen, props: Props) => {
    const { newIsContrastInputOpen, syncIsContrastInputOpenWithBackend = true } = props

    isContrastInputOpen.set(newIsContrastInputOpen)

    if (syncIsContrastInputOpenWithBackend) {
      sendMessageToBackend<SyncIsContrastInputOpenData>({
        type: 'syncIsContrastInputOpen',
        data: {
          isContrastInputOpen: newIsContrastInputOpen
        }
      })
    }
  }
)

if (consoleLogInfos.includes('Store updates')) {
  logger({
    isContrastInputOpen: $isContrastInputOpen
  })
}
