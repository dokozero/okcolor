import { useEffect, useRef, useState } from 'react'
import { MAX_APCA_CONTRAST, MAX_WCAG_CONTRAST, MIN_APCA_CONTRAST, MIN_WCAG_CONTRAST, consoleLogInfos } from '../../../../constants'
import { useStore } from '@nanostores/react'
import { ApcaContrast, CurrentContrastMethod, WcagContrast } from '../../../../types'
import BgOrFgToggle from './BgOrFgToggle'
import OpenLockIcon from '../OpenLockIcon'
import ClosedLockIcon from './ClosedLockIcon'
import getContrastFromBgandFgRgba from '../../../helpers/contrasts/getContrastFromBgandFgRgba'
import { $colorsRgba } from '../../../stores/colors/colorsRgba'
import { $currentColorModel } from '../../../stores/colors/currentColorModel'
import { $contrast, setContrast, setContrastWithSideEffects } from '../../../stores/contrasts/contrast'
import { $currentContrastMethod, setCurrentContrastMethodWithSideEffects } from '../../../stores/contrasts/currentContrastMethod'
import { $isContrastInputOpen, setIsContrastInputOpenWithSideEffects } from '../../../stores/contrasts/isContrastInputOpen'
import { $lockContrast, setLockContrastWithSideEffects } from '../../../stores/contrasts/lockContrast'
import { $currentFillOrStroke } from '../../../stores/currentFillOrStroke'
import { $currentKeysPressed } from '../../../stores/currentKeysPressed'
import { $isMouseInsideDocument } from '../../../stores/isMouseInsideDocument'
import { $uiMessage } from '../../../stores/uiMessage'
import roundWithDecimal from '../../../helpers/numbers/roundWithDecimal'
import selectInputContent from '../../../helpers/selectInputContent'

let lastKeyPressed: string = ''
let keepInputSelected = false

const updateContrastOrSetBackPreviousValue = (eventTarget: HTMLInputElement, newContrast: ApcaContrast | WcagContrast) => {
  let minContrast: ApcaContrast | WcagContrast
  let maxContrast: ApcaContrast | WcagContrast

  if ($currentContrastMethod.get() === 'apca') {
    minContrast = MIN_APCA_CONTRAST
    maxContrast = MAX_APCA_CONTRAST
  } else {
    minContrast = MIN_WCAG_CONTRAST
    maxContrast = MAX_WCAG_CONTRAST
  }

  if (newContrast < minContrast || newContrast > maxContrast || newContrast === $contrast.get()) {
    eventTarget.value = String($contrast.get())
    return
  }

  setContrastWithSideEffects({ newContrast: newContrast })
}

const getNewContrastValueFromArrowKey = (
  eventKey: 'ArrowDown' | 'ArrowUp',
  currentValue: ApcaContrast | WcagContrast
): ApcaContrast | WcagContrast => {
  let newValue: ApcaContrast | WcagContrast

  let stepUpdateValue: number

  if ($currentContrastMethod.get() === 'apca') {
    stepUpdateValue = $currentKeysPressed.get().includes('shift') ? 10 : 1

    if (eventKey === 'ArrowUp') {
      if (currentValue === 0) newValue = 7
      else newValue = currentValue + stepUpdateValue
    } else if (eventKey === 'ArrowDown') {
      if (currentValue === 0) newValue = -7
      else newValue = currentValue - stepUpdateValue
    }

    if (newValue! > -7 && newValue! < 7) newValue = 0
  } else {
    stepUpdateValue = $currentKeysPressed.get().includes('shift') ? 1 : 0.1

    if (eventKey === 'ArrowUp') {
      if (currentValue === -1) newValue = 1
      else newValue = currentValue + stepUpdateValue
    } else if (eventKey === 'ArrowDown') {
      if (currentValue === 1) newValue = -1
      else newValue = currentValue - stepUpdateValue
    }
  }

  // We need to this because in some cases we can have values like 1.2999999999999998.
  return roundWithDecimal(newValue!, 1)
}

const handleLockContrast = () => {
  setLockContrastWithSideEffects({ newLockContrast: !$lockContrast.get() })
}

