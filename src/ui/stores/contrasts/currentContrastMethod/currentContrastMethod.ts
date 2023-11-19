import { action, atom } from 'nanostores'
import { logger } from '@nanostores/logger'
import { consoleLogInfos } from '../../../../constants'
import { CurrentContrastMethod, SyncCurrentContrastMethodData } from '../../../../types'
import sendMessageToBackend from '../../../helpers/sendMessageToBackend/sendMessageToBackend'
import merge from 'lodash/merge'

export const $currentContrastMethod = atom<CurrentContrastMethod>('apca')

export const setCurrentContrastMethod = action(
  $currentContrastMethod,
  'setCurrentContrastMethod',
  (currentContrastMethod, newCurrentContrastMethod: CurrentContrastMethod) => {
    currentContrastMethod.set(newCurrentContrastMethod)
  }
)

type SideEffects = {
  syncCurrentContrastMethodWithBackend: boolean
}

type Props = {
  newCurrentContrastMethod: CurrentContrastMethod
  sideEffects?: Partial<SideEffects>
}

const defaultSideEffects: SideEffects = {
  syncCurrentContrastMethodWithBackend: true
}

export const setCurrentContrastMethodWithSideEffects = action(
  $currentContrastMethod,
  'setCurrentContrastMethodWithSideEffects',
  (currentContrastMethod, props: Props) => {
    const { newCurrentContrastMethod, sideEffects: partialSideEffects } = props

    const sideEffects = JSON.parse(JSON.stringify(defaultSideEffects))
    merge(sideEffects, partialSideEffects)

    currentContrastMethod.set(newCurrentContrastMethod)

    if (sideEffects.syncCurrentContrastMethodWithBackend) {
      sendMessageToBackend<SyncCurrentContrastMethodData>({
        type: 'syncCurrentContrastMethod',
        data: {
          newCurrentContrastMethod: newCurrentContrastMethod
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
