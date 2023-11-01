import { useEffect, useRef } from 'react'
import { consoleLogInfos } from '../../../constants'
import { useStore } from '@nanostores/react'
import { $colorsRgba } from '../../stores/colors/colorsRgba'
import { $currentBgOrFg } from '../../stores/contrasts/currentBgOrFg'
import { $currentFillOrStroke, setCurrentFillOrStroke, setCurrentFillOrStrokeWithSideEffects } from '../../stores/currentFillOrStroke'

export default function FillStrokeSelect() {
  if (consoleLogInfos.includes('Component renders')) {
    console.log('Component render — FillStrokeSelect')
  }

  const currentFillOrStroke = useStore($currentFillOrStroke)
  const colorsRgba = useStore($colorsRgba)
  const currentBgOrFg = useStore($currentBgOrFg)

  const fillOrStrokeSelector = useRef<HTMLDivElement>(null)
  const fillOrStrokeSelector_fill = useRef<SVGCircleElement>(null)
  const fillOrStrokeSelector_stroke = useRef<SVGPathElement>(null)

  const updateRenderFillStrokeSelectColor = () => {
    const currentColorRgb = $colorsRgba.get()[`${$currentFillOrStroke.get()}`]

    if (!currentColorRgb) return

    if ($currentFillOrStroke.get() === 'fill') {
      fillOrStrokeSelector_fill.current!.setAttribute('fill', `rgb(${currentColorRgb.r}, ${currentColorRgb.g}, ${currentColorRgb.b})`)
    } else {
      fillOrStrokeSelector_stroke.current!.setAttribute('fill', `rgb(${currentColorRgb.r}, ${currentColorRgb.g}, ${currentColorRgb.b})`)
    }
  }

  const handleFillOrStroke = () => {
    setCurrentFillOrStrokeWithSideEffects({
      newCurrentFillOrStroke: $currentFillOrStroke.get() === 'fill' ? 'stroke' : 'fill'
    })
  }

  useEffect(() => {
    updateRenderFillStrokeSelectColor()

    // If the bg is selected and it has a stroke, we don't want to allow selecting it as in this mode, we just want to update the bg to change the contrast an the border doesn't play a role here.
    // That is why we do this these tests bellow with currentBgOrFg.

    // In case the stroke of the foreground shape was selected and we are now updating the parent, we need to get back to fill.
    if (currentBgOrFg === 'bg' && $currentFillOrStroke.get() === 'stroke') setCurrentFillOrStroke('fill')

    // If the shape has a fill and a stroke (and we are not updating the parent), we allow he user to click on it to toggle, otherwise no.
    if (colorsRgba.fill && colorsRgba.stroke && currentBgOrFg === 'fg') {
      fillOrStrokeSelector.current!.classList.remove('u-pointer-events-none')
    } else {
      fillOrStrokeSelector.current!.classList.add('u-pointer-events-none')
    }

    // For the style, for example if there is no stroke, we set a data attribue to false in order to give it the right style.
    fillOrStrokeSelector.current!.setAttribute('data-has-fill', colorsRgba.fill ? 'true' : 'false')

    if (currentBgOrFg === 'fg') {
      fillOrStrokeSelector.current!.setAttribute('data-has-stroke', colorsRgba.stroke ? 'true' : 'false')
    } else {
      // If we are updating the parent, in all case we want to set this as false.
      fillOrStrokeSelector.current!.setAttribute('data-has-stroke', 'false')
    }

    if (currentBgOrFg === 'bg') {
      fillOrStrokeSelector_fill.current!.setAttribute(
        'fill',
        `rgb(${colorsRgba.parentFill!.r}, ${colorsRgba.parentFill!.g}, ${colorsRgba.parentFill!.b})`
      )
      fillOrStrokeSelector_stroke.current!.setAttribute('fill', 'none')
    } else {
      fillOrStrokeSelector_fill.current!.setAttribute(
        'fill',
        colorsRgba.fill ? `rgb(${colorsRgba.fill.r}, ${colorsRgba.fill.g}, ${colorsRgba.fill.b})` : 'none'
      )
      fillOrStrokeSelector_stroke.current!.setAttribute(
        'fill',
        colorsRgba.stroke ? `rgb(${colorsRgba.stroke.r}, ${colorsRgba.stroke.g}, ${colorsRgba.stroke.b})` : 'none'
      )
    }
  }, [colorsRgba, currentBgOrFg])

  return (
    <div
      className="c-fill-stroke-selector"
      ref={fillOrStrokeSelector}
      onClick={handleFillOrStroke}
      data-has-fill="true"
      data-has-stroke="true"
      data-active={currentFillOrStroke}
    >
      <div className="c-fill-stroke-selector__fill">
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle ref={fillOrStrokeSelector_fill} cx="10" cy="10" r="9.5" fill="#FFFFFF" stroke="#AAAAAA" />
        </svg>
      </div>

      <div className="c-fill-stroke-selector__stroke">
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            ref={fillOrStrokeSelector_stroke}
            d="M15.8 10C15.8 13.2033 13.2033 15.8 10 15.8C6.79675 15.8 4.2 13.2033 4.2 10C4.2 6.79675 6.79675 4.2 10 4.2C13.2033 4.2 15.8 6.79675 15.8 10ZM10 19.5C15.2467 19.5 19.5 15.2467 19.5 10C19.5 4.75329 15.2467 0.5 10 0.5C4.75329 0.5 0.5 4.75329 0.5 10C0.5 15.2467 4.75329 19.5 10 19.5Z"
            fill="#FFFFFF"
            stroke="#AAAAAA"
          />
        </svg>
      </div>
    </div>
  )
}
