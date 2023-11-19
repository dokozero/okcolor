import { MessageForUiData, MessageForUiTypes } from '../../../types'

// We use this simple fonction to get type completion.
export default function sendMessageToUi<T extends MessageForUiData>(props: { type: MessageForUiTypes; data: T }) {
  figma.ui.postMessage({ type: props.type, data: props.data })
}
