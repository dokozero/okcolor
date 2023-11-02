import { action, map } from 'nanostores'
import { logger } from '@nanostores/logger'
import { consoleLogInfos } from '../../constants'

// TODO - add type
export const $uiMessage = map({
  show: false,
  message: ''
})

// TODO - add setUiMessageWithSideEffects
export const setUiMessage = action($uiMessage, 'setUiMessage', (uiMessage, newUiMessage) => {
  uiMessage.set(newUiMessage)
})

if (consoleLogInfos.includes('Store updates')) {
  logger({
    uiMessage: $uiMessage
  })
}
