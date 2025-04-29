import { useEffect, useRef } from 'react'
import { consoleLogInfos } from '../../../constants'
import { useStore } from '@nanostores/react'
import { ColorCodesInputValues, ColorModelList } from '../../../types'
import copyToClipboard from '../../helpers/copyToClipboard/copyToClipboard'
import selectInputContent from '../../helpers/selectInputContent/selectInputContent'
import { $colorHxya, setColorHxyaWithSideEffects } from '../../stores/colors/colorHxya/colorHxya'
import { $isColorCodeInputsOpen, setIsColorCodeInputsOpenWithSideEffects } from '../../stores/colors/isColorCodeInputsOpen/isColorCodeInputsOpen'
import { $isMouseInsideDocument } from '../../stores/isMouseInsideDocument/isMouseInsideDocument'
import getColorCodeStrings from './helpers/getColorCodeStrings/getColorCodeStrings'
import getNewColorHxya from './helpers/getNewColorHxya/getNewColorHxya'
import DownArrowIcon from '../icons/DownArrowIcon/DownArrowIcon'
import CopyIcon from '../icons/CopyIcon/CopyIcon'
import { $currentColorModel } from '../../stores/colors/currentColorModel/currentColorModel'
import isColorCodeInGoodFormat from './helpers/isColorCodeInGoodFormat/isColorCodeInGoodFormat'

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

  const isColorCodeInputsOpen = useStore($isColorCodeInputsOpen)

  // const colorBgTest = useRef<HTMLDivElement>(null)

  const colorCode_currentColorModelInput = useRef<HTMLInputElement>(null)
  const colorCode_colorInput = useRef<HTMLInputElement>(null)
  const colorCode_rgbaInput = useRef<HTMLInputElement>(null)
  const colorCode_hexInput = useRef<HTMLInputElement>(null)

  const colorCode_currentColorModelCopyAction = useRef<HTMLDivElement>(null)
  const colorCode_colorCopyAction = useRef<HTMLDivElement>(null)
  const colorCode_rgbaCopyAction = useRef<HTMLDivElement>(null)
  const colorCode_hexCopyAction = useRef<HTMLDivElement>(null)

  const handleIsColorCodeInputsOpen = () => {
    setIsColorCodeInputsOpenWithSideEffects({ newIsColorCodeInputsOpen: !$isColorCodeInputsOpen.get() })
  }

  const removeModifierClassOnCopyActions = () => {
    colorCode_currentColorModelCopyAction.current!.classList.remove('c-copy-action--copied')
    colorCode_colorCopyAction.current!.classList.remove('c-copy-action--copied')
    colorCode_rgbaCopyAction.current!.classList.remove('c-copy-action--copied')
    colorCode_hexCopyAction.current!.classList.remove('c-copy-action--copied')
  }

  const updateColorCodeInputs = () => {
    const newColorStrings = getColorCodeStrings()

    // colorBgTest.current!.style.backgroundColor = newColorStrings.currentColorModel

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
      lastKeyPressed = ''
      return
    }

    // Test if user has for example pressed the tab key but without modyfing the value.
    if (colorCodesInputValues[eventTargetId] === eventTarget.value) {
      // Even if the color on input is the same, we allow to update the UI if rgba of hex inputs are focused, like this the user can simply set the sRGB fallback of an P3 color with "Enter" key.
      if (eventTargetId !== 'rgba' && eventTargetId !== 'hex') {
        lastKeyPressed = ''
        return
      }
    }

    let eventTargetValue = eventTarget.value
    let colorFormat: keyof typeof ColorCodesInputValues | keyof typeof ColorModelList = eventTargetId

    if (eventTargetId === 'currentColorModel') {
      colorFormat = $currentColorModel.get()
    }

    // If oklch() color has a lightness value in decimal (0 to 1), convert it to percentage (0% to 100%).
    if (colorFormat === 'oklch') {
      const regex = /oklch\((0(?:\.\d+)?|1(?:\.0+)?)\s+(\d*(?:\.\d+)?)\s+(\d+(?:\.\d+)?)(?:\s*\/\s*(\d+(?:\.\d+)?))?\)/
      const match = eventTargetValue.match(regex)

      if (match) {
        eventTargetValue = eventTargetValue.replace(regex, (_, lightness, chroma, hue, alpha) => {
          const percentLightness = (parseFloat(lightness) * 100).toFixed(2).replace(/\.?0+$/, '') + '%'
          return `oklch(${percentLightness} ${chroma} ${hue}${alpha ? ` / ${alpha}` : ''})`
        })
      }
    }

    // Test if the color code is in a good format.
    if (!isColorCodeInGoodFormat({ color: eventTargetValue, format: colorFormat })) {
      eventTarget.value = colorCodesInputValues[eventTargetId]
      return
    }

    const newColorHxya = getNewColorHxya({
      eventTargetId: eventTargetId,
      eventTargetValue: eventTargetValue
    })

    if (newColorHxya) {
      setColorHxyaWithSideEffects({
        newColorHxya: newColorHxya,
        lockRelativeChroma: false,
        lockContrast: false
      })
    } else eventTarget.value = colorCodesInputValues[eventTargetId]

    lastKeyPressed = ''
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
    ;(event.currentTarget as HTMLDivElement).classList.add('c-copy-action--copied')
  }

  useEffect(() => {
    updateColorCodeInputs()
  }, [colorHxya])

  return (
    <div className={'c-dropdown u-mt-10' + (isColorCodeInputsOpen ? ' c-dropdown--open' : '')}>
      {/* To test the render in CSS against the one in Figma */}
      {/* <div ref={colorBgTest} style={{ height: '100px', width: '100%' }}></div> */}

      <div className="c-dropdown__title-wrapper" onClick={handleIsColorCodeInputsOpen}>
        <div>Color codes</div>

        <div className={'c-dropdown__arrow-icon' + (isColorCodeInputsOpen ? ' c-dropdown__arrow-icon--open' : '')}>
          <DownArrowIcon />
        </div>
      </div>

      <div
        className={'c-dropdown__content-wraper u-px-15' + (isColorCodeInputsOpen ? '' : ' u-display-none')}
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
            className="c-copy-action"
            onClick={(event) => {
              handleCopyActionOnClick(event, colorCode_currentColorModelInput.current!)
            }}
          >
            <div className="c-copy-action__wrapper">
              <CopyIcon /> Copy
            </div>
          </div>
        </div>

        <div className="input-wrapper u-mt-6">
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
            className="c-copy-action"
            onClick={(event) => {
              handleCopyActionOnClick(event, colorCode_colorInput.current!)
            }}
          >
            <div className="c-copy-action__wrapper">
              <CopyIcon /> Copy
            </div>
          </div>
        </div>

        <div className="input-wrapper u-mt-6">
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
            className="c-copy-action"
            onClick={(event) => {
              handleCopyActionOnClick(event, colorCode_rgbaInput.current!)
            }}
          >
            <div className="c-copy-action__wrapper">
              <CopyIcon /> Copy
            </div>
          </div>
        </div>

        <div className="input-wrapper u-mt-6">
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
            className="c-copy-action"
            onClick={(event) => {
              handleCopyActionOnClick(event, colorCode_hexInput.current!)
            }}
          >
            <div className="c-copy-action__wrapper">
              <CopyIcon /> Copy
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
