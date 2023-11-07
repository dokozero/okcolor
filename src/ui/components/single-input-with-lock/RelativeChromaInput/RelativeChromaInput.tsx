import { useEffect, useRef, useState } from 'react'
import { consoleLogInfos } from '../../../../constants'
import { useStore } from '@nanostores/react'
import selectInputContent from '../../../helpers/selectInputContent/selectInputContent'
import { $currentColorModel } from '../../../stores/colors/currentColorModel/currentColorModel'
import { setLockRelativeChromaWithSideEffects, $lockRelativeChroma } from '../../../stores/colors/lockRelativeChroma/lockRelativeChroma'
import { $relativeChroma, setRelativeChromaWithSideEffects } from '../../../stores/colors/relativeChroma/relativeChroma'
import { $currentKeysPressed } from '../../../stores/currentKeysPressed/currentKeysPressed'
import { $isMouseInsideDocument } from '../../../stores/isMouseInsideDocument/isMouseInsideDocument'
import { $uiMessage } from '../../../stores/uiMessage/uiMessage'
import ClosedLockIcon from '../ClosedLockIcon/ClosedLockIcon'
import OpenLockIcon from '../OpenLockIcon/OpenLockIcon'
import clamp from 'lodash/clamp'

let lastKeyPressed: string = ''
let keepInputSelected = false

const handleLockRelativeChroma = () => {
  setLockRelativeChromaWithSideEffects({ newLockRelativeChroma: !$lockRelativeChroma.get() })
}

export default function RelativeChromaInput() {
  if (consoleLogInfos.includes('Component renders')) {
    console.log('Component render — RelativeChromaInput')
  }

  const input = useRef<HTMLInputElement>(null)

  const relativeChroma = useStore($relativeChroma)
  const currentColorModel = useStore($currentColorModel)
  const lockRelativeChroma = useStore($lockRelativeChroma)

  const [showRelativeChroma, setShowRelativeChroma] = useState<boolean | undefined>(undefined)

  const handleInputOnBlur = (event: React.FocusEvent<HTMLInputElement>) => {
    const eventTarget = event.target
    const newValue = parseInt(eventTarget.value)

    const clampedNewRelativeChroma = clamp(newValue, 0, 100)

    if (
      clampedNewRelativeChroma === $relativeChroma.get() ||
      lastKeyPressed === 'Escape' ||
      isNaN(newValue) ||
      (!$isMouseInsideDocument.get() && !['Enter', 'Tab'].includes(lastKeyPressed))
    ) {
      eventTarget.value = $relativeChroma.get() + '%'
      return
    } else {
      lastKeyPressed = ''
    }

    setRelativeChromaWithSideEffects({ newRelativeChroma: clampedNewRelativeChroma })
  }

  const handleInputOnKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    const eventKey = event.key
    const eventTarget = event.target as HTMLInputElement

    if (['Enter', 'Tab', 'Escape'].includes(eventKey)) {
      lastKeyPressed = eventKey
      ;(event.target as HTMLInputElement).blur()
    } else if (['ArrowUp', 'ArrowDown'].includes(eventKey)) {
      let newValue = parseInt(eventTarget.value)

      event.preventDefault()
      keepInputSelected = true

      const stepUpdateValue = $currentKeysPressed.get().includes('shift') ? 10 : 1

      if (eventKey === 'ArrowUp') newValue += stepUpdateValue
      else if (eventKey === 'ArrowDown') newValue -= stepUpdateValue

      const clampedNewRelativeChroma = clamp(newValue, 0, 100)
      setRelativeChromaWithSideEffects({ newRelativeChroma: clampedNewRelativeChroma })
    }
  }

  useEffect(() => {
    if (['oklch', 'oklchCss'].includes(currentColorModel)) {
      setShowRelativeChroma(true)
    } else {
      setShowRelativeChroma(false)
    }
  }, [currentColorModel])

  useEffect(() => {
    if (!['oklch', 'oklchCss'].includes($currentColorModel.get())) return

    input.current!.value = relativeChroma + '%'

    if (keepInputSelected) {
      input.current!.select()
      keepInputSelected = false
    }
  }, [relativeChroma])

  useEffect(() => {
    document.addEventListener('keydown', (event) => {
      if (!['oklch', 'oklchCss'].includes($currentColorModel.get())) return

      // We test if document.activeElement?.tagName is an input because we don't want to trigger this code if user type "c" while he's in one of them.
      if ($uiMessage.get().show || document.activeElement?.tagName === 'INPUT') return

      if (['c', 'C'].includes(event.key)) handleLockRelativeChroma()
    })
  }, [])

  return (
    <div
      className={
        'c-single-input-with-lock c-single-input-with-lock--with-label u-mt-6 ' +
        (showRelativeChroma ? '' : 'u-visibility-hidden u-position-absolute')
      }
    >
      <div className="c-single-input-with-lock__label">Relative chroma</div>
      <div className="input-wrapper c-single-input-with-lock__input-wrapper u-ml-auto">
        <input ref={input} onClick={selectInputContent} onBlur={handleInputOnBlur} onKeyDown={handleInputOnKeyDown} />
      </div>

      <div className="c-single-input-with-lock__lock-wrapper" onClick={handleLockRelativeChroma}>
        <div className={'c-single-input-with-lock__lock' + (lockRelativeChroma ? ' c-single-input-with-lock__lock--closed' : '')}>
          {!lockRelativeChroma ? <OpenLockIcon /> : <ClosedLockIcon />}
        </div>
      </div>
    </div>
  )
}
