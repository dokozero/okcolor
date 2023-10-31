import { useEffect, useRef, useState } from 'react'
import { selectInputContent } from '../../../helpers/others'
import { consoleLogInfos } from '../../../../constants'
import {
  $colorHxya,
  $currentColorModel,
  $currentKeysPressed,
  $isMouseInsideDocument,
  $lockRelativeChroma,
  $relativeChroma,
  $uiMessage,
  updateColorHxyaAndSyncColorsRgbaAndBackend
} from '../../../store'
import { useStore } from '@nanostores/react'
import convertRelativeChromaToAbsolute from '../../../helpers/convertRelativeChromaToAbsolute'
import sendMessageToBackend from '../../../helpers/sendMessageToBackend'
import { RelativeChroma, SyncLockRelativeChromaData } from '../../../../types'
import ClosedLockIcon from '../ContrastInput/ClosedLockIcon'
import OpenLockIcon from '../OpenLockIcon'

let lastKeyPressed: string = ''
let keepInputSelected = false

const updateColorHxyaChroma = (eventTarget: HTMLInputElement, newRelativeChroma: RelativeChroma) => {
  if (newRelativeChroma < 0 || newRelativeChroma > 100 || newRelativeChroma === $relativeChroma.get()) {
    eventTarget.value = $relativeChroma.get() + '%'
    return
  }

  const newColorX = convertRelativeChromaToAbsolute({
    colorHxya: $colorHxya.get(),
    relativeChroma: newRelativeChroma
  })

  // This condition could be true if for example user is updating relative chroma near white of black, in this case we'll have multiple absolute chroma values for the same relative chroma one.
  // In that case we want to update directly the $relativeChroma value or the input would not be updated.
  if (newColorX === $colorHxya.get().x) {
    $relativeChroma.set(newRelativeChroma)
    return
  }

  updateColorHxyaAndSyncColorsRgbaAndBackend({ newColorHxya: { x: newColorX }, bypassLockRelativeChromaFilter: true })
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

    if (lastKeyPressed === 'Escape' || (!$isMouseInsideDocument.get() && !['Enter', 'Tab'].includes(lastKeyPressed))) {
      eventTarget.value = $relativeChroma.get() + '%'
      return
    } else {
      lastKeyPressed = ''
    }

    updateColorHxyaChroma(eventTarget, parseInt(eventTarget.value))
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

      updateColorHxyaChroma(eventTarget, newValue)
    }
  }

  const handleLockRelativeChroma = () => {
    const newValue = !$lockRelativeChroma.get()

    $lockRelativeChroma.set(newValue)

    // To avoid getting relative chroma and contrast locked at the same time, which would block the color picker and the hxya inputs
    // if ($lockContrast.get() && newValue) $lockContrast.set(false)

    sendMessageToBackend<SyncLockRelativeChromaData>({
      type: 'syncLockRelativeChroma',
      data: {
        lockRelativeChroma: newValue
      }
    })
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
