import { useRef, useEffect } from 'react'
import { ColorRgb } from '../../../../types'
import { useStore } from '@nanostores/react'
import { consoleLogInfos } from '../../../../constants'
import convertHxyToRgb from '../../../helpers/colors/convertHxyToRgb/convertHxyToRgb'
import getContrastFromBgandFgRgba from '../../../helpers/contrasts/getContrastFromBgandFgRgba/getContrastFromBgandFgRgba'
import { $colorHxya } from '../../../stores/colors/colorHxya/colorHxya'
import { $colorsRgba } from '../../../stores/colors/colorsRgba/colorsRgba'
import { $currentColorModel } from '../../../stores/colors/currentColorModel/currentColorModel'
import { $currentBgOrFg, setCurrentBgOrFgWithSideEffects } from '../../../stores/contrasts/currentBgOrFg/currentBgOrFg'
import { $currentFillOrStroke } from '../../../stores/currentFillOrStroke/currentFillOrStroke'
import { $uiMessage } from '../../../stores/uiMessage/uiMessage'
import { $selectionId } from '../../../stores/selectionId/selectionId'

export default function BgOrFgToggle() {
  if (consoleLogInfos.includes('Component renders')) {
    console.log('Component render — BgOrFgToggle')
  }

  const bgOrFgToggle = useRef<HTMLDivElement>(null)
  const fgToggle = useRef<HTMLDivElement>(null)
  const bgToggle = useRef<HTMLDivElement>(null)
  const fgToggleWrapper = useRef<HTMLDivElement>(null)
  const bgToggleWrapper = useRef<HTMLDivElement>(null)
  const fgTogglelabel = useRef<HTMLDivElement>(null)
  const bgToggleLabel = useRef<HTMLDivElement>(null)

  const selectionId = useStore($selectionId)
  const colorsRgba = useStore($colorsRgba)
  const colorHxya = useStore($colorHxya)
  const currentColorModel = useStore($currentColorModel)
  const currentBgOrFg = useStore($currentBgOrFg)

  const handleBgOrFgToggle = () => {
    if ($currentBgOrFg.get() === 'bg') setCurrentBgOrFgWithSideEffects({ newCurrentBgOrFg: 'fg' })
    else setCurrentBgOrFgWithSideEffects({ newCurrentBgOrFg: 'bg' })
  }

  const updateBgOrFgToggleBackground = (target: 'bg' | 'fg') => {
    if ((target === 'bg' && !$colorsRgba.get().parentFill) || (target === 'fg' && !$colorsRgba.get().fill)) {
      return
    }

    let targetColorRgb: ColorRgb | ColorRgb
    if (target === 'bg') {
      targetColorRgb = { ...$colorsRgba.get().parentFill! }
      bgToggleWrapper.current!.style.backgroundColor = `rgb(${targetColorRgb.r * 255}, ${targetColorRgb.g * 255}, ${targetColorRgb.b * 255})`
    } else {
      targetColorRgb = { ...$colorsRgba.get().fill! }
      fgToggleWrapper.current!.style.backgroundColor = `rgb(${targetColorRgb.r * 255}, ${targetColorRgb.g * 255}, ${targetColorRgb.b * 255})`
    }

    const whiteTextContrast = getContrastFromBgandFgRgba({ fg: { r: 1, g: 1, b: 1, a: 1 }, bg: targetColorRgb, currentContrastMethod: 'apca' })
    const blackTextContrast = getContrastFromBgandFgRgba({ fg: { r: 0, g: 0, b: 0, a: 1 }, bg: targetColorRgb, currentContrastMethod: 'apca' })

    const isWhiteTextContrastHigher = Math.abs(whiteTextContrast) > Math.abs(blackTextContrast)
    if (target === 'bg') bgToggleLabel.current!.style.color = isWhiteTextContrastHigher ? '#FFFFFF' : '#000000'
    else fgTogglelabel.current!.style.color = isWhiteTextContrastHigher ? '#FFFFFF' : '#000000'
  }

  useEffect(() => {
    if (!$colorsRgba.get().parentFill || !$colorsRgba.get().fill) return
    if ($currentFillOrStroke.get() === 'stroke' || currentColorModel !== 'oklch' || $uiMessage.get().show) return

    updateBgOrFgToggleBackground('bg')
    updateBgOrFgToggleBackground('fg')
  }, [selectionId, currentColorModel])

  useEffect(() => {
    if (!colorsRgba.parentFill || !colorsRgba.fill) return
    if ($currentFillOrStroke.get() === 'stroke' || $currentColorModel.get() !== 'oklch' || $uiMessage.get().show) return

    updateBgOrFgToggleBackground($currentBgOrFg.get())
  }, [colorsRgba])

  useEffect(() => {
    if ($currentFillOrStroke.get() === 'stroke' || $currentColorModel.get() !== 'oklch') return

    const toggleBorderColor = convertHxyToRgb({
      colorHxy: {
        h: $colorHxya.get().h,
        x: $colorHxya.get().x,
        y: document.documentElement.classList.contains('figma-dark') ? 60 : 80
      }
    })

    if (currentBgOrFg === 'bg') {
      if (fgToggle.current!.style.borderColor !== 'transparent') fgToggle.current!.style.borderColor = 'transparent'
      bgToggle.current!.style.borderColor = `rgb(${toggleBorderColor.r * 255}, ${toggleBorderColor.g * 255}, ${toggleBorderColor.b * 255})`
    } else {
      if (bgToggle.current!.style.borderColor !== 'transparent') bgToggle.current!.style.borderColor = 'transparent'
      fgToggle.current!.style.borderColor = `rgb(${toggleBorderColor.r * 255}, ${toggleBorderColor.g * 255}, ${toggleBorderColor.b * 255})`
    }
  }, [currentBgOrFg, colorHxya])

  useEffect(() => {
    document.addEventListener('keydown', (event) => {
      if (!['b', 'B', 'f', 'F'].includes(event.key)) return

      if ($currentColorModel.get() !== 'oklch') return
      // We test if document.activeElement?.tagName is an input because we don't want to trigger this code if user type "c" while he's in one of them.
      if ($uiMessage.get().show || document.activeElement?.tagName === 'INPUT') return
      if (!$colorsRgba.get().parentFill || !$colorsRgba.get().fill || $currentFillOrStroke.get() === 'stroke') return

      handleBgOrFgToggle()
    })
  }, [])

  return (
    <div
      ref={bgOrFgToggle}
      className={'c-bg-or-fg-toggle u-ml-auto ' + (!colorsRgba.parentFill || !colorsRgba.fill ? 'u-visibility-hidden' : '')}
      onClick={handleBgOrFgToggle}
    >
      <div ref={bgToggle} className="c-bg-or-fg-toggle__element">
        <div ref={bgToggleWrapper} className="c-bg-or-fg-toggle__element-wrapper">
          <div
            ref={bgToggleLabel}
            className={'c-bg-or-fg-toggle__element-label' + (currentBgOrFg === 'bg' ? ' c-bg-or-fg-toggle__element-label--active' : '')}
          >
            Bg
          </div>
        </div>
      </div>

      <div ref={fgToggle} className="c-bg-or-fg-toggle__element">
        <div ref={fgToggleWrapper} className="c-bg-or-fg-toggle__element-wrapper">
          <div
            ref={fgTogglelabel}
            className={'c-bg-or-fg-toggle__element-label' + (currentBgOrFg === 'fg' ? ' c-bg-or-fg-toggle__element-label--active' : '')}
          >
            Fg
          </div>
        </div>
      </div>
    </div>
  )
}
