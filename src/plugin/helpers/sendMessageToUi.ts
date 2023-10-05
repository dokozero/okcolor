import { DisplayUiMessageData, InitData, NewColorsRgbaData } from '../../types'

type typeList = 'init' | 'newColorsRgba' | 'displayUiMessage'

export default function sendMessageToUi(props: { messageType: typeList; messageData: InitData | NewColorsRgbaData | DisplayUiMessageData }) {
  const { messageType, messageData } = props

  switch (messageType) {
    case 'init':
      figma.ui.postMessage({ message: messageType, initData: messageData })
      break
    case 'newColorsRgba':
      figma.ui.postMessage({ message: messageType, newColorsRgbaData: messageData })
      break
    case 'displayUiMessage':
      figma.ui.postMessage({ message: messageType, displayUiMessageData: messageData })
      break
  }
}
