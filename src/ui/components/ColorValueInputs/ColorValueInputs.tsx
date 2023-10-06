import { useEffect, useRef } from 'react'
import {
  $colorHxya,
  $colorValueDecimals,
  $currentColorModel,
  $currentKeysPressed,
  $isMouseInsideDocument,
  $lockRelativeChroma,
  updateColorHxya
} from '../../store'
import { selectInputContent, roundWithDecimal } from '../../helpers/others'
import { consoleLogInfos } from '../../../constants'
import { useStore } from '@nanostores/react'
import getClampedChroma from '../../helpers/getClampedChroma'
import convertRelativeChromaToAbsolute from '../../helpers/convertRelativeChromaToAbsolute'
import { PartialColorHxya, HxyaLabels, ColorHxy } from '../../../types'

let lastKeyPressed: string = ''
const keepInputSelected = {
  state: false,
  inputId: ''
}

const getOldValue = (eventId: string): number | undefined => {
  if (eventId === 'h') return $colorHxya.get().h!
  if (eventId === 'x') return $colorHxya.get().x
  if (eventId === 'y') return $colorHxya.get().y
  if (eventId === 'a') return $colorHxya.get().a
  return
}

function getStepUpdateValue(eventId: string): number {
  const shiftPressed = $currentKeysPressed.get().includes('shift')

  if (eventId === 'x') {
    if ($currentColorModel.get() === 'oklchCss') return shiftPressed ? 0.01 : 0.001
    if ($currentColorModel.get() === 'oklch') return shiftPressed ? 1 : 0.1
  }
  return shiftPressed ? 10 : 1
}

const updateColorHxyaTargetValue = (eventTarget: HTMLInputElement, eventId: keyof typeof HxyaLabels, newValue: number) => {
  const oldValue = getOldValue(eventId)

  const newColorHxya: PartialColorHxya = { h: undefined, x: undefined, y: undefined, a: undefined }

  if (['okhsv', 'okhsl'].includes($currentColorModel.get()!)) {
    // In case the user entered a value with a decimal in OkHSV or OkHSL mode.
    newColorHxya[`${eventId}`] = Math.round(newValue)
  } else {
    newColorHxya[`${eventId}`] = newValue
  }

  const colorHxyaTempsFunctionProp: ColorHxy = {
    h: $colorHxya.get().h!,
    x: $colorHxya.get().x,
    y: $colorHxya.get().y
  }

  // We need to clamp the chroma if we are in oklch mode and user changed any of the hxy value.
  if (['oklch', 'oklchCss'].includes($currentColorModel.get()!) && eventId !== 'a' && !$lockRelativeChroma.get()) {
    colorHxyaTempsFunctionProp[`${eventId}`] = newValue

    newColorHxya.x = getClampedChroma(colorHxyaTempsFunctionProp)
    if (eventId === 'x') newValue = newColorHxya.x
  } else if (['oklch', 'oklchCss'].includes($currentColorModel.get()!) && eventId !== 'a' && eventId !== 'x' && $lockRelativeChroma.get()) {
    colorHxyaTempsFunctionProp[`${eventId}`] = newValue

    newColorHxya.x = convertRelativeChromaToAbsolute({ colorHxy: colorHxyaTempsFunctionProp })
  }

  if (newValue >= 0 && newValue <= (eventId === 'h' ? 360 : 100) && newValue !== oldValue) {
    updateColorHxya(newColorHxya)
  } else {
    eventTarget.value = oldValue!.toString() + (eventId === 'a' ? '%' : '')
  }
}

export default function ColorValueInputs() {
  if (consoleLogInfos.includes('Component renders')) {
    console.log('Component render — ColorValueInputs')
  }

  const currentColorModel = useStore($currentColorModel)
  const colorHxya = useStore($colorHxya)

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

    const oldValue = getOldValue(eventId)
    const newValue = parseFloat(eventTarget.value)

    // if (isNaN(newValue) || (event.type === 'blur' && !$isMouseInsideDocument.get())) {
    if (isNaN(newValue) || (!$isMouseInsideDocument.get() && !['Enter', 'Tab'].includes(lastKeyPressed))) {
      eventTarget.value = oldValue!.toString() + (eventId === 'a' ? '%' : '')
      return
    } else {
      lastKeyPressed = ''
    }

    updateColorHxyaTargetValue(eventTarget, eventId, newValue)
  }

  const handleInputOnKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    const eventKey = event.key

    if (['Enter', 'Tab'].includes(eventKey)) {
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

        // We need to round the value because sometimes we can get results like 55.8999999
        newValue = roundWithDecimal(newValue, $colorValueDecimals.get()![`${eventId}`])

        updateColorHxyaTargetValue(eventTarget, eventId, newValue)
      }
    }
  }

  useEffect(() => {
    updateInputPositions()
  }, [currentColorModel])

  useEffect(() => {
    if (colorHxya.h === null) return

    inputH.current!.value = colorHxya.h.toString()
    inputX.current!.value = colorHxya.x.toString()
    inputY.current!.value = colorHxya.y.toString()
    inputA.current!.value = colorHxya.a.toString() + '%'

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
      <input id="a" ref={inputA} onClick={selectInputContent} onBlur={handleInputOnBlur} onKeyDown={handleInputOnKeyDown} tabIndex={4} />
    </div>
  )
}
