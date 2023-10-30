import ReactDOM from 'react-dom/client'
import { useEffect, useState } from 'react'

import {
  $fileColorProfile,
  $currentColorModel,
  $lockRelativeChroma,
  $isColorCodeInputsOpen,
  $currentKeysPressed,
  $isMouseInsideDocument,
  $uiMessage,
  $currentFillOrStroke,
  $mouseEventCallback,
  $figmaEditorType,
  $updateParent,
  $lockContrast,
  $colorsRgba,
  updateColorHxyaAndSyncColorsRgbaAndBackend
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
import { DisplayUiMessageData, MessageForUi, SyncCurrentFillOrStrokeAndColorsRgbaData, SyncLocalStorageValuesData } from '../types'
import setValuesForUiMessage from './helpers/setValuesForUiMessage'
import sendMessageToBackend from './helpers/sendMessageToBackend'
import convertRgbToHxy from './helpers/convertRgbToHxy'

let isMouseDown = false

// The way we load the App component and its childs is like this: The plugin is split in two: the “backend” is the part that have access to the Figma file like the selected shape color and the “ui” is to display the content according to the values we get from the plugin.
// When the plugin is launched, we don't know yet if a shape is selected or not, its color(s), if it has a fill and/or a stroke, and we also don't have the values from local storage.
// So when App component is mounted, we ask for these infos to the backend ('triggerInit' event at the end of the onMount useEffect) and when we have them, we set areStoreValuesReady to true which will load the children components.
function App() {
  if (consoleLogInfos.includes('Component renders')) {
    console.log('Component render — App')
  }

  // We use this var to avoid loading the components before we have all te values from the backend, see comment on the top of the file fore more infos.
  const [areStoreValuesReady, setAreStoreValuesReady] = useState(false)

  // Updates from the backend.
  onmessage = (event) => {
    const pluginMessage = event.data.pluginMessage as MessageForUi

    // Set variables from local storage that only backend code can get.
    if (pluginMessage.type === 'syncLocalStorageValues') {
      const data = pluginMessage.data as SyncLocalStorageValuesData

      $figmaEditorType.set(data.figmaEditorType)
      $fileColorProfile.set(data.fileColorProfile)
      $currentColorModel.set(data.currentColorModel)
      $isColorCodeInputsOpen.set(data.isColorCodeInputsOpen)
      $lockRelativeChroma.set(data.lockRelativeChroma)
      $lockContrast.set(data.lockContrast)
    }
    // Update the color based on the selected shape in Figma.
    if (pluginMessage.type === 'syncCurrentFillOrStrokeAndColorsRgba') {
      if (document.body.classList.contains('deactivated')) document.body.classList.remove('deactivated')
      if ($uiMessage.get().show) $uiMessage.setKey('show', false)

      // If on previous selected shape we had the parent selected, we set it to false as default.
      if ($updateParent.get()) $updateParent.set(false)

      const data = pluginMessage.data as SyncCurrentFillOrStrokeAndColorsRgbaData

      $currentFillOrStroke.set(data.currentFillOrStroke)

      $colorsRgba.set(data.colorsRgba)

      const newColorRgba = data.colorsRgba[`${$currentFillOrStroke.get()}`]

      const newColorHxy = convertRgbToHxy({
        colorRgb: {
          r: newColorRgba!.r,
          g: newColorRgba!.g,
          b: newColorRgba!.b
        },
        targetColorModel: $currentColorModel.get(),
        fileColorProfile: $fileColorProfile.get(),
        keepOklchCssDoubleDigit: true
      })

      updateColorHxyaAndSyncColorsRgbaAndBackend({
        newColorHxya: {
          h: newColorHxy.h,
          x: newColorHxy.x,
          y: newColorHxy.y,
          a: newColorRgba!.a
        },
        syncColorsRgba: false,
        syncColorRgbWithBackend: false
      })

      // This says "when all the store value are filled, show the UI components".
      if (!areStoreValuesReady) setAreStoreValuesReady(true)
    }
    // Set the UI in a disabled mode and update the UI message.
    else if (pluginMessage.type === 'displayUiMessage') {
      const data = pluginMessage.data as DisplayUiMessageData

      $uiMessage.setKey('show', true)
      document.body.classList.add('deactivated')

      setValuesForUiMessage()

      let message = uiMessageTexts[`${data.uiMessageCode}`]
      if (data.nodeType) {
        message = message.replace('$SHAPE', data.nodeType.toLowerCase())
      }
      $uiMessage.setKey('message', message)

      // This says "when all the store value are filled, show the UI components".
      if (!areStoreValuesReady) setAreStoreValuesReady(true)
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
    sendMessageToBackend({ type: 'triggerInit' })
  }, [])

  if (!areStoreValuesReady) {
    return
  } else {
    return (
      <>
        <FileColorProfileSelect />
        <ColorPicker />

        <div className="s-bottom-controls">
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
}

ReactDOM.createRoot(document.getElementById('root')!).render(<App />)
