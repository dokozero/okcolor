import { useEffect, useRef, useState } from 'react'
import { consoleLogInfos } from '../../../../constants'
import { useStore } from '@nanostores/react'
import selectInputContent from '../../../helpers/selectInputContent/selectInputContent'
import { $currentColorModel } from '../../../stores/colors/currentColorModel/currentColorModel'
import { setLockRelativeChromaWithSideEffects, $lockRelativeChroma } from '../../../stores/colors/lockRelativeChroma/lockRelativeChroma'
import { $relativeChroma } from '../../../stores/colors/relativeChroma/relativeChroma'
import { $uiMessage } from '../../../stores/uiMessage/uiMessage'
import handleInputOnBlur from './helpers/handleInputOnBlur/handleInputOnBlur'
import handleInputOnKeyDown from './helpers/handleInputOnKeyDown/handleInputOnKeyDown'
import ClosedLockIcon from '../../icons/ClosedLockIcon/ClosedLockIcon'
import OpenLockIcon from '../../icons/OpenLockIcon/OpenLockIcon'

const handleLockRelativeChroma = () => {
  setLockRelativeChromaWithSideEffects({ newLockRelativeChroma: !$lockRelativeChroma.get() })
}

export default function RelativeChromaInput() {
  if (consoleLogInfos.includes('Component renders')) {
    console.log('Component render — RelativeChromaInput')
  }

  const relativeChroma = useStore($relativeChroma)
  const currentColorModel = useStore($currentColorModel)
  const lockRelativeChroma = useStore($lockRelativeChroma)

  const [showRelativeChroma, setShowRelativeChroma] = useState<boolean | undefined>(undefined)

  const input = useRef<HTMLInputElement>(null)

  const lastKeyPressed = useRef('')
  const keepInputSelected = useRef(false)

  useEffect(() => {
    setShowRelativeChroma(currentColorModel === 'oklch' ? true : false)
  }, [currentColorModel])

  useEffect(() => {
    if ($currentColorModel.get() !== 'oklch') return

    input.current!.value = relativeChroma + '%'

    if (keepInputSelected.current) {
      input.current!.select()
      keepInputSelected.current = false
    }
  }, [relativeChroma])

  useEffect(() => {
    document.addEventListener('keydown', (event) => {
      if ($currentColorModel.get() !== 'oklch') return

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

      {/* TODO - refactor to standalone component. */}
      <div className="c-single-input-with-lock__lock-wrapper" onClick={handleLockRelativeChroma}>
        <div className={'c-single-input-with-lock__lock' + (lockRelativeChroma ? ' c-single-input-with-lock__lock--closed' : '')}>
          {!lockRelativeChroma ? <OpenLockIcon /> : <ClosedLockIcon />}
        </div>
      </div>
    </div>
  )
}
