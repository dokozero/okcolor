import { useRef, useEffect } from 'react'
import { useStore } from '@nanostores/react'
import { consoleLogInfos } from '../../../../constants'
import convertHxyToRgb from '../../../helpers/colors/convertHxyToRgb/convertHxyToRgb'
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
  const fgTogglelabel = useRef<HTMLDivElement>(null)
  const bgToggleLabel = useRef<HTMLDivElement>(null)

  const colorsRgba = useStore($colorsRgba)
  const colorHxya = useStore($colorHxya)
  const currentBgOrFg = useStore($currentBgOrFg)

  const handleBgOrFgToggle = () => {
    if ($currentBgOrFg.get() === 'bg') setCurrentBgOrFgWithSideEffects({ newCurrentBgOrFg: 'fg' })
    else setCurrentBgOrFgWithSideEffects({ newCurrentBgOrFg: 'bg' })
  }

  useEffect(() => {
    if ($currentFillOrStroke.get() === 'stroke' || $currentColorModel.get() !== 'oklch') return

    const bgColor = convertHxyToRgb({
      colorHxy: {
        h: $colorHxya.get().h,
        x: 0.009,
        y: 30
      }
    })

    const textColor = convertHxyToRgb({
      colorHxy: {
        h: $colorHxya.get().h,
        x: 0.06,
        y: document.documentElement.classList.contains('figma-dark') ? 80 : 40
      }
    })

    if (currentBgOrFg === 'bg') {
      if (document.documentElement.classList.contains('figma-dark')) {
        bgToggle.current!.style.backgroundColor = `rgb(${bgColor.r * 255}, ${bgColor.g * 255}, ${bgColor.b * 255})`
        fgToggle.current!.style.backgroundColor = 'unset'
      } else {
        fgToggle.current!.style.backgroundColor = 'var(--figma-color-bg)'
      }

      bgToggleLabel.current!.style.color = `rgb(${textColor.r * 255}, ${textColor.g * 255}, ${textColor.b * 255})`
      fgTogglelabel.current!.style.color = 'var(--figma-color-text-secondary)'
    } else {
      if (document.documentElement.classList.contains('figma-dark')) {
        fgToggle.current!.style.backgroundColor = `rgb(${bgColor.r * 255}, ${bgColor.g * 255}, ${bgColor.b * 255})`
        bgToggle.current!.style.backgroundColor = 'unset'
      } else {
        fgToggle.current!.style.backgroundColor = 'var(--figma-color-bg)'
      }

      fgTogglelabel.current!.style.color = `rgb(${textColor.r * 255}, ${textColor.g * 255}, ${textColor.b * 255})`
      bgToggleLabel.current!.style.color = 'var(--figma-color-text-secondary)'
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
      <div ref={bgToggle} className={'c-bg-or-fg-toggle__element' + (currentBgOrFg === 'bg' ? ' c-bg-or-fg-toggle__element--active' : '')}>
        <div ref={bgToggleLabel} className="c-bg-or-fg-toggle__element-label">
          Bg
        </div>
      </div>

      <div ref={fgToggle} className={'c-bg-or-fg-toggle__element' + (currentBgOrFg === 'fg' ? ' c-bg-or-fg-toggle__element--active' : '')}>
        <div
          ref={fgTogglelabel}
          className={'c-bg-or-fg-toggle__element-label' + (currentBgOrFg === 'fg' ? ' c-bg-or-fg-toggle__element-label--active' : '')}
        >
          Fg
        </div>
      </div>
    </div>
  )
}
