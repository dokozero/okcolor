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
  updateColorHxyaAndSyncColorsRgbaAndPlugin
} from '../../../store'
import { useStore } from '@nanostores/react'
import convertRelativeChromaToAbsolute from '../../../helpers/convertRelativeChromaToAbsolute'
import sendMessageToBackend from '../../../helpers/sendMessageToBackend'
import { RelativeChroma, SyncLockRelativeChromaData } from '../../../../types'

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

  updateColorHxyaAndSyncColorsRgbaAndPlugin({ newColorHxya: { x: newColorX }, bypassLockRelativeChromaFilter: true })
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
    <div className={(showRelativeChroma ? '' : 'u-visibility-hidden u-position-absolute ') + 'c-single-input-with-lock'}>
      <p>Relative chroma</p>
      <div className="input-wrapper c-single-input-with-lock__input-wrapper u-ml-auto">
        <input ref={input} onClick={selectInputContent} onBlur={handleInputOnBlur} onKeyDown={handleInputOnKeyDown} />
      </div>

      <div className="c-single-input-with-lock__lock-wrapper" onClick={handleLockRelativeChroma}>
        <div className={'c-single-input-with-lock__lock' + (lockRelativeChroma ? ' c-single-input-with-lock__lock--closed' : '')}>
          <svg width="14" height="14" viewBox="0 0 14 14" xmlns="http://www.w3.org/2000/svg">
            {!lockRelativeChroma ? (
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M8 5V6H8.5C8.776 6 9 6.224 9 6.5V11.5C9 11.776 8.776 12 8.5 12H2.5C2.224 12 2 11.776 2 11.5V6.5C2 6.224 2.224 6 2.5 6H7V3.5C7 2.12 8.12 1 9.5 1C10.88 1 12 2.12 12 3.5V5H11V3.5C11 2.672 10.328 2 9.5 2C8.672 2 8 2.672 8 3.5V5Z"
              />
            ) : (
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M7 4.5V6H4V4.5C4 3.672 4.672 3 5.5 3C6.328 3 7 3.672 7 4.5ZM3 6V4.5C3 3.12 4.12 2 5.5 2C6.88 2 8 3.12 8 4.5V6H8.5C8.776 6 9 6.224 9 6.5V11.5C9 11.776 8.776 12 8.5 12H2.5C2.224 12 2 11.776 2 11.5V6.5C2 6.224 2.224 6 2.5 6H3Z"
              />
            )}
          </svg>
        </div>
      </div>
    </div>
  )
}
