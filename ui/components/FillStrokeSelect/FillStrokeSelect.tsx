import { useEffect, useRef } from 'react'
import { consoleLogInfos } from '../../../constants'
import { $colorHxya, $currentColorModel, $currentFillOrStroke, $fileColorProfile, $colorsRgba } from '../../store'
import { useStore } from '@nanostores/react'
import convertRgbToHxy from '../../helpers/convertRgbToHxy'

export default function FillStrokeSelect() {
  if (consoleLogInfos.includes('Component renders')) {
    console.log('Component render — FillStrokeSelect')
  }

  const currentFillOrStroke = useStore($currentFillOrStroke)
  const colorsRgba = useStore($colorsRgba)
  const colorHxya = useStore($colorHxya)

  const fillOrStrokeSelector = useRef<HTMLDivElement>(null)
  const fillOrStrokeSelector_fill = useRef<SVGCircleElement>(null)
  const fillOrStrokeSelector_stroke = useRef<SVGPathElement>(null)

  const updateRenderFillStrokeSelectColor = () => {
    const currentColorRgb = $colorsRgba.get()[`${$currentFillOrStroke.get()}`]!

    if ($currentFillOrStroke.get() === 'fill') {
      fillOrStrokeSelector_fill.current!.setAttribute('fill', `rgb(${currentColorRgb.r}, ${currentColorRgb.g}, ${currentColorRgb.b})`)
    } else {
      fillOrStrokeSelector_stroke.current!.setAttribute('fill', `rgb(${currentColorRgb.r}, ${currentColorRgb.g}, ${currentColorRgb.b})`)
    }
  }

  const handleFillOrStroke = () => {
    $currentFillOrStroke.set($currentFillOrStroke.get() === 'fill' ? 'stroke' : 'fill')

    const newColorRgba = $colorsRgba.get()[$currentFillOrStroke.get()]!

    const newColorHxy = convertRgbToHxy({
      colorRgb: {
        r: newColorRgba.r,
        g: newColorRgba.g,
        b: newColorRgba.b
      },
      targetColorModel: $currentColorModel.get()!,
      fileColorProfile: $fileColorProfile.get()!
    })

    $colorHxya.set({ ...newColorHxy, a: newColorRgba.a })

    parent.postMessage(
      {
        pluginMessage: {
          message: 'syncCurrentFillOrStroke',
          currentFillOrStroke: $currentFillOrStroke.get()
        }
      },
      '*'
    )
  }

  useEffect(() => {
    updateRenderFillStrokeSelectColor()
  }, [colorHxya])

  useEffect(() => {
    if (colorsRgba.fill && colorsRgba.stroke) {
      fillOrStrokeSelector.current!.classList.remove('u-pointer-events-none')
    } else {
      fillOrStrokeSelector.current!.classList.add('u-pointer-events-none')
    }

    fillOrStrokeSelector.current!.setAttribute('data-has-fill', colorsRgba.fill ? 'true' : 'false')
    fillOrStrokeSelector.current!.setAttribute('data-has-stroke', colorsRgba.stroke ? 'true' : 'false')

    fillOrStrokeSelector_fill.current!.setAttribute(
      'fill',
      colorsRgba.fill ? `rgb(${colorsRgba.fill.r}, ${colorsRgba.fill.g}, ${colorsRgba.fill.b})` : 'none'
    )
    fillOrStrokeSelector_stroke.current!.setAttribute(
      'fill',
      colorsRgba.stroke ? `rgb(${colorsRgba.stroke.r}, ${colorsRgba.stroke.g}, ${colorsRgba.stroke.b})` : 'none'
    )
  }, [colorsRgba])

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
