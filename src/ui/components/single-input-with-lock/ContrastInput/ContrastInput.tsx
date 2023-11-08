import { useEffect, useRef, useState } from 'react'
import { useStore } from '@nanostores/react'
import { ApcaContrast, CurrentContrastMethod, WcagContrast } from '../../../../types'
import getContrastFromBgandFgRgba from '../../../helpers/contrasts/getContrastFromBgandFgRgba/getContrastFromBgandFgRgba'
import selectInputContent from '../../../helpers/selectInputContent/selectInputContent'
import { $colorsRgba } from '../../../stores/colors/colorsRgba/colorsRgba'
import { $currentColorModel } from '../../../stores/colors/currentColorModel/currentColorModel'
import { $contrast, setContrastWithSideEffects, setContrast } from '../../../stores/contrasts/contrast/contrast'
import {
  $currentContrastMethod,
  setCurrentContrastMethodWithSideEffects
} from '../../../stores/contrasts/currentContrastMethod/currentContrastMethod'
import { $isContrastInputOpen, setIsContrastInputOpenWithSideEffects } from '../../../stores/contrasts/isContrastInputOpen/isContrastInputOpen'
import { setLockContrastWithSideEffects, $lockContrast } from '../../../stores/contrasts/lockContrast/lockContrast'
import { $currentFillOrStroke } from '../../../stores/currentFillOrStroke/currentFillOrStroke'
import { $isMouseInsideDocument } from '../../../stores/isMouseInsideDocument/isMouseInsideDocument'
import { $uiMessage } from '../../../stores/uiMessage/uiMessage'
import BgOrFgToggle from '../BgOrFgToggle/BgOrFgToggle'
import ClosedLockIcon from '../ClosedLockIcon/ClosedLockIcon'
import OpenLockIcon from '../OpenLockIcon/OpenLockIcon'
import { consoleLogInfos } from '../../../../constants'
import getContrastRange from '../../../helpers/contrasts/getContrastRange/getContrastRange'
import clamp from 'lodash/clamp'
import getNewContrastValueFromArrowKey from './helpers/getNewContrastValueFromArrowKey/getNewContrastValueFromArrowKey'

let lastKeyPressed: string = ''
let keepInputSelected = false

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

    const newContrast = getContrastFromBgandFgRgba({
      fg: $colorsRgba.get().fill!,
      bg: $colorsRgba.get().parentFill!
    })
    setContrast(newContrast)
  }

  const handleInputOnBlur = (event: React.FocusEvent<HTMLInputElement>) => {
    const eventTarget = event.target

    const newValue: ApcaContrast | WcagContrast =
      $currentContrastMethod.get() === 'apca' ? parseInt(eventTarget.value) : parseFloat(eventTarget.value)

    if (isNaN(newValue)) {
      eventTarget.value = String($contrast.get())
      return
    }

    const clampedNewContrast = clamp(newValue, getContrastRange().negative.max, getContrastRange().positive.max)

    if (
      clampedNewContrast === $contrast.get() ||
      lastKeyPressed === 'Escape' ||
      (!$isMouseInsideDocument.get() && !['Enter', 'Tab'].includes(lastKeyPressed))
    ) {
      eventTarget.value = String($contrast.get())
      return
    } else {
      lastKeyPressed = ''
    }

    setContrastWithSideEffects({ newContrast: clampedNewContrast })
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
      const clampedNewContrast = clamp(newValue, getContrastRange().negative.max, getContrastRange().positive.max)
      setContrastWithSideEffects({ newContrast: clampedNewContrast })
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
      input.current!.value = String($contrast.get())
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
