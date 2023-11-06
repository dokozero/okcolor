import { action, map } from 'nanostores'
import { logger } from '@nanostores/logger'
import { consoleLogInfos } from '../../../constants'
import { UiMessage } from '../../../types'
import setValuesForUiMessage from '../../helpers/setValuesForUiMessage/setValuesForUiMessage'
import { uiMessageTexts } from '../../ui-messages'

export const $uiMessage = map<UiMessage>({
  show: false,
  message: ''
})

export const setUiMessage = action($uiMessage, 'setUiMessage', (uiMessage, newUiMessage: UiMessage) => {
  uiMessage.set(newUiMessage)
})

type Props = {
  messageCode: keyof typeof uiMessageTexts
  nodeType: string | null
  syncBodyElement?: boolean
  useValuesForUiMessageFunction?: boolean
}

/**
 * Side effects (default to true): syncBodyElement, useValuesForUiMessageFunction.
 */
export const showUiMessageWithSideEffects = action($uiMessage, 'showUiMessageWithSideEffects', (uiMessage, props: Props) => {
  const { messageCode, nodeType, syncBodyElement = true, useValuesForUiMessageFunction = true } = props

  let message = uiMessageTexts[`${messageCode}`]
  if (nodeType) {
    message = message.replace('$SHAPE', nodeType.toLowerCase())
  }

  uiMessage.set({ show: true, message: message })

  if (syncBodyElement) {
    document.body.classList.add('deactivated')
  }

  if (useValuesForUiMessageFunction) setValuesForUiMessage()
})

/**
 * Side effects (default to true): syncBodyElement.
 */
export const hideUiMessageWithSideEffects = action($uiMessage, 'hideUiMessageWithSideEffects', (uiMessage, syncBodyElement = true) => {
  uiMessage.set({ show: false, message: '' })

  if (syncBodyElement) {
    document.body.classList.remove('deactivated')
  }
})

if (consoleLogInfos.includes('Store updates')) {
  logger({
    uiMessage: $uiMessage
  })
}
