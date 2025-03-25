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
import getColorHxyaValueFormatedForInput from './helpers/getColorHxyaValueFormatedForInput/getColorHxyaValueFormatedForInput'
import handleInputOnBlur from './helpers/handleInputOnBlur/handleInputOnBlur'
import handleInputOnKeyDown from './helpers/handleInputOnKeyDown/handleInputOnKeyDown'
import { $userSettings } from '../../stores/settings/userSettings/userSettings'
import round from 'lodash/round'

export type KeepInputSelected = {
  state: boolean
  inputId: keyof typeof HxyaLabels | ''
}

export default function ColorValueInputs() {
  if (consoleLogInfos.includes('Component renders')) {
    console.log('Component render — ColorValueInputs')
  }

  const userSettings = useStore($userSettings)
  const currentColorModel = useStore($currentColorModel)
  const colorHxya = useStore($colorHxya)
  const currentBgOrFg = useStore($currentBgOrFg)
  const lockRelativeChroma = useStore($lockRelativeChroma)
  const lockContrast = useStore($lockContrast)

  const inputH = useRef<HTMLInputElement>(null)
  const inputX = useRef<HTMLInputElement>(null)
  const inputY = useRef<HTMLInputElement>(null)
  const inputA = useRef<HTMLInputElement>(null)

  const lastKeyPressed = useRef('')
  const keepInputSelected = useRef<KeepInputSelected>({
    state: false,
    inputId: ''
  })

  const updateInputPositions = () => {
    if (
      ['okhsv', 'okhsl'].includes($currentColorModel.get()) ||
      ($currentColorModel.get() === 'oklch' && $userSettings.get().oklchInputOrder === 'hcl')
    ) {
      inputH.current!.classList.remove('u-order-2')
      inputX.current!.classList.remove('u-order-1')
      inputY.current!.classList.remove('u-order-0')
      inputA.current!.classList.remove('u-order-3')
    } else if ($userSettings.get().oklchInputOrder === 'lch') {
      inputH.current!.classList.add('u-order-2')
      inputX.current!.classList.add('u-order-1')
      inputY.current!.classList.add('u-order-0')
      inputA.current!.classList.add('u-order-3')
    }
  }

  const updateInputTabIndexes = () => {
    // In this function, we changes the tab indexes to -1 when an input is disabled (with css class), like this the user can't focus the input with tab key. See comment in "bases.css" for "input.disabled" for the reason why.

    if (
      ['okhsv', 'okhsl'].includes($currentColorModel.get()) ||
      ($currentColorModel.get() === 'oklch' && $userSettings.get().oklchInputOrder === 'hcl')
    ) {
      inputH.current!.tabIndex = 1
      inputX.current!.tabIndex = $lockRelativeChroma.get() ? -1 : 2
      inputY.current!.tabIndex = $lockContrast.get() ? -1 : 3
    } else if ($userSettings.get().oklchInputOrder === 'lch') {
      inputH.current!.tabIndex = 3
      inputX.current!.tabIndex = $lockRelativeChroma.get() ? -1 : 2
      inputY.current!.tabIndex = $lockContrast.get() ? -1 : 1
    }

    inputA.current!.tabIndex = $currentBgOrFg.get() === 'bg' || $lockContrast.get() ? -1 : 4
  }

  useEffect(() => {
    updateInputPositions()
    updateInputTabIndexes()
  }, [userSettings.oklchInputOrder, currentColorModel])

  useEffect(() => {
    if (['okhsv', 'okhsl'].includes(currentColorModel) || (currentColorModel === 'oklch' && userSettings.oklchHlDecimalPrecision === 1)) {
      inputH.current!.classList.remove('input--tighten')
      inputX.current!.classList.remove('input--tighten')
      inputY.current!.classList.remove('input--tighten')
      inputA.current!.classList.remove('input--tighten', 'u-flex-no-shrink', 'u-flex-basis-36')
    } else {
      inputH.current!.classList.add('input--tighten')
      inputX.current!.classList.add('input--tighten')
      inputY.current!.classList.add('input--tighten')
      inputA.current!.classList.add('input--tighten', 'u-flex-no-shrink', 'u-flex-basis-36')
    }

    updateInputPositions()
    updateInputTabIndexes()
  }, [userSettings.oklchHlDecimalPrecision, currentColorModel])

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
    inputX.current!.value = round(getColorHxyaValueFormatedForInput('x'), 3).toString()
  }, [colorHxya.x, currentColorModel, userSettings.useSimplifiedChroma])

  useEffect(() => {
    inputY.current!.value = colorHxya.y.toString()
  }, [colorHxya.y])

  useEffect(() => {
    inputA.current!.value = getColorHxyaValueFormatedForInput('a').toString() + '%'
  }, [colorHxya.a])

  useEffect(() => {
    if (keepInputSelected.current.state) {
      if (keepInputSelected.current.inputId === 'h') inputH.current!.select()
      if (keepInputSelected.current.inputId === 'x') inputX.current!.select()
      if (keepInputSelected.current.inputId === 'y') inputY.current!.select()
      if (keepInputSelected.current.inputId === 'a') inputA.current!.select()
      keepInputSelected.current.inputId = ''
      keepInputSelected.current.state = false
    }
  }, [colorHxya])

  return (
    <div className="input-wrapper c-color-value-inputs__input-wrapper">
      <input
        id="h"
        ref={inputH}
        onClick={selectInputContent}
        onBlur={(e) => {
          handleInputOnBlur(e, lastKeyPressed)
        }}
        onKeyDown={(e) => {
          handleInputOnKeyDown(e, lastKeyPressed, keepInputSelected)
        }}
      />
      <input
        id="x"
        ref={inputX}
        onClick={selectInputContent}
        onBlur={(e) => {
          handleInputOnBlur(e, lastKeyPressed)
        }}
        onKeyDown={(e) => {
          handleInputOnKeyDown(e, lastKeyPressed, keepInputSelected)
        }}
      />
      <input
        id="y"
        ref={inputY}
        onClick={selectInputContent}
        onBlur={(e) => {
          handleInputOnBlur(e, lastKeyPressed)
        }}
        onKeyDown={(e) => {
          handleInputOnKeyDown(e, lastKeyPressed, keepInputSelected)
        }}
      />
      <input
        id="a"
        ref={inputA}
        onClick={selectInputContent}
        onBlur={(e) => {
          handleInputOnBlur(e, lastKeyPressed)
        }}
        onKeyDown={(e) => {
          handleInputOnKeyDown(e, lastKeyPressed, keepInputSelected)
        }}
      />
    </div>
  )
}
