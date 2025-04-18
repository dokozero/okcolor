import { useEffect, useRef } from 'react'
import { useStore } from '@nanostores/react'
import { CurrentContrastMethod } from '../../../../types'
import getContrastFromBgandFgRgba from '../../../helpers/contrasts/getContrastFromBgandFgRgba/getContrastFromBgandFgRgba'
import selectInputContent from '../../../helpers/selectInputContent/selectInputContent'
import { $colorsRgba } from '../../../stores/colors/colorsRgba/colorsRgba'
import { $currentColorModel } from '../../../stores/colors/currentColorModel/currentColorModel'
import { $contrast, setContrast } from '../../../stores/contrasts/contrast/contrast'
import {
  $currentContrastMethod,
  setCurrentContrastMethodWithSideEffects
} from '../../../stores/contrasts/currentContrastMethod/currentContrastMethod'
import { $isContrastInputOpen } from '../../../stores/contrasts/isContrastInputOpen/isContrastInputOpen'
import { setLockContrastWithSideEffects, $lockContrast } from '../../../stores/contrasts/lockContrast/lockContrast'
import { $currentFillOrStroke } from '../../../stores/currentFillOrStroke/currentFillOrStroke'
import { $uiMessage } from '../../../stores/uiMessage/uiMessage'
import BgOrFgToggle from '../BgOrFgToggle/BgOrFgToggle'
import { consoleLogInfos } from '../../../../constants'
import handleInputOnBlur from './helpers/handleInputOnBlur/handleInputOnBlur'
import handleInputOnKeyDown from './helpers/handleInputOnKeyDown/handleInputOnKeyDown'
import ClosedLockIcon from '../../icons/ClosedLockIcon/ClosedLockIcon'
import OpenLockIcon from '../../icons/OpenLockIcon/OpenLockIcon'

const handleLockContrast = () => {
  setLockContrastWithSideEffects({ newLockContrast: !$lockContrast.get() })
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

export default function ContrastInput() {
  if (consoleLogInfos.includes('Component renders')) {
    console.log('Component render — ContrastInput')
  }

  const colorsRgba = useStore($colorsRgba)
  const contrast = useStore($contrast)
  const lockContrast = useStore($lockContrast)
  const currentFillOrStroke = useStore($currentFillOrStroke)
  const currentContrastMethod = useStore($currentContrastMethod)

  const isContrastInputOpen = useStore($isContrastInputOpen)

  const contrastMethodSelect = useRef<HTMLSelectElement>(null)
  const input = useRef<HTMLInputElement>(null)

  const lastKeyPressed = useRef('')
  const keepInputSelected = useRef(false)

  useEffect(() => {
    if (['okhsv', 'okhsl'].includes($currentColorModel.get())) return
    if (!colorsRgba.parentFill || !colorsRgba.fill) return

    input.current!.value = String(contrast)

    if (keepInputSelected.current) {
      input.current!.select()
      keepInputSelected.current = false
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
    document.addEventListener('keydown', (event) => {
      if (!['l', 'L'].includes(event.key)) return

      if ($currentColorModel.get() !== 'oklch') return
      // We test if document.activeElement?.tagName is an input because we don't want to trigger this code if user type "c" while he's in one of them.
      if ($uiMessage.get().show || document.activeElement?.tagName === 'INPUT') return
      if (!$colorsRgba.get().parentFill || !$colorsRgba.get().fill || $currentFillOrStroke.get() === 'stroke') return

      handleLockContrast()
    })
  }, [])

  return (
    <div
      className={
        'c-contrast-input c-single-input-with-lock c-single-input-with-lock--with-select u-my-10' +
        (isContrastInputOpen ? '' : ' u-display-none') +
        ((!colorsRgba.parentFill || !colorsRgba.fill || currentFillOrStroke === 'stroke') && !$uiMessage.get().show
          ? ' c-single-input-with-lock--deactivated'
          : '')
      }
    >
      <div className="select-wrapper u-flex-basis-62">
        <select ref={contrastMethodSelect} onChange={handleContrastMethod} name="contrast_method" id="contrast_method">
          <option value="apca" selected={currentContrastMethod === 'apca'}>
            APCA
          </option>
          <option value="wcag" selected={currentContrastMethod === 'wcag'}>
            WCAG
          </option>
        </select>
      </div>

      <BgOrFgToggle />

      <div className="input-wrapper c-single-input-with-lock__input-wrapper">
        <input
          ref={input}
          onClick={selectInputContent}
          onBlur={(e) => {
            handleInputOnBlur(e, lastKeyPressed)
          }}
          onKeyDown={(e) => {
            handleInputOnKeyDown(e, lastKeyPressed, keepInputSelected)
          }}
        />
      </div>

      <div className="c-single-input-with-lock__lock-wrapper" onClick={handleLockContrast}>
        <div className={'c-single-input-with-lock__lock' + (lockContrast ? ' c-single-input-with-lock__lock--closed' : '')}>
          {!lockContrast ? <OpenLockIcon /> : <ClosedLockIcon />}
        </div>
      </div>
    </div>
  )
}
