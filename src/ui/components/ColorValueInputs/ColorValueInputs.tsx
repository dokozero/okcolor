import { useEffect, useRef } from 'react'
import { consoleLogInfos } from '../../../constants'
import { useStore } from '@nanostores/react'
import { HxyaLabels } from '../../../types'
import selectInputContent from '../../helpers/selectInputContent/selectInputContent'
import { $colorHxya } from '../../stores/colors/colorHxya/colorHxya'
import { $currentColorModel } from '../../stores/colors/currentColorModel/currentColorModel'
import { $lockRelativeChroma } from '../../stores/colors/lockRelativeChroma/lockRelativeChroma'
import { $currentBgOrFg } from '../../stores/contrasts/currentBgOrFg/currentBgOrFg'
import { $lockContrast } from '../../stores/contrasts/lockContrast/lockContrast'
import { $isMouseInsideDocument } from '../../stores/isMouseInsideDocument/isMouseInsideDocument'
import getColorHxyDecimals from '../../helpers/colors/getColorHxyDecimals/getColorHxyDecimals'
import getHxyaInputRange from '../../helpers/colors/getHxyaInputRange/getHxyaInputRange'
import round from 'lodash/round'
import clamp from 'lodash/clamp'
import getColorHxyaValueFormatedForInput from './helpers/getColorHxyaValueFormatedForInput/getColorHxyaValueFormatedForInput'
import clampColorHxyaValueInInputFormat from './helpers/clampColorHxyaValueInInputFormat/clampColorHxyaValueInInputFormat'
import getStepUpdateValue from './helpers/getStepUpdateValue/getStepUpdateValue'
import formatAndSendNewValueToStore from './helpers/formatAndSendNewValueToStore/formatAndSendNewValueToStore'

let lastKeyPressed: string = ''
const keepInputSelected = {
  state: false,
  inputId: ''
}

export default function ColorValueInputs() {
  if (consoleLogInfos.includes('Component renders')) {
    console.log('Component render — ColorValueInputs')
  }

  const currentColorModel = useStore($currentColorModel)
  const colorHxya = useStore($colorHxya)
  const currentBgOrFg = useStore($currentBgOrFg)
  const lockRelativeChroma = useStore($lockRelativeChroma)
  const lockContrast = useStore($lockContrast)

  const inputH = useRef<HTMLInputElement>(null)
  const inputX = useRef<HTMLInputElement>(null)
  const inputY = useRef<HTMLInputElement>(null)
  const inputA = useRef<HTMLInputElement>(null)

  const updateInputPositions = () => {
    if ($currentColorModel.get() === 'oklchCss') {
      inputH.current!.classList.add('u-order-2')
      inputX.current!.classList.add('u-order-1')
      inputY.current!.classList.add('u-order-0')
      inputA.current!.classList.add('u-order-3')
    } else {
      inputH.current!.classList.remove('u-order-2')
      inputX.current!.classList.remove('u-order-1')
      inputY.current!.classList.remove('u-order-0')
      inputA.current!.classList.remove('u-order-3')
    }
  }

  const updateInputTabIndexes = () => {
    // In this function, we changes the tab indexes to -1 when an input is disabled (with css class), like this the user can't focus the input with tab key. See comment in "bases.css" for "input.disabled" for the reason why.

    if ($currentColorModel.get() === 'oklchCss') {
      inputH.current!.tabIndex = 3
      inputX.current!.tabIndex = $lockRelativeChroma.get() ? -1 : 2
      inputY.current!.tabIndex = $lockContrast.get() ? -1 : 1
    } else {
      inputH.current!.tabIndex = 1
      inputX.current!.tabIndex = $lockRelativeChroma.get() ? -1 : 2
      inputY.current!.tabIndex = $lockContrast.get() ? -1 : 3
    }
    inputA.current!.tabIndex = $currentBgOrFg.get() === 'bg' || $lockContrast.get() ? -1 : 4
  }

  const handleInputOnBlur = (event: React.FocusEvent<HTMLInputElement>) => {
    const eventTarget = event.target as HTMLInputElement

    const eventId = eventTarget.id as HxyaLabels

    const oldValue = getColorHxyaValueFormatedForInput(eventId)
    const newValue = round(parseFloat(eventTarget.value), getColorHxyDecimals({ forInputs: true })[`${eventId}`])

    if (isNaN(newValue)) {
      eventTarget.value = oldValue.toString() + (eventId === 'a' ? '%' : '')
      return
    }

    const clampedNewValue = clampColorHxyaValueInInputFormat(eventId, newValue)

    if (
      clampedNewValue === oldValue ||
      lastKeyPressed === 'Escape' ||
      (!$isMouseInsideDocument.get() && !['Enter', 'Tab'].includes(lastKeyPressed))
    ) {
      eventTarget.value = oldValue.toString() + (eventId === 'a' ? '%' : '')
      return
    } else {
      lastKeyPressed = ''
    }

    formatAndSendNewValueToStore(eventId, clampedNewValue)
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
        newValue = round(newValue, getColorHxyDecimals({ forInputs: true })[`${eventId}`])

        const clampedNewValue = clamp(newValue, getHxyaInputRange(eventId).min, getHxyaInputRange(eventId).max)
        formatAndSendNewValueToStore(eventId, clampedNewValue)
      }
    }
  }

  useEffect(() => {
    updateInputPositions()
    updateInputTabIndexes()
  }, [currentColorModel])

  useEffect(() => {
    // We use this tricks with disabled classes because of a bug using atoms to conditonaly use disabled attribute on input, see comment in "bases.css" for "input.disabled".
    if (lockRelativeChroma) {
      inputX.current!.classList.add('disabled')
    } else {
      inputX.current!.classList.remove('disabled')
    }

    // In this function, we changes the tab indexes to -1 when an input is disabled (with css class), like this the user can't focus the input with tab key.
    updateInputTabIndexes()
  }, [lockRelativeChroma])

  useEffect(() => {
    // Same comment on previous useEffect for reason of this code.
    if (lockContrast) {
      inputY.current!.classList.add('disabled')
    } else {
      inputY.current!.classList.remove('disabled')
    }

    if (currentBgOrFg === 'bg' || lockContrast) {
      inputA.current!.classList.add('disabled')
    } else {
      inputA.current!.classList.remove('disabled')
    }

    updateInputTabIndexes()
  }, [lockContrast, currentBgOrFg])

  useEffect(() => {
    inputH.current!.value = colorHxya.h.toString()
  }, [colorHxya.h])

  useEffect(() => {
    inputX.current!.value = getColorHxyaValueFormatedForInput('x').toString()
  }, [colorHxya.x, currentColorModel])

  useEffect(() => {
    inputY.current!.value = colorHxya.y.toString()
  }, [colorHxya.y])

  useEffect(() => {
    inputA.current!.value = getColorHxyaValueFormatedForInput('a').toString() + '%'
  }, [colorHxya.a])

  useEffect(() => {
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
      <input id="a" ref={inputA} onClick={selectInputContent} onBlur={handleInputOnBlur} onKeyDown={handleInputOnKeyDown} />
    </div>
  )
}
