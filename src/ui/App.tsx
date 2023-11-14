import ReactDOM from 'react-dom/client'
import { useEffect, useState } from 'react'

import ColorPicker from './components/ColorPicker/ColorPicker'
import FillOrStrokeToggle from './components/FillOrStrokeToggle/FillOrStrokeToggle'
import HueSlider from './components/sliders/HueSlider/HueSlider'
import OpacitySlider from './components/sliders/OpacitySlider/OpacitySlider'
import ColorModelSelect from './components/ColorModelSelect/ColorModelSelect'
import ColorValueInputs from './components/ColorValueInputs/ColorValueInputs'
import RelativeChromaInput from './components/single-input-with-lock/RelativeChromaInput/RelativeChromaInput'
import ContrastInput from './components/single-input-with-lock/ContrastInput/ContrastInput'
import { consoleLogInfos, useBackend } from '../constants'
import { DisplayUiMessageData, MessageForUi, SyncNewShapeData, SyncLocalStorageValuesData } from '../types'
import ColorCodeInputs from './components/ColorCodeInputs/ColorCodeInputs'
import sendMessageToBackend from './helpers/sendMessageToBackend/sendMessageToBackend'
import { setColorsRgbaWithSideEffects } from './stores/colors/colorsRgba/colorsRgba'
import { setCurrentColorModel, $currentColorModel } from './stores/colors/currentColorModel/currentColorModel'
import { setCurrentFileColorProfile } from './stores/colors/currentFileColorProfile/currentFileColorProfile'
import { setLockRelativeChroma, $lockRelativeChroma } from './stores/colors/lockRelativeChroma/lockRelativeChroma'
import { $currentBgOrFg, setCurrentBgOrFg } from './stores/contrasts/currentBgOrFg/currentBgOrFg'
import { setCurrentContrastMethod } from './stores/contrasts/currentContrastMethod/currentContrastMethod'
import { setIsContrastInputOpen } from './stores/contrasts/isContrastInputOpen/isContrastInputOpen'
import { setLockContrast, $lockContrast } from './stores/contrasts/lockContrast/lockContrast'
import { setCurrentFillOrStroke } from './stores/currentFillOrStroke/currentFillOrStroke'
import { $currentKeysPressed, setCurrentKeysPressed } from './stores/currentKeysPressed/currentKeysPressed'
import { setFigmaEditorType } from './stores/figmaEditorType/figmaEditorType'
import { setIsColorCodeInputsOpen } from './stores/colors/isColorCodeInputsOpen/isColorCodeInputsOpen'
import { setIsMouseInsideDocument } from './stores/isMouseInsideDocument/isMouseInsideDocument'
import { $mouseEventCallback, setMouseEventCallback } from './stores/mouseEventCallback/mouseEventCallback'
import { $uiMessage, hideUiMessageWithSideEffects, showUiMessageWithSideEffects } from './stores/uiMessage/uiMessage'
import round from 'lodash/round'
import SettingsScreen from './components/SettingsScreen/SettingsScreen'
import FileColorProfileSelect from './components/top-bar/FileColorProfileSelect/FileColorProfileSelect'
import SettingsToggle from './components/top-bar/SettingsToggle/SettingsToggle'
import { setUserSettings } from './stores/settings/userSettings/userSettings'

