import { useEffect, useRef, useState } from 'react'
import { selectInputContent } from '../../../helpers/others'
import { consoleLogInfos } from '../../../../constants'
import {
  $lockContrast,
  $colorsRgba,
  $contrast,
  $currentColorModel,
  $currentKeysPressed,
  $fileColorProfile,
  $isMouseInsideDocument,
  $updateParent,
  updateColorHxyaAndSyncColorsRgbaAndBackend,
  $uiMessage,
  $colorHxya,
  $currentFillOrStroke
} from '../../../store'
import { useStore } from '@nanostores/react'
import convertRgbToHxy from '../../../helpers/convertRgbToHxy'
import { ApcaContrast, ColorRgb, ColorRgba, Opacity, SyncLockContrastData } from '../../../../types'
import { APCAcontrast, displayP3toY, sRGBtoY } from 'apca-w3'
import convertContrastToLightness from '../../../helpers/convertContrastToLightness'
import sendMessageToBackend from '../../../helpers/sendMessageToBackend'

let lastKeyPressed: string = ''
let keepInputSelected = false

const updateColorHxyaXandY = (eventTarget: HTMLInputElement, newContrast: ApcaContrast) => {
  if (newContrast < -108 || newContrast > 106 || newContrast === $contrast.get()) {
    eventTarget.value = String($contrast.get())
    return
  }

  const newHxy = convertContrastToLightness($colorHxya.get(), newContrast)

  updateColorHxyaAndSyncColorsRgbaAndBackend({ newColorHxya: newHxy, bypassLockContrastFilter: true })
}

