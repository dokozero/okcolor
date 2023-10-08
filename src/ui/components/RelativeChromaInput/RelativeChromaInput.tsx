import { useEffect, useRef, useState } from 'react'
import { selectInputContent } from '../../helpers/others'
import { consoleLogInfos } from '../../../constants'
import {
  $colorHxya,
  $currentColorModel,
  $currentKeysPressed,
  $isMouseInsideDocument,
  $lockRelativeChroma,
  $relativeChroma,
  $uiMessage,
  updateColorHxyaAndSyncColorsRgbaAndPlugin
} from '../../store'
import { useStore } from '@nanostores/react'
import convertRelativeChromaToAbsolute from '../../helpers/convertRelativeChromaToAbsolute'

let lastKeyPressed: string = ''
let keepInputSelected = false

const updateColorHxyaChroma = (eventTarget: HTMLInputElement, newRelativeChroma: number) => {
  if (newRelativeChroma >= 0 && newRelativeChroma <= 100 && newRelativeChroma !== $relativeChroma.get()) {
    const newColorX = convertRelativeChromaToAbsolute({
      colorHxy: { h: $colorHxya.get().h!, x: $colorHxya.get().x, y: $colorHxya.get().y },
      relativeChroma: newRelativeChroma
    })

    // This condition could be true if for example user is updating relative chroma near white of black, in this case we'll have multiple absolute chroma values for the same relative chroma one.
    // In that case we want to update directly the $relativeChroma value or the input would not be updated.
    if (newColorX === $colorHxya.get().x) {
      $relativeChroma.set(newRelativeChroma)
    } else {
      updateColorHxyaAndSyncColorsRgbaAndPlugin({ x: newColorX })
    }
  } else {
    eventTarget.value = $relativeChroma.get() + '%'
  }
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

    if (!$isMouseInsideDocument.get() && !['Enter', 'Tab'].includes(lastKeyPressed)) {
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

    if (['Enter', 'Tab'].includes(eventKey)) {
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

    parent.postMessage(
      {
        pluginMessage: {
          message: 'syncLockRelativeChromaWithPlugin',
          lockRelativeChroma: newValue
        }
      },
      '*'
    )
  }

  useEffect(() => {
    if (['oklch', 'oklchCss'].includes(currentColorModel!)) {
      setShowRelativeChroma(true)
    } else {
      setShowRelativeChroma(false)
      $lockRelativeChroma.set(false)
    }
  }, [currentColorModel])

  useEffect(() => {
    if (!['oklch', 'oklchCss'].includes($currentColorModel.get()!)) return

    input.current!.value = relativeChroma + '%'

    if (keepInputSelected) {
      input.current!.select()
      keepInputSelected = false
    }
  }, [relativeChroma])

  useEffect(() => {
    document.addEventListener('keydown', (event) => {
      // We test if document.activeElement?.tagName is an input because we don't want to trigger this code if user type "c" while he's in one of them.
      if ((event.key === 'c' || event.key === 'C') && !$uiMessage.get().show && document.activeElement?.tagName !== 'INPUT') {
        if (['oklch', 'oklchCss'].includes($currentColorModel.get()!)) {
          handleLockRelativeChroma()
        }
      }
    })
  }, [])

  return (
    <div className={(showRelativeChroma ? '' : 'u-visibility-hidden u-position-absolute ') + 'c-relative-chroma'}>
      <p>Relative chroma</p>
      <div className="input-wrapper">
        <input ref={input} onClick={selectInputContent} onBlur={handleInputOnBlur} onKeyDown={handleInputOnKeyDown} />
      </div>

      <div className="c-relative-chroma__lock-wrapper" onClick={handleLockRelativeChroma}>
        <div className={'c-relative-chroma__lock' + (lockRelativeChroma ? ' c-relative-chroma__lock--closed' : '')}>
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