export default function ContrastInput() {
  if (consoleLogInfos.includes('Component renders')) {
    console.log('Component render — ContrastInput')
  }

  const colorsRgba = useStore($colorsRgba)
  const contrast = useStore($contrast)
  const lockContrast = useStore($lockContrast)
  const currentColorModel = useStore($currentColorModel)
  const currentFillOrStroke = useStore($currentFillOrStroke)
  const currentContrastMethod = useStore($currentContrastMethod)

  const isContrastInputOpen = useStore($isContrastInputOpen)
  const [showContrast, setShowContrast] = useState<boolean | undefined>(undefined)

  const contrastMethodSelect = useRef<HTMLSelectElement>(null)
  const input = useRef<HTMLInputElement>(null)

  const handleIsContrastInputOpen = () => {
    setIsContrastInputOpenWithSideEffects({ newIsContrastInputOpen: !$isContrastInputOpen.get() })
  }

  const handleContrastMethod = (event: { target: HTMLSelectElement }) => {
    const newCurrentContrastMethod = event.target.value as CurrentContrastMethod

    setCurrentContrastMethodWithSideEffects({ newCurrentContrastMethod: newCurrentContrastMethod })

    const newContrast = getContrastFromBgandFgRgba($colorsRgba.get().fill!, $colorsRgba.get().parentFill!)
    setContrast(newContrast)
  }

  const handleInputOnBlur = (event: React.FocusEvent<HTMLInputElement>) => {
    const eventTarget = event.target

    if (lastKeyPressed === 'Escape' || (!$isMouseInsideDocument.get() && !['Enter', 'Tab'].includes(lastKeyPressed))) {
      eventTarget.value = String(contrast)
      return
    } else {
      lastKeyPressed = ''
    }

    const newValue: ApcaContrast | WcagContrast =
      $currentContrastMethod.get() === 'apca' ? parseInt(eventTarget.value) : parseFloat(eventTarget.value)

    updateContrastOrSetBackPreviousValue(eventTarget, newValue)
  }

  const handleInputOnKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    const eventKey = event.key
    const eventTarget = event.target as HTMLInputElement

    if (['Enter', 'Tab', 'Escape'].includes(eventKey)) {
      lastKeyPressed = eventKey
      ;(event.target as HTMLInputElement).blur()
    } else if (['ArrowUp', 'ArrowDown'].includes(eventKey)) {
      const currentValue: ApcaContrast | WcagContrast =
        $currentContrastMethod.get() === 'apca' ? parseInt(eventTarget.value) : parseFloat(eventTarget.value)

      event.preventDefault()
      keepInputSelected = true

      const newValue = getNewContrastValueFromArrowKey(eventKey as 'ArrowDown' | 'ArrowUp', currentValue)
      updateContrastOrSetBackPreviousValue(eventTarget, newValue)
    }
  }

  useEffect(() => {
    if (['okhsv', 'okhsl'].includes($currentColorModel.get())) return
    if (!colorsRgba.parentFill || !colorsRgba.fill) return

    input.current!.value = String(contrast)

    if (keepInputSelected) {
      input.current!.select()
      keepInputSelected = false
    }
  }, [contrast])

  useEffect(() => {
    if (['okhsv', 'okhsl'].includes($currentColorModel.get())) return

    if (!colorsRgba.parentFill || !colorsRgba.fill) {
      input.current!.value = '-'
    } else {
      input.current!.value = String(contrast)
    }
  }, [colorsRgba])

  useEffect(() => {
    if (['oklch', 'oklchCss'].includes(currentColorModel)) {
      setShowContrast(true)
    } else {
      setShowContrast(false)
    }
  }, [currentColorModel])

  useEffect(() => {
    document.addEventListener('keydown', (event) => {
      if (!['oklch', 'oklchCss'].includes($currentColorModel.get())) return
      // We test if document.activeElement?.tagName is an input because we don't want to trigger this code if user type "c" while he's in one of them.
      if ($uiMessage.get().show || document.activeElement?.tagName === 'INPUT') return
      if (!$colorsRgba.get().parentFill || !$colorsRgba.get().fill || $currentFillOrStroke.get() === 'stroke') return

      if (['l', 'L'].includes(event.key)) handleLockContrast()
    })
  }, [])

  return (
    <div
      className={
        'c-dropdown u-mt-10' +
        (isContrastInputOpen ? ' c-dropdown--open' : ' -u-mb-10') +
        (showContrast ? '' : ' u-visibility-hidden u-position-absolute')
      }
    >
      <div className="c-dropdown__title-wrapper" onClick={handleIsContrastInputOpen}>
        <div>Contrast</div>

        <div className={'c-dropdown__arrow-icon' + (isContrastInputOpen ? ' c-dropdown__arrow-icon--open' : '')}>
          <svg className="svg" width="8" height="8" viewBox="0 0 8 8" xmlns="http://www.w3.org/2000/svg">
            <path d="M.646 4.647l.708.707L4 2.707l2.646 2.647.708-.707L4 1.293.646 4.647z" fillRule="nonzero" fillOpacity="1" stroke="none"></path>
          </svg>
        </div>
      </div>

      <div
        className={
          'c-single-input-with-lock c-single-input-with-lock--with-select c-dropdown__content-wraper u-mb-10' +
          (isContrastInputOpen ? '' : ' u-display-none') +
          ((!colorsRgba.parentFill || !colorsRgba.fill || currentFillOrStroke === 'stroke') && !$uiMessage.get().show
            ? ' c-single-input-with-lock--deactivated'
            : '')
        }
      >
        <div className="select-wrapper c-select-input-controls__select-wrapper">
          <select ref={contrastMethodSelect} onChange={handleContrastMethod} name="contrast_method" id="contrast_method">
            <option value="apca" selected={currentContrastMethod === 'apca' ? true : false}>
              APCA
            </option>
            <option value="wcag" selected={currentContrastMethod === 'wcag' ? true : false}>
              WCAG
            </option>
          </select>
        </div>

        <BgOrFgToggle />

        <div className="input-wrapper c-single-input-with-lock__input-wrapper">
          <input ref={input} onClick={selectInputContent} onBlur={handleInputOnBlur} onKeyDown={handleInputOnKeyDown} />
        </div>

        <div className="c-single-input-with-lock__lock-wrapper" onClick={handleLockContrast}>
          <div className={'c-single-input-with-lock__lock' + (lockContrast ? ' c-single-input-with-lock__lock--closed' : '')}>
            {!lockContrast ? <OpenLockIcon /> : <ClosedLockIcon />}
          </div>
        </div>
      </div>
    </div>
  )
}