export default function ContrastInput() {
  if (consoleLogInfos.includes('Component renders')) {
    console.log('Component render — ContrastInput')
  }

  const colorsRgba = useStore($colorsRgba)
  const contrast = useStore($contrast)
  const lockContrast = useStore($lockContrast)
  const updateParent = useStore($updateParent)
  const currentColorModel = useStore($currentColorModel)
  const currentFillOrStroke = useStore($currentFillOrStroke)

  const [showContrast, setShowContrast] = useState<boolean | undefined>(undefined)

  const bgToggle = useRef<HTMLDivElement>(null)
  const bgToggleText = useRef<HTMLDivElement>(null)
  const input = useRef<HTMLInputElement>(null)

  const handleInputOnBlur = (event: React.FocusEvent<HTMLInputElement>) => {
    const eventTarget = event.target

    if (lastKeyPressed === 'Escape' || (!$isMouseInsideDocument.get() && !['Enter', 'Tab'].includes(lastKeyPressed))) {
      eventTarget.value = String(contrast)
      return
    } else {
      lastKeyPressed = ''
    }

    updateColorHxyaXandY(eventTarget, parseInt(eventTarget.value))
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

      if (eventKey === 'ArrowUp') {
        if (newValue === 0) newValue = 7
        else newValue += stepUpdateValue
      } else if (eventKey === 'ArrowDown') {
        if (newValue === 0) newValue = -7
        else newValue -= stepUpdateValue
      }

      if (newValue > -7 && newValue < 7 && newValue !== 0) newValue = 0

      updateColorHxyaXandY(eventTarget, newValue)
    }
  }

  const handleUpdateParentSelector = () => {
    $updateParent.set(!$updateParent.get())

    let newColorRgba: ColorRgb | ColorRgba
    let opacity: Opacity = 100

    if ($updateParent.get()) {
      newColorRgba = $colorsRgba.get().parentFill!
    } else {
      newColorRgba = $colorsRgba.get().fill!
      opacity = $colorsRgba.get().fill!.a
    }

    const newColorHxy = convertRgbToHxy({
      colorRgb: {
        r: newColorRgba.r,
        g: newColorRgba.g,
        b: newColorRgba.b
      },
      targetColorModel: $currentColorModel.get(),
      fileColorProfile: $fileColorProfile.get()
    })

    updateColorHxyaAndSyncColorsRgbaAndBackend({
      newColorHxya: { ...newColorHxy, a: opacity },
      syncColorsRgba: false,
      syncColorRgbWithBackend: false
    })

    bgToggle.current!.style.outlineOffset = '2px'

    if ($updateParent.get()) bgToggle.current!.style.outline = '1px solid black'
    else bgToggle.current!.style.outline = '0px'
  }

  const handleLockContrast = () => {
    const newValue = !$lockContrast.get()

    $lockContrast.set(newValue)

    // To avoid getting relative chroma and contrast locked at the same time, which would block the color picker and the hxya inputs
    // if ($lockRelativeChroma.get() && $lockContrast.get()) $lockRelativeChroma.set(false)

    sendMessageToBackend<SyncLockContrastData>({
      type: 'syncLockContrast',
      data: {
        lockContrast: newValue
      }
    })
  }

  useEffect(() => {
    if (['okhsv', 'okhsl'].includes($currentColorModel.get())) return

    if (!colorsRgba.parentFill || !colorsRgba.fill) {
      bgToggle.current!.style.background = 'none'
      input.current!.value = '-'

      // If the user select a new shape that doesn't have a parent fill and he had the lockContrast on, we need to set it to false to avoid having the lock on when ContrastInput is deactivated.
      if ($lockContrast.get()) $lockContrast.set(false)
      return
    } else {
      input.current!.value = String($contrast.get())
    }

    bgToggle.current!.style.background = `rgb(${colorsRgba.parentFill.r}, ${colorsRgba.parentFill.g}, ${colorsRgba.parentFill.b})`

    let whiteTextContrast: string | ApcaContrast = 0
    let blackTextContrast: string | ApcaContrast = 0

    if ($fileColorProfile.get() === 'rgb') {
      whiteTextContrast = APCAcontrast(sRGBtoY([255, 255, 255]), sRGBtoY([colorsRgba.parentFill.r, colorsRgba.parentFill.g, colorsRgba.parentFill.b]))

      blackTextContrast = APCAcontrast(sRGBtoY([0, 0, 0]), sRGBtoY([colorsRgba.parentFill.r, colorsRgba.parentFill.g, colorsRgba.parentFill.b]))
    } else if ($fileColorProfile.get() === 'p3') {
      whiteTextContrast = APCAcontrast(
        displayP3toY([1, 1, 1]),
        displayP3toY([colorsRgba.parentFill.r / 255, colorsRgba.parentFill.g / 255, colorsRgba.parentFill.b / 255])
      )

      blackTextContrast = APCAcontrast(
        displayP3toY([0, 0, 0]),
        displayP3toY([colorsRgba.parentFill.r / 255, colorsRgba.parentFill.g / 255, colorsRgba.parentFill.b / 255])
      )
    }

    if (typeof whiteTextContrast === 'string') whiteTextContrast = parseInt(whiteTextContrast)
    if (typeof blackTextContrast === 'string') blackTextContrast = parseInt(blackTextContrast)

    if (Math.abs(whiteTextContrast) > Math.abs(blackTextContrast)) bgToggleText.current!.style.color = '#FFFFFF'
    else bgToggleText.current!.style.color = '#000000'
  }, [colorsRgba, currentColorModel])

  useEffect(() => {
    input.current!.value = String(contrast)

    if (keepInputSelected) {
      input.current!.select()
      keepInputSelected = false
    }
  }, [contrast])

  useEffect(() => {
    if (updateParent) bgToggle.current!.style.outline = '1px solid black'
    else bgToggle.current!.style.outline = '0px'
  }, [updateParent])

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
      if (['b', 'B'].includes(event.key)) handleUpdateParentSelector()
    })
  }, [])

  return (
    <div
      className={
        (showContrast ? '' : 'u-visibility-hidden u-position-absolute ') +
        ((!colorsRgba.parentFill || !colorsRgba.fill || currentFillOrStroke === 'stroke') && !$uiMessage.get().show
          ? 'u-pointer-events-none u-opacity-50 '
          : '') +
        'c-single-input-with-lock'
      }
    >
      <p>APCA contrast</p>

      <div
        ref={bgToggle}
        className={(!colorsRgba.parentFill || !colorsRgba.fill ? 'u-visibility-hidden ' : '') + 'u-ml-auto'}
        onClick={handleUpdateParentSelector}
        style={{ padding: '3px', border: '1px solid #DDDDDD' }}
      >
        <div ref={bgToggleText} style={{ fontSize: '11px' }}>
          Bg
        </div>
      </div>

      <div className="input-wrapper c-single-input-with-lock__input-wrapper">
        <input ref={input} onClick={selectInputContent} onBlur={handleInputOnBlur} onKeyDown={handleInputOnKeyDown} />
      </div>

      <div className="c-single-input-with-lock__lock-wrapper" onClick={handleLockContrast}>
        <div className={'c-single-input-with-lock__lock' + (lockContrast ? ' c-single-input-with-lock__lock--closed' : '')}>
          <svg width="14" height="14" viewBox="0 0 14 14" xmlns="http://www.w3.org/2000/svg">
            {!lockContrast ? (
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
