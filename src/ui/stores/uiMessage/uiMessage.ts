import { action, map } from 'nanostores'
import { logger } from '@nanostores/logger'
import { consoleLogInfos } from '../../../constants'
import { UiMessage } from '../../../types'
import setValuesForUiMessage from '../../helpers/setValuesForUiMessage/setValuesForUiMessage'
import { uiMessageTexts } from '../../ui-messages'
import merge from 'lodash/merge'

export const $uiMessage = map<UiMessage>({
  show: false,
  message: ''
})

export const setUiMessage = action($uiMessage, 'setUiMessage', (uiMessage, newUiMessage: UiMessage) => {
  uiMessage.set(newUiMessage)
})

type SideEffects = {
  syncBodyElement: boolean
  useValuesForUiMessageFunction: boolean
}

type Props = {
  messageCode: keyof typeof uiMessageTexts
  nodeType: string | null
  sideEffects?: Partial<SideEffects>
}

const defaultSideEffects: SideEffects = {
  syncBodyElement: true,
  useValuesForUiMessageFunction: true
}

export const showUiMessageWithSideEffects = action($uiMessage, 'showUiMessageWithSideEffects', (uiMessage, props: Props) => {
  const { messageCode, nodeType, sideEffects: partialSideEffects } = props

  const sideEffects = JSON.parse(JSON.stringify(defaultSideEffects))
  merge(sideEffects, partialSideEffects)

  let message = uiMessageTexts[`${messageCode}`]
  if (nodeType) {
    message = message.replace('$SHAPE', nodeType.toLowerCase())
  }

  uiMessage.set({ show: true, message: message })

  if (sideEffects.syncBodyElement) {
    document.body.classList.add('deactivated')
  }

  if (sideEffects.useValuesForUiMessageFunction) setValuesForUiMessage()
})

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
