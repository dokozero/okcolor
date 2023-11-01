import { useEffect, useRef } from 'react'
import { consoleLogInfos } from '../../../constants'
import { useStore } from '@nanostores/react'
import { HxyaLabels, AbsoluteChroma, Saturation, Lightness, Opacity, Hue, ColorHxya } from '../../../types'
import { $colorHxya, getColorValueDecimals, setColorHxyaWithSideEffects } from '../../stores/colors/colorHxya'
import { $currentColorModel } from '../../stores/colors/currentColorModel'
import { $lockRelativeChroma } from '../../stores/colors/lockRelativeChroma'
import { $currentBgOrFg } from '../../stores/contrasts/currentBgOrFg'
import { $lockContrast } from '../../stores/contrasts/lockContrast'
import { $currentKeysPressed } from '../../stores/currentKeysPressed'
import { $isMouseInsideDocument } from '../../stores/isMouseInsideDocument'
import roundWithDecimal from '../../helpers/numbers/roundWithDecimal'
import selectInputContent from '../../helpers/selectInputContent'

let lastKeyPressed: string = ''
const keepInputSelected = {
  state: false,
  inputId: ''
}

const getOldValue = (eventId: string): Hue | AbsoluteChroma | Saturation | Lightness | Opacity => {
  if (eventId === 'h') return $colorHxya.get().h
  if (eventId === 'x') return $colorHxya.get().x
  if (eventId === 'y') return $colorHxya.get().y
  if (eventId === 'a') return $colorHxya.get().a
  return 0
}

function getStepUpdateValue(eventId: string): number {
  const shiftPressed = $currentKeysPressed.get().includes('shift')

  if (eventId === 'x') {
    if ($currentColorModel.get() === 'oklchCss') return shiftPressed ? 0.01 : 0.001
    if ($currentColorModel.get() === 'oklch') return shiftPressed ? 1 : 0.1
  }
  return shiftPressed ? 10 : 1
}

const updateColorHxyaOrSetBackPreviousValue = (eventTarget: HTMLInputElement, eventId: keyof typeof HxyaLabels, newValue: number) => {
  if ($lockRelativeChroma.get() && eventId === 'x') return
  if ($lockContrast.get() && eventId === 'y') return

  const oldValue = getOldValue(eventId)

  const newColorHxya: Partial<ColorHxya> = { h: undefined, x: undefined, y: undefined, a: undefined }

  if (['okhsv', 'okhsl'].includes($currentColorModel.get())) {
    // In case the user entered a value with a decimal in OkHSV or OkHSL mode.
    newColorHxya[`${eventId}`] = Math.round(newValue)
  } else {
    newColorHxya[`${eventId}`] = newValue
  }

  if (newValue >= 0 && newValue <= (eventId === 'h' ? 360 : 100) && newValue !== oldValue) {
    if ($currentColorModel.get() === 'oklch' && newColorHxya.x) newColorHxya.x /= 100

    setColorHxyaWithSideEffects({ newColorHxya: newColorHxya })
  } else {
    eventTarget.value = oldValue.toString() + (eventId === 'a' ? '%' : '')
  }
}

