import { action, atom } from 'nanostores'
import { OklchRenderMode, SyncOklchRenderModeData } from '../../../types'
import merge from 'lodash/merge'
import sendMessageToBackend from '../../helpers/sendMessageToBackend/sendMessageToBackend'

export const $oklchRenderMode = atom<OklchRenderMode>('square')
export const $isTransitionRunning = atom(false)

export const setOklchRenderMode = action($oklchRenderMode, 'setOklchRenderMode', (oklchRenderMode, newOklchRenderMode: OklchRenderMode) => {
  oklchRenderMode.set(newOklchRenderMode)
})

export const setIsTransitionRunning = action(
  $isTransitionRunning,
  'setIsTransitionRunning',
  (IsTransitionRunning, newIsTransitionRunning: boolean) => {
    IsTransitionRunning.set(newIsTransitionRunning)
  }
)

type SideEffects = {
  syncOklchRenderModeWithBackend: boolean
}

type Props = {
  newOklchRenderMode: OklchRenderMode
  sideEffects?: Partial<SideEffects>
}

const defaultSideEffects: SideEffects = {
  syncOklchRenderModeWithBackend: true
}

export const setOklchRenderModeWithSideEffects = action($oklchRenderMode, 'setOklchRenderModeWithSideEffects', (oklchRenderMode, props: Props) => {
  const { newOklchRenderMode, sideEffects: partialSideEffects } = props

  const sideEffects = JSON.parse(JSON.stringify(defaultSideEffects))
  merge(sideEffects, partialSideEffects)

  oklchRenderMode.set(newOklchRenderMode)

  if (sideEffects.syncOklchRenderModeWithBackend) {
    sendMessageToBackend<SyncOklchRenderModeData>({
      type: 'syncOklchRenderMode',
      data: {
        newOklchRenderMode: newOklchRenderMode
      }
    })
  }
})
