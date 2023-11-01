import { action, atom } from 'nanostores'
import { logger } from '@nanostores/logger'
import { CurrentKeysPressed } from '../../types'
import { consoleLogInfos } from '../../constants'

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
