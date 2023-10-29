import { useEffect, useRef } from 'react'
import { selectInputContent } from '../../helpers/others'
import { consoleLogInfos } from '../../../constants'
import { $colorHxya, $isMouseInsideDocument, $showCssColorCodes, updateColorHxyaAndSyncColorsRgbaAndBackend } from '../../store'
import { useStore } from '@nanostores/react'
import getColorCodeStrings from './helpers/getColorCodeStrings'
import getNewColorHxya from './helpers/getNewColorHxya'
import { ColorCodesInputValues, ColorHxya, SyncShowCssColorCodesData } from '../../../types'
import copyToClipboard from '../../helpers/copyToClipboard'
import sendMessageToBackend from '../../helpers/sendMessageToBackend'

// We only need this object to check if the value of an input has been changed on blur.
const colorCodesInputValues: { [key in ColorCodesInputValues]: string } = {
  currentColorModel: '',
  color: '',
  rgba: '',
  hex: ''
}

let lastKeyPressed: string = ''

export default function ColorCodeInputs() {
  if (consoleLogInfos.includes('Component renders')) {
    console.log('Component render — ColorCodeInputs')
  }

  const colorHxya = useStore($colorHxya)

  const showCssColorCodes = useStore($showCssColorCodes)

  const colorCode_currentColorModelInput = useRef<HTMLInputElement>(null)
  const colorCode_colorInput = useRef<HTMLInputElement>(null)
  const colorCode_rgbaInput = useRef<HTMLInputElement>(null)
  const colorCode_hexInput = useRef<HTMLInputElement>(null)

  const colorCode_currentColorModelCopyAction = useRef<HTMLDivElement>(null)
  const colorCode_colorCopyAction = useRef<HTMLDivElement>(null)
  const colorCode_rgbaCopyAction = useRef<HTMLDivElement>(null)
  const colorCode_hexCopyAction = useRef<HTMLDivElement>(null)

  const removeModifierClassOnCopyActions = () => {
    colorCode_currentColorModelCopyAction.current!.classList.remove('c-color-code-inputs__copy-action--copied')
    colorCode_colorCopyAction.current!.classList.remove('c-color-code-inputs__copy-action--copied')
    colorCode_rgbaCopyAction.current!.classList.remove('c-color-code-inputs__copy-action--copied')
    colorCode_hexCopyAction.current!.classList.remove('c-color-code-inputs__copy-action--copied')
  }

  const updateColorCodeInputs = () => {
    const newColorStrings = getColorCodeStrings()

    colorCode_currentColorModelInput.current!.value = newColorStrings.currentColorModel
    colorCode_colorInput.current!.value = newColorStrings.color
    colorCode_rgbaInput.current!.value = newColorStrings.rgba
    colorCode_hexInput.current!.value = newColorStrings.hex

    Object.assign(colorCodesInputValues, newColorStrings)
  }

  const handleInputOnBlur = (event: React.FocusEvent<HTMLInputElement>) => {
    const eventTarget = event.target
    const eventTargetId = eventTarget.id as keyof typeof ColorCodesInputValues

    // If the mouse is outside plugin's window and the last key pressed is not Enter or Tab one.
    // If we are outside the window but user has pressed Enter or Tab key, we want to continue and update the input.
    if (lastKeyPressed === 'Escape' || (!$isMouseInsideDocument.get() && !['Enter', 'Tab'].includes(lastKeyPressed))) {
      eventTarget.value = colorCodesInputValues[eventTargetId]
      return
    } else {
      lastKeyPressed = ''
    }

    // This test is to know if user has for example pressed the tab key but without modyfing the value.
    if (colorCodesInputValues[eventTargetId] === eventTarget.value) {
      // Even if the color on input is the same, we allow to update the UI if rgba of hex inputs are focused, like this the user can simply set the sRGB fallback of an P3 color with "Enter" key.
      if (!((eventTargetId === 'rgba' || eventTargetId === 'hex') && lastKeyPressed !== 'Enter')) {
        return
      }
    }

    const newColorHxya = getNewColorHxya(eventTargetId, eventTarget.value)

    if (newColorHxya) {
      updateColorHxyaAndSyncColorsRgbaAndBackend({
        newColorHxya: newColorHxya as Partial<ColorHxya>,
        bypassLockRelativeChromaFilter: true,
        bypassLockContrastFilter: true
      })
    } else eventTarget.value = colorCodesInputValues[eventTargetId]
  }

  const handleInputOnKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (['Enter', 'Tab', 'Escape'].includes(event.key)) {
      lastKeyPressed = event.key
      ;(event.target as HTMLInputElement).blur()
    }
  }

  const handleCopyActionOnClick = (event: React.MouseEvent<HTMLDivElement>, input: HTMLInputElement) => {
    removeModifierClassOnCopyActions()
    copyToClipboard(input.value)
    ;(event.target as HTMLDivElement).classList.add('c-color-code-inputs__copy-action--copied')
  }

  useEffect(() => {
    updateColorCodeInputs()
  }, [colorHxya])

  return (
    <div className={'c-color-code-inputs' + (showCssColorCodes ? ' c-color-code-inputs--open' : '')}>
      <div
        className="c-color-code-inputs__title-wrapper"
        onClick={() => {
          $showCssColorCodes.set(!$showCssColorCodes.get())
          sendMessageToBackend<SyncShowCssColorCodesData>({
            type: 'syncShowCssColorCodes',
            data: {
              showCssColorCodes: $showCssColorCodes.get()
            }
          })
        }}
      >
        <div>Color codes</div>

        <div className={'c-color-code-inputs__arrow-icon' + (showCssColorCodes ? ' c-color-code-inputs__arrow-icon--open' : '')}>
          <svg className="svg" width="8" height="8" viewBox="0 0 8 8" xmlns="http://www.w3.org/2000/svg">
            <path d="M.646 4.647l.708.707L4 2.707l2.646 2.647.708-.707L4 1.293.646 4.647z" fillRule="nonzero" fillOpacity="1" stroke="none"></path>
          </svg>
        </div>
      </div>

      <div
        className={'c-color-code-inputs__inputs-wraper ' + (showCssColorCodes ? '' : ' u-display-none')}
        onMouseLeave={removeModifierClassOnCopyActions}
      >
        <div className="input-wrapper">
          <input
            ref={colorCode_currentColorModelInput}
            id="currentColorModel"
            onClick={selectInputContent}
            onBlur={handleInputOnBlur}
            onKeyDown={handleInputOnKeyDown}
            spellCheck={false}
          />
          <div
            ref={colorCode_currentColorModelCopyAction}
            className="c-color-code-inputs__copy-action"
            onClick={(event) => {
              handleCopyActionOnClick(event, colorCode_currentColorModelInput.current!)
            }}
          >
            Copy
          </div>
        </div>

        <div className="input-wrapper u-mt-4">
          <input
            ref={colorCode_colorInput}
            id="color"
            onClick={selectInputContent}
            onBlur={handleInputOnBlur}
            onKeyDown={handleInputOnKeyDown}
            spellCheck={false}
          />
          <div
            ref={colorCode_colorCopyAction}
            className="c-color-code-inputs__copy-action"
            onClick={(event) => {
              handleCopyActionOnClick(event, colorCode_colorInput.current!)
            }}
          >
            Copy
          </div>
        </div>

        <div className="input-wrapper u-mt-4">
          <input
            ref={colorCode_rgbaInput}
            id="rgba"
            onClick={selectInputContent}
            onBlur={handleInputOnBlur}
            onKeyDown={handleInputOnKeyDown}
            spellCheck={false}
          />
          <div
            ref={colorCode_rgbaCopyAction}
            className="c-color-code-inputs__copy-action"
            onClick={(event) => {
              handleCopyActionOnClick(event, colorCode_rgbaInput.current!)
            }}
          >
            Copy
          </div>
        </div>

        <div className="input-wrapper u-mt-4">
          <input
            ref={colorCode_hexInput}
            id="hex"
            onClick={selectInputContent}
            onBlur={handleInputOnBlur}
            onKeyDown={handleInputOnKeyDown}
            spellCheck={false}
          />
          <div
            ref={colorCode_hexCopyAction}
            className="c-color-code-inputs__copy-action"
            onClick={(event) => {
              handleCopyActionOnClick(event, colorCode_hexInput.current!)
            }}
          >
            Copy
          </div>
        </div>
      </div>
    </div>
  )
}
