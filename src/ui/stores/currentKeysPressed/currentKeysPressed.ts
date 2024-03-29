import { action, atom } from 'nanostores'
import { logger } from '@nanostores/logger'
import { consoleLogInfos } from '../../../constants'
import { CurrentKeysPressed } from '../../../types'

export const $currentKeysPressed = atom<CurrentKeysPressed>([''])

export const setCurrentKeysPressed = action(
  $currentKeysPressed,
  'setCurrentKeysPressed',
  (currentKeysPressed, newCurrentKeysPressed: CurrentKeysPressed) => {
    currentKeysPressed.set(newCurrentKeysPressed)
  }
)

if (consoleLogInfos.includes('Store updates')) {
  logger({
    currentKeysPressed: $currentKeysPressed
  })
}
