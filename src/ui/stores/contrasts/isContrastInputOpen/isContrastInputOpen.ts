import { action, atom } from 'nanostores'
import { logger } from '@nanostores/logger'
import { consoleLogInfos } from '../../../../constants'
import { SyncIsContrastInputOpenData } from '../../../../types'
import sendMessageToBackend from '../../../helpers/sendMessageToBackend/sendMessageToBackend'
import merge from 'lodash/merge'

export const $isContrastInputOpen = atom(false)

export const setIsContrastInputOpen = action(
  $isContrastInputOpen,
  'setIsContrastInputOpen',
  (isContrastInputOpen, newIsContrastInputOpen: boolean) => {
    isContrastInputOpen.set(newIsContrastInputOpen)
  }
)

type SideEffects = {
  syncIsContrastInputOpenWithBackend: boolean
}

type Props = {
  newIsContrastInputOpen: boolean
  sideEffects?: Partial<SideEffects>
}

const defaultSideEffects: SideEffects = {
  syncIsContrastInputOpenWithBackend: true
}

export const setIsContrastInputOpenWithSideEffects = action(
  $isContrastInputOpen,
  'setIsContrastInputOpenWithSideEffects',
  (isContrastInputOpen, props: Props) => {
    const { newIsContrastInputOpen, sideEffects: partialSideEffects } = props

    const sideEffects = JSON.parse(JSON.stringify(defaultSideEffects))
    merge(sideEffects, partialSideEffects)

    isContrastInputOpen.set(newIsContrastInputOpen)

    if (sideEffects.syncIsContrastInputOpenWithBackend) {
      sendMessageToBackend<SyncIsContrastInputOpenData>({
        type: 'syncIsContrastInputOpen',
        data: {
          newIsContrastInputOpen: newIsContrastInputOpen
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
