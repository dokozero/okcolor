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
  const bgToggle = useRef<HTMLDivElement>(null)
  const fgToggle = useRef<HTMLDivElement>(null)
  const bgToggleText = useRef<HTMLDivElement>(null)
  const fgToggleText = useRef<HTMLDivElement>(null)

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

    if (!colorsRgba.parentFill || !colorsRgba.fill) {
      bgOrFgToggle.current!.style.backgroundColor = ''
      return
    }

    bgToggle.current!.style.backgroundColor = `rgb(${colorsRgba.parentFill.r * 255}, ${colorsRgba.parentFill.g * 255}, ${
      colorsRgba.parentFill.b * 255
    })`
    fgToggle.current!.style.backgroundColor = `rgb(${colorsRgba.fill.r * 255}, ${colorsRgba.fill.g * 255}, ${colorsRgba.fill.b * 255})`

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

    if (Math.abs(whiteTextContrast) > Math.abs(blackTextContrast)) bgToggleText.current!.style.color = '#FFFFFF'
    else bgToggleText.current!.style.color = '#000000'

    // Define color of Fg toggle label
    whiteTextContrast = getContrastFromBgandFgRgba({
      fg: { r: 1, g: 1, b: 1, a: 1 },
      bg: colorsRgba.fill
    })
    blackTextContrast = getContrastFromBgandFgRgba({
      fg: { r: 0, g: 0, b: 0, a: 1 },
      bg: colorsRgba.fill
    })

    if (Math.abs(whiteTextContrast) > Math.abs(blackTextContrast)) fgToggleText.current!.style.color = '#FFFFFF'
    else fgToggleText.current!.style.color = '#000000'
  }, [colorsRgba, currentColorModel])

  useEffect(() => {
    if ($currentFillOrStroke.get() === 'stroke') return

    let outlineLightness: Lightness = 80

    if (document.documentElement.classList.contains('figma-dark')) {
      outlineLightness = 50
    }

    const toggleOutlineColor = convertHxyToRgb({
      colorHxy: {
        h: $colorHxya.get().h,
        x: $colorHxya.get().x,
        y: outlineLightness
      }
    })

    if (currentBgOrFg === 'bg') {
      fgToggle.current!.style.outlineColor = 'transparent'
      bgToggle.current!.style.outlineColor = `rgb(${toggleOutlineColor.r * 255}, ${toggleOutlineColor.g * 255}, ${toggleOutlineColor.b * 255})`
    } else {
      bgToggle.current!.style.outlineColor = 'transparent'
      fgToggle.current!.style.outlineColor = `rgb(${toggleOutlineColor.r * 255}, ${toggleOutlineColor.g * 255}, ${toggleOutlineColor.b * 255})`
    }
  }, [currentBgOrFg, colorHxya])

  useEffect(() => {
    document.addEventListener('keydown', (event) => {
      if (!['oklch', 'oklchCss'].includes($currentColorModel.get())) return
      // We test if document.activeElement?.tagName is an input because we don't want to trigger this code if user type "c" while he's in one of them.
      if ($uiMessage.get().show || document.activeElement?.tagName === 'INPUT') return
      if (!$colorsRgba.get().parentFill || !$colorsRgba.get().fill || $currentFillOrStroke.get() === 'stroke') return

      if (['b', 'B', 'f', 'F'].includes(event.key)) handleBgOrFgToggle()
    })
  }, [])

  return (
    <div
      ref={bgOrFgToggle}
      className={'c-bg-or-fg-toggle u-ml-auto ' + (!colorsRgba.parentFill || !colorsRgba.fill ? 'u-visibility-hidden' : '')}
      onClick={handleBgOrFgToggle}
    >
      <div ref={bgToggle} className="c-bg-or-fg-toggle__element">
        <div
          ref={bgToggleText}
          className={'c-bg-or-fg-toggle__element-label' + (currentBgOrFg === 'bg' ? ' c-bg-or-fg-toggle__element-label--active' : '')}
        >
          Bg
        </div>
      </div>

      <div ref={fgToggle} className="c-bg-or-fg-toggle__element">
        <div
          ref={fgToggleText}
          className={'c-bg-or-fg-toggle__element-label' + (currentBgOrFg === 'fg' ? ' c-bg-or-fg-toggle__element-label--active' : '')}
        >
          Fg
        </div>
      </div>
    </div>
  )
}
