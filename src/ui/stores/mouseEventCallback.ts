import { action, atom } from 'nanostores'
import { logger } from '@nanostores/logger'
import { consoleLogInfos } from '../../constants'

export const $mouseEventCallback = atom<((event: MouseEvent) => void) | null>(null)

export const setMouseEventCallback = action(
  $mouseEventCallback,
  'setMouseEventCallback',
  (mouseEventCallback, newMouseEventCallback: ((event: MouseEvent) => void) | null) => {
    mouseEventCallback.set(newMouseEventCallback)
  }
)

if (consoleLogInfos.includes('Store updates')) {
  logger({
    mouseEventCallback: $mouseEventCallback
  })
}
