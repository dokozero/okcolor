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
  updateColorsRgbaAndSyncColorHxya,
  $currentFillOrStroke,
  $mouseEventCallback,
  $figmaEditorType,
  updateColorHxyaAndSyncColorsRgbaAndPlugin,
  $updateParent,
  $lockContrast
} from './store'

import FileColorProfileSelect from './components/FileColorProfileSelect/FileColorProfileSelect'
import ColorPicker from './components/ColorPicker/ColorPicker'
import FillStrokeSelect from './components/FillStrokeSelect/FillStrokeSelect'
import HueSlider from './components/sliders/HueSlider/HueSlider'
import OpacitySlider from './components/sliders/OpacitySlider/OpacitySlider'
import ColorModelSelect from './components/ColorModelSelect/ColorModelSelect'
import ColorValueInputs from './components/ColorValueInputs/ColorValueInputs'
import RelativeChromaInput from './components/single-input-with-lock/RelativeChromaInput/RelativeChromaInput'
import ContrastInput from './components/single-input-with-lock/ContrastInput/ContrastInput'
import ColorCodeInputs from './components/ColorCodeInputs/ColorCodeInputs'

import { consoleLogInfos } from '../constants'

import { uiMessageTexts } from './ui-messages'
import { OnMessageFromPlugin } from '../types'

let isMouseDown = false

function App() {
  if (consoleLogInfos.includes('Component renders')) {
    console.log('Component render — App')
  }

  // Updates from the plugin.
  onmessage = (event: OnMessageFromPlugin) => {
    const pluginMessage = event.data.pluginMessage

    // Set variables from local storage that only plugin code can get.
    if (pluginMessage.message === 'init') {
      $figmaEditorType.set(pluginMessage.initData.figmaEditorType)
      $fileColorProfile.set(pluginMessage.initData.fileColorProfile)
      $currentColorModel.set(pluginMessage.initData.currentColorModel)
      $lockRelativeChroma.set(pluginMessage.initData.lockRelativeChroma)
      $showCssColorCodes.set(pluginMessage.initData.showCssColorCodes)
    }
    // Update the color based on the selected shape in Figma.
    else if (pluginMessage.message === 'newColorsRgba') {
      if (document.body.style.visibility === 'hidden') document.body.style.visibility = 'visible'
      if (document.body.classList.contains('deactivated')) document.body.classList.remove('deactivated')
      if ($uiMessage.get().show) $uiMessage.setKey('show', false)

      // If on previous selected shape we had the parent selected, we set it to false as default.
      if ($updateParent.get()) $updateParent.set(false)

      $currentFillOrStroke.set(pluginMessage.newColorsRgbaData.currentFillOrStroke)
      updateColorsRgbaAndSyncColorHxya(pluginMessage.newColorsRgbaData.colorsRgba, true)
    }
    // Set the UI in a disabled mode and update the UI message.
    else if (pluginMessage.message === 'displayUiMessage') {
      if (document.body.style.visibility === 'hidden') document.body.style.visibility = 'visible'
      $uiMessage.setKey('show', true)
      updateColorHxyaAndSyncColorsRgbaAndPlugin({ h: 0, x: 0, y: 0, a: 0 }, false, false)
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

        // We test if any of the keys that are used in the plugin are pressed and set them to false to prevent this case: if user launches the plugin, enter the mouse inside (thus making it focused), leave the plugin, move a shape with shift key pressed in Figma (event listener will then trigger and add the 'shift' in $currentKeysPressed), then comes back to the plugin, $currentKeysPressed will still contains 'shift', even if he is not pressing it anymore, that's because the keyup event will not be triggered as the focus was lost when user moved the shape in Figma.
        // We could test if the mouse is inside on the keydown event but then, we will not be able to use the shift key to change the inputs values (by bigger steps for some of them, see in ColorValueInputs).
        // Same for ctrl key even if it is not used as much than shift in Figma.
        if ($currentKeysPressed.get()) $currentKeysPressed.set([''])
      }
    })

    // This is in case the user has multiple Figma files open with OkColor open in them as well. Without this if the plugin is focused, by pressing "ctrl + tab", the plugin in the previous tab will get the 'ctrl' in $currentKeysPressed and when the user comes back and move the manipulator in the ColorPicker, the ctrl modifier effect will be taken into account even if he's not pressing it.
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

    // We want to know if the user has one of these two keys down because in ColorPciker we constrain the color picker manipulator depending on them and in others parts like ColorValueInputs.
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
        <ContrastInput />
        <ColorCodeInputs />
      </div>
    </>
  )
}

ReactDOM.createRoot(document.getElementById('root')!).render(<App />)