// We use these var to measure speeds of app loading time (see in constants file to activate it).
let appLoadingStart: number
let appLoadingEnd: number

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

  if (useBackend) {
    // Updates from the backend.
    onmessage = (event) => {
      const pluginMessage = event.data.pluginMessage as MessageForUi

      // Set variables from local storage that only backend code can get.
      if (pluginMessage.type === 'syncLocalStorageValues') {
        const data = pluginMessage.data as SyncLocalStorageValuesData

        setFigmaEditorType(data.newFigmaEditorType)
        setUserSettings(data.newUserSettings)
        setCurrentFileColorProfile(data.newCurrentFileColorProfile)
        setIsContrastInputOpen(data.newIsContrastInputOpen)
        setLockRelativeChroma(data.newLockRelativeChroma)
        setCurrentContrastMethod(data.newCurrentContrastMethod)
        setLockContrast(data.newLockContrast)
        setIsColorCodeInputsOpen(data.newIsColorCodeInputsOpen)
        setCurrentColorModel(data.newCurrentColorModel)
      }
      // Update the color based on the selected shape in Figma.

      // synNewShape
      if (pluginMessage.type === 'syncNewShape') {
        const data = pluginMessage.data as SyncNewShapeData

        if ($uiMessage.get().show) {
          hideUiMessageWithSideEffects()
        }

        if ($currentColorModel.get() === 'oklch') {
          // We update these two values in the case the user had one or the two set to true with a shape selected then deselected it, without this when he select a shape again, theses values would always be false as we set them to this value in setValuesForUiMessage() called when we show as UI message.
          if (data.newLockRelativeChroma !== $lockRelativeChroma.get()) {
            setLockRelativeChroma(data.newLockRelativeChroma)
          }
          //For this value, we have the same same reason but also another one: if the user has the plugin running with a shape that has a parent fill then select another one that doesn't have one, if he select back a shape with a parent fill, we need to check if $lockContrast is not equal to the one from backend and update it in accordance.
          if (data.newLockContrast !== $lockContrast.get() && data.newColorsRgba.parentFill) {
            setLockContrast(data.newLockContrast)
          } else if (!data.newColorsRgba.parentFill || !data.newColorsRgba.fill) {
            // If the user select a new shape that doesn't have a parent fill and he had the lockContrast on, we need to set it to false to avoid having the lock on when ContrastInput is deactivated.
            if ($lockContrast.get()) setLockContrast(false)
          }
        }

        // If on previous selected shape we had the parent selected, we set it to false as default.
        if ($currentBgOrFg.get() === 'bg') setCurrentBgOrFg('fg')

        setCurrentFillOrStroke(data.newCurrentFillOrStroke)

        setColorsRgbaWithSideEffects({
          newColorsRgba: data.newColorsRgba,
          sideEffects: {
            syncColorRgbWithBackend: false
          },
          lockRelativeChroma: false,
          lockContrast: false
        })

        // This says "when all the store values are filled, show the UI components if there were not mounted".
        if (!areStoreValuesReady) setAreStoreValuesReady(true)
      }
      // Set the UI in a disabled mode and update the UI message.
      else if (pluginMessage.type === 'displayUiMessage') {
        const data = pluginMessage.data as DisplayUiMessageData

        showUiMessageWithSideEffects({ messageCode: data.uiMessageCode, nodeType: data.nodeType })

        // This says "when all the store values are filled, show the UI components if there were not mounted".
        if (!areStoreValuesReady) setAreStoreValuesReady(true)
      }

      if (consoleLogInfos.includes('App loading speed') && appLoadingEnd === undefined) {
        appLoadingEnd = performance.now()
        console.clear()
        console.log(`App loaded in ${round(appLoadingEnd - appLoadingStart, 6)} ms.`)
      }
    }
  }

  useEffect(() => {
    if (consoleLogInfos.includes('App loading speed')) {
      appLoadingStart = performance.now()
    }

    document.addEventListener('mouseenter', () => {
      setIsMouseInsideDocument(true)

      if (document.hasFocus() === false) {
        // We set the focus back to the plugin window if user clicked outside of it, like this he doesn't need to click inside in order to use the shift or control keys.
        window.focus()
        // We test if any of the keys that are used in the plugin are pressed and set them to false to prevent this case: if user launches the plugin, enter the mouse inside (thus making it focused), leave the plugin, move a shape with shift key pressed in Figma (event listener will then trigger and add the 'shift' in $currentKeysPressed), then comes back to the plugin, $currentKeysPressed will still contains 'shift', even if he is not pressing it anymore, that's because the keyup event will not be triggered as the focus was lost when user moved the shape in Figma.
        // We could test if the mouse is inside on the keydown event but then, we will not be able to use the shift key to change the inputs values (by bigger steps for some of them, see in ColorValueInputs).
        // Same for ctrl key even if it is not used as much than shift in Figma.
        if ($currentKeysPressed.get()) setCurrentKeysPressed([''])
      }
    })

    // This is in case the user has multiple Figma files open with OkColor open in them as well. Without this if the plugin is focused, by pressing "ctrl + tab", the plugin in the previous tab will get the 'ctrl' in $currentKeysPressed and when the user comes back and move the manipulator in the ColorPicker, the ctrl modifier effect will be taken into account even if he's not pressing it.
    window.addEventListener('blur', () => {
      if ($currentKeysPressed.get()) setCurrentKeysPressed([''])
    })

    document.addEventListener('mouseleave', () => {
      setIsMouseInsideDocument(false)
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
      setMouseEventCallback(null)
    })

    // We want to know if the user has one of these two keys down because in ColorPciker we constrain the color picker manipulator depending on them and in others parts like ColorValueInputs.
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Shift') {
        setCurrentKeysPressed([...$currentKeysPressed.get(), 'shift'])
      } else if (event.key === 'Control') {
        setCurrentKeysPressed([...$currentKeysPressed.get(), 'ctrl'])
      }
    })

    document.addEventListener('keyup', (event) => {
      // We do this test on 'ArrowDown' and 'ArrowUp' because if not, in the inputs like relative chroma's one, we wouldn't be able to keep shift pressed more than one time.
      if (!['ArrowUp', 'ArrowDown'].includes(event.key) && $currentKeysPressed.get()) {
        setCurrentKeysPressed([''])
      }
    })

    if (useBackend) {
      // We launch the init procedure from the plugin (send some values and the color shape if any is selected) when the UI is ready.
      sendMessageToBackend({ type: 'triggerInit' })
    } else {
      setAreStoreValuesReady(true)
    }
  }, [])

  if (!areStoreValuesReady) {
    return
  } else {
    return (
      <>
        <SettingsScreen />

        <div className="u-flex u-items-center u-justify-between">
          <FileColorProfileSelect />

          <div className="u-mr-4">
            <SettingsToggle />
          </div>
        </div>

        <ColorPicker />

        <div className="o-bottom-controls">
          <div className="u-flex u-items-center u-justify-between u-px-16 u-mt-18">
            <FillOrStrokeToggle />

            <div className="u-flex u-flex-col">
              <HueSlider />
              <OpacitySlider />
            </div>
          </div>

          <div className="u-flex u-h-28 u-px-9 u-mt-12">
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
