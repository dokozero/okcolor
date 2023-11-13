import { action, atom } from 'nanostores'
import { logger } from '@nanostores/logger'
import { consoleLogInfos } from '../../../../constants'
import { SyncLockRelativeChromaData } from '../../../../types'
import sendMessageToBackend from '../../../helpers/sendMessageToBackend/sendMessageToBackend'
import merge from 'lodash/merge'

export const $lockRelativeChroma = atom(false)

export const setLockRelativeChroma = action($lockRelativeChroma, 'setLockRelativeChroma', (lockRelativeChroma, newLockRelativeChroma: boolean) => {
  lockRelativeChroma.set(newLockRelativeChroma)
})

type SideEffects = {
  syncLockRelativeChromaWithBackend: boolean
}

type Props = {
  newLockRelativeChroma: boolean
  sideEffects?: Partial<SideEffects>
}

const defaultSideEffects: SideEffects = {
  syncLockRelativeChromaWithBackend: true
}

export const setLockRelativeChromaWithSideEffects = action(
  $lockRelativeChroma,
  'setLockRelativeChromaWithSideEffects',
  (lockRelativeChroma, props: Props) => {
    const { newLockRelativeChroma, sideEffects: partialSideEffects } = props

    const sideEffects = JSON.parse(JSON.stringify(defaultSideEffects))
    merge(sideEffects, partialSideEffects)

    lockRelativeChroma.set(newLockRelativeChroma)

    if (sideEffects.syncLockRelativeChromaWithBackend) {
      sendMessageToBackend<SyncLockRelativeChromaData>({
        type: 'syncLockRelativeChroma',
        data: {
          newLockRelativeChroma: newLockRelativeChroma
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
