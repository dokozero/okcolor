import { useRef, useEffect } from 'react'
import { ApcaContrast, Lightness, WcagContrast } from '../../../../types'
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

  const colorsRgba = useStore($colorsRgba)
  const colorHxya = useStore($colorHxya)
  const currentColorModel = useStore($currentColorModel)
  const currentBgOrFg = useStore($currentBgOrFg)

  const handleBgOrFgToggle = () => {
    if ($currentBgOrFg.get() === 'bg') setCurrentBgOrFgWithSideEffects({ newCurrentBgOrFg: 'fg' })
    else setCurrentBgOrFgWithSideEffects({ newCurrentBgOrFg: 'bg' })
  }

  useEffect(() => {
    if (['okhsv', 'okhsl'].includes(currentColorModel)) return

    if (!colorsRgba.parentFill || !colorsRgba.fill) return

    bgToggleWrapper.current!.style.backgroundColor = `rgb(${colorsRgba.parentFill.r * 255}, ${colorsRgba.parentFill.g * 255}, ${
      colorsRgba.parentFill.b * 255
    })`
    fgToggleWrapper.current!.style.backgroundColor = `rgb(${colorsRgba.fill.r * 255}, ${colorsRgba.fill.g * 255}, ${colorsRgba.fill.b * 255})`

    let whiteTextContrast: ApcaContrast | WcagContrast
    let blackTextContrast: ApcaContrast | WcagContrast

    // Define color of Bg toggle label
    whiteTextContrast = getContrastFromBgandFgRgba({
      fg: { r: 1, g: 1, b: 1, a: 1 },
      bg: colorsRgba.parentFill
    })
    blackTextContrast = getContrastFromBgandFgRgba({
      fg: { r: 0, g: 0, b: 0, a: 1 },
      bg: colorsRgba.parentFill
    })

    if (Math.abs(whiteTextContrast) > Math.abs(blackTextContrast)) bgToggleLabel.current!.style.color = '#FFFFFF'
    else bgToggleLabel.current!.style.color = '#000000'

    // Define color of Fg toggle label
    whiteTextContrast = getContrastFromBgandFgRgba({
      fg: { r: 1, g: 1, b: 1, a: 1 },
      bg: colorsRgba.fill
    })
    blackTextContrast = getContrastFromBgandFgRgba({
      fg: { r: 0, g: 0, b: 0, a: 1 },
      bg: colorsRgba.fill
    })

    if (Math.abs(whiteTextContrast) > Math.abs(blackTextContrast)) fgTogglelabel.current!.style.color = '#FFFFFF'
    else fgTogglelabel.current!.style.color = '#000000'
  }, [colorsRgba, currentColorModel])

  useEffect(() => {
    if ($currentFillOrStroke.get() === 'stroke') return

    let borderLightness: Lightness = 80

    if (document.documentElement.classList.contains('figma-dark')) {
      borderLightness = 60
    }

    const toggleBorderColor = convertHxyToRgb({
      colorHxy: {
        h: $colorHxya.get().h,
        x: $colorHxya.get().x,
        y: borderLightness
      }
    })

    if (currentBgOrFg === 'bg') {
      fgToggle.current!.style.borderColor = 'transparent'
      bgToggle.current!.style.borderColor = `rgb(${toggleBorderColor.r * 255}, ${toggleBorderColor.g * 255}, ${toggleBorderColor.b * 255})`
    } else {
      bgToggle.current!.style.borderColor = 'transparent'
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