export default function ColorValueInputs() {
  if (consoleLogInfos.includes('Component renders')) {
    console.log('Component render — ColorValueInputs')
  }

  const currentColorModel = useStore($currentColorModel)
  const colorHxya = useStore($colorHxya)
  const currentBgOrFg = useStore($currentBgOrFg)
  const lockContrast = useStore($lockContrast)

  const inputH = useRef<HTMLInputElement>(null)
  const inputX = useRef<HTMLInputElement>(null)
  const inputY = useRef<HTMLInputElement>(null)
  const inputA = useRef<HTMLInputElement>(null)

  const updateInputPositions = () => {
    if ($currentColorModel.get() === 'oklchCss') {
      inputH.current!.classList.add('u-order-2')
      inputH.current!.tabIndex = 3

      inputX.current!.classList.add('u-order-1')
      inputX.current!.tabIndex = 2

      inputY.current!.classList.add('u-order-0')
      inputY.current!.tabIndex = 1

      inputA.current!.classList.add('u-order-3')
    } else {
      inputH.current!.classList.remove('u-order-2')
      inputH.current!.tabIndex = 1

      inputX.current!.classList.remove('u-order-1')
      inputX.current!.tabIndex = 2

      inputY.current!.classList.remove('u-order-0')
      inputY.current!.tabIndex = 3

      inputA.current!.classList.remove('u-order-3')
    }
  }

  const handleInputOnBlur = (event: React.FocusEvent<HTMLInputElement>) => {
    const eventTarget = event.target as HTMLInputElement

    const eventId = eventTarget.id as HxyaLabels

    let oldValue = getOldValue(eventId)
    const newValue = parseFloat(eventTarget.value)

    if ($currentColorModel.get() === 'oklch' && eventId === 'x') {
      oldValue = roundWithDecimal(oldValue * 100, 1)
    }

    if (lastKeyPressed === 'Escape' || isNaN(newValue) || (!$isMouseInsideDocument.get() && !['Enter', 'Tab'].includes(lastKeyPressed))) {
      eventTarget.value = oldValue.toString() + (eventId === 'a' ? '%' : '')
      return
    } else {
      lastKeyPressed = ''
    }

    updateColorHxyaOrSetBackPreviousValue(eventTarget, eventId, newValue)
  }

  const handleInputOnKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    const eventKey = event.key

    if (['Enter', 'Tab', 'Escape'].includes(eventKey)) {
      lastKeyPressed = eventKey
      ;(event.target as HTMLInputElement).blur()
    } else if (['ArrowUp', 'ArrowDown'].includes(eventKey)) {
      if (['ArrowUp', 'ArrowDown'].includes(eventKey)) {
        const eventTarget = event.target as HTMLInputElement
        const eventId = eventTarget.id as HxyaLabels

        let newValue = parseFloat(eventTarget.value)

        event.preventDefault()
        keepInputSelected.state = true
        keepInputSelected.inputId = eventId

        const stepUpdateValue = getStepUpdateValue(eventId)
        if (eventKey === 'ArrowUp') newValue += stepUpdateValue
        else if (eventKey === 'ArrowDown') newValue -= stepUpdateValue

        // We need to round the value because sometimes we can get results like 55.8999999.
        newValue = roundWithDecimal(newValue, getColorValueDecimals()[`${eventId}`])

        updateColorHxyaOrSetBackPreviousValue(eventTarget, eventId, newValue)
      }
    }
  }

  useEffect(() => {
    updateInputPositions()
  }, [currentColorModel])

  useEffect(() => {
    inputH.current!.value = colorHxya.h.toString()
    inputY.current!.value = colorHxya.y.toString()
    inputA.current!.value = colorHxya.a.toString() + '%'

    if ($currentColorModel.get() === 'oklch') {
      const newX = roundWithDecimal(colorHxya.x * 100, 1)
      inputX.current!.value = newX.toString()
    } else {
      inputX.current!.value = colorHxya.x.toString()
    }

    if (keepInputSelected.state) {
      if (keepInputSelected.inputId == 'h') inputH.current!.select()
      if (keepInputSelected.inputId == 'x') inputX.current!.select()
      if (keepInputSelected.inputId == 'y') inputY.current!.select()
      if (keepInputSelected.inputId == 'a') inputA.current!.select()

      keepInputSelected.inputId = ''
      keepInputSelected.state = false
    }
  }, [colorHxya])

  return (
    <div className="input-wrapper c-select-input-controls__input-wrapper">
      <input id="h" ref={inputH} onClick={selectInputContent} onBlur={handleInputOnBlur} onKeyDown={handleInputOnKeyDown} />
      <input id="x" ref={inputX} onClick={selectInputContent} onBlur={handleInputOnBlur} onKeyDown={handleInputOnKeyDown} />
      <input id="y" ref={inputY} onClick={selectInputContent} onBlur={handleInputOnBlur} onKeyDown={handleInputOnKeyDown} />
      <input
        id="a"
        ref={inputA}
        onClick={selectInputContent}
        onBlur={handleInputOnBlur}
        onKeyDown={handleInputOnKeyDown}
        tabIndex={4}
        disabled={currentBgOrFg === 'bg' || lockContrast ? true : false}
      />
    </div>
  )
}
