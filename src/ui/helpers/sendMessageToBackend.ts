import { MessageForBackendData, MessageForBackendTypes } from '../../types'

// We use this simple fonction to get type completion.
export default function sendMessageToBackend<T extends MessageForBackendData>(props: { type: MessageForBackendTypes; data?: T }) {
  parent.postMessage(
    {
      pluginMessage: {
        type: props.type,
        data: props.data
      }
    },
    '*'
  )
}
