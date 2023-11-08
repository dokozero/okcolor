import { action, atom } from 'nanostores'
import { logger } from '@nanostores/logger'
import { consoleLogInfos } from '../../../constants'
import { SyncIsColorCodeInputsOpenData } from '../../../types'
import sendMessageToBackend from '../../helpers/sendMessageToBackend/sendMessageToBackend'
import merge from 'lodash/merge'

export const $isColorCodeInputsOpen = atom(false)

export const setIsColorCodeInputsOpen = action(
  $isColorCodeInputsOpen,
  'setIsColorCodeInputsOpen',
  (isColorCodeInputsOpen, newIsColorCodeInputsOpen: boolean) => {
    isColorCodeInputsOpen.set(newIsColorCodeInputsOpen)
  }
)

type SideEffects = {
  syncIsColorCodeInputsOpenWithBackend: boolean
}

type Props = {
  newIsColorCodeInputsOpen: boolean
  sideEffects?: Partial<SideEffects>
}

const defaultSideEffects: SideEffects = {
  syncIsColorCodeInputsOpenWithBackend: true
}

export const setIsColorCodeInputsOpenWithSideEffects = action(
  $isColorCodeInputsOpen,
  'setIsColorCodeInputsOpenWithSideEffects',
  (isColorCodeInputsOpen, props: Props) => {
    const { newIsColorCodeInputsOpen, sideEffects: partialSideEffects } = props

    const sideEffects = JSON.parse(JSON.stringify(defaultSideEffects))
    merge(sideEffects, partialSideEffects)

    isColorCodeInputsOpen.set(newIsColorCodeInputsOpen)

    if (sideEffects.syncIsColorCodeInputsOpenWithBackend) {
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
