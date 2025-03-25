import { action, atom } from 'nanostores'
import { OklchRenderMode } from '../../../types'

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
