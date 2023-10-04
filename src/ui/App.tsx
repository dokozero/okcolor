import ReactDOM from 'react-dom/client'
import { useEffect } from 'react'

import {
  $fileColorProfile,
  $currentColorModel,
  $lockRelativeChroma,
  $showCssColorCodes,
  $currentKeysPressed,
  $isMouseInsideDocument,
  $uiMessage,
  updateColorsRgba,
  $currentFillOrStroke,
  $mouseEventCallback,
  $colorHxya,
  $figmaEditorType
} from './store'

import FileColorProfileSelect from './components/FileColorProfileSelect/FileColorProfileSelect'
import ColorPicker from './components/ColorPicker/ColorPicker'
import FillStrokeSelect from './components/FillStrokeSelect/FillStrokeSelect'
import HueSlider from './components/sliders/HueSlider/HueSlider'
import OpacitySlider from './components/sliders/OpacitySlider/OpacitySlider'
import ColorModelSelect from './components/ColorModelSelect/ColorModelSelect'
import ColorValueInputs from './components/ColorValueInputs/ColorValueInputs'
import RelativeChromaInput from './components/RelativeChromaInput/RelativeChromaInput'
import ColorCodeInputs from './components/ColorCodeInputs/ColorCodeInputs'

import { consoleLogInfos } from '../constants'

import { uiMessageTexts } from './ui-messages'
import { ColorsRgba, CurrentColorModel, CurrentFillOrStroke, FigmaEditorType, FileColorProfile } from '../types'

let isMouseDown = false

interface OnMessage {
  data: {
    pluginMessage: {
      message: string
      initData: {
        figmaEditorType: FigmaEditorType
        fileColorProfile: FileColorProfile
        currentColorModel: CurrentColorModel
        lockRelativeChroma: boolean
        showCssColorCodes: boolean
      }
      newColorsRgbaData: {
        currentFillOrStroke: CurrentFillOrStroke
        colorsRgba: ColorsRgba
      }
      displayUiMessageData: {
        uiMessageCode: keyof typeof uiMessageTexts
        nodeType: string
      }
    }
  }
}

function App() {
  if (consoleLogInfos.includes('Component renders')) {
    console.log('Component render — App')
  }

  // Updates from the plugins
  onmessage = (event: OnMessage) => {
    const pluginMessage = event.data.pluginMessage

    if (pluginMessage.message === 'init') {
      $figmaEditorType.set(pluginMessage.initData.figmaEditorType)
      $fileColorProfile.set(pluginMessage.initData.fileColorProfile)
      $currentColorModel.set(pluginMessage.initData.currentColorModel)
      $lockRelativeChroma.set(pluginMessage.initData.lockRelativeChroma)
      $showCssColorCodes.set(pluginMessage.initData.showCssColorCodes)
    }

    if (pluginMessage.message === 'newColorsRgba') {
      if (document.body.style.visibility === 'hidden') document.body.style.visibility = 'visible'
      if (document.body.classList.contains('deactivated')) document.body.classList.remove('deactivated')
      if ($uiMessage.get().show) $uiMessage.setKey('show', false)
      $currentFillOrStroke.set(pluginMessage.newColorsRgbaData.currentFillOrStroke)
      updateColorsRgba(pluginMessage.newColorsRgbaData.colorsRgba, true)
    }
    if (pluginMessage.message === 'displayUiMessage') {
      if (document.body.style.visibility === 'hidden') document.body.style.visibility = 'visible'
      $uiMessage.setKey('show', true)
      $colorHxya.set({ h: 0, x: 0, y: 0, a: 0 })
      document.body.classList.add('deactivated')

      let message = uiMessageTexts[`${pluginMessage.displayUiMessageData.uiMessageCode}`]
      if (pluginMessage.displayUiMessageData.nodeType) {
        message = message.replace('$SHAPE', pluginMessage.displayUiMessageData.nodeType.toLowerCase())
      }
      $uiMessage.setKey('message', message)
    }
  }

  useEffect(() => {
    document.addEventListener('mouseenter', () => {
      $isMouseInsideDocument.set(true)

      if (document.hasFocus() === false) {
        // We set the focus back to the plugin window if user clicked outside of it, like this he doesn't need to click inside in order to use the shift or control keys.
        window.focus()

        // We test if shiftKeyPressed is true and set it to false to prevent this case: if user launches the plugin, enter the mouse inside (thus making it focus), leave the plugin, move a shape with shift key pressed in Figma (event listerner on the plugin will then trigger and set shiftKeyPressed to true), then come back to the plugin, the shiftKeyPressed will still be true event if is not pressing it anymore because the keyup event will not be triggered as the focus was lost when user moved the sahep in Figma.
        // We could test if the mouse is inside on the keydown event but then we will not be able to use the shift key to change the inputs values (by steps of 5 for some of them, check inputHandler()).
        // Same for ctrlKeyPressed even if it is not used as much than shift in Figma.
        if ($currentKeysPressed.get()) $currentKeysPressed.set([''])
      }
    })

    // This is in case the use has multiple Figma files open with OkColor open in them as well. Without this if the plugin is focused, by pressing "ctrl + Tab", the plugin in the previous tab will get the “Ctrl” in $currentKeysPressed and when the use come back and move the handler in the color picker, the Ctrl modifier effect will be takien into account event if he's not pressing it.
    window.addEventListener('blur', () => {
      if ($currentKeysPressed.get()) $currentKeysPressed.set([''])
    })

    document.addEventListener('mouseleave', () => {
      $isMouseInsideDocument.set(false)
    })

    document.addEventListener('mousedown', (event) => {
      if ($mouseEventCallback.get()) $mouseEventCallback.get()!(event)
      isMouseDown = true
    })

    document.addEventListener('mousemove', (event) => {
      if (!isMouseDown) return

      if ($mouseEventCallback.get()) $mouseEventCallback.get()!(event)
    })

    document.addEventListener('mouseup', () => {
      isMouseDown = false
      $mouseEventCallback.set(null)
    })

    // We want to know if user has one of these two keys down because in mouseHandler() we constrain the color picker manipulator depending on them.
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Shift') {
        $currentKeysPressed.set([...$currentKeysPressed.get(), 'shift'])
      } else if (event.key === 'Control') {
        $currentKeysPressed.set([...$currentKeysPressed.get(), 'ctrl'])
      }
    })

    document.addEventListener('keyup', (event) => {
      // We do this test on 'ArrowDown' and 'ArrowUp' because if not, in the inputs like relative chroma's one, we wouldn't be able to keep shift pressed more than one time.
      if (!['ArrowUp', 'ArrowDown'].includes(event.key) && $currentKeysPressed.get()) {
        $currentKeysPressed.set([''])
      }
    })

    // We launch the init procedure from the plugin (send some values and the color shape if any is selected) when the UI is ready.
    parent.postMessage({ pluginMessage: { message: 'init' } }, '*')
  }, [])

  return (
    <>
      <FileColorProfileSelect />
      <ColorPicker />

      <div className="c-bottom-controls">
        <div className="u-flex u-items-center u-justify-between u-px-16 u-mt-18">
          <FillStrokeSelect />

          <div className="u-flex u-flex-col">
            <HueSlider />
            <OpacitySlider />
          </div>
        </div>

        <div className="c-select-input-controls">
          <ColorModelSelect />
          <ColorValueInputs />
        </div>

        <RelativeChromaInput />
        <ColorCodeInputs />
      </div>
    </>
  )
}

ReactDOM.createRoot(document.getElementById('root')!).render(<App />)
