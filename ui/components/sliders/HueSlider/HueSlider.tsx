import { useEffect, useRef } from 'react'

import { consoleLogInfos, SLIDER_SIZE } from '../../../../constants'
import { limitMouseHandlerValue, roundWithDecimal } from '../../../helpers/others'
import { $currentColorModel, $colorHxya, $lockRelativeChroma, $colorValueDecimals, updateColorHxya, $mouseEventCallback } from '../../../store'
import { useStore } from '@nanostores/react'
import getClampedChroma from '../../../helpers/getClampedChroma'
import convertRelativeChromaToAbsolute from '../../../helpers/convertRelativeChromaToAbsolute'

export default function HueSlider() {
  if (consoleLogInfos.includes('Component renders')) {
    console.log('Component render — HueSlider')
  }

  const colorHxya = useStore($colorHxya)

  const hueSlider = useRef<HTMLDivElement>(null)
  const manipulatorHueSlider = useRef<SVGSVGElement>(null)

  const handleNewManipulatorPosition = (event: MouseEvent) => {
    const rect = hueSlider.current!.getBoundingClientRect()
    const canvasY = event.clientX - rect.left - 7

    const newColorHxya = {
      h: roundWithDecimal(limitMouseHandlerValue(canvasY / SLIDER_SIZE) * 360, $colorValueDecimals.get()!.h),
      x: $colorHxya.get().x
    }

    if ($lockRelativeChroma.get()) {
      newColorHxya.x = convertRelativeChromaToAbsolute({
        colorHxy: {
          h: newColorHxya.h,
          x: $colorHxya.get().x,
          y: $colorHxya.get().y
        }
      })
    } else {
      if (['oklch', 'oklchCss'].includes($currentColorModel.get()!)) {
        newColorHxya.x = getClampedChroma({ h: newColorHxya.h, x: $colorHxya.get().x, y: $colorHxya.get().y })
      }
    }

    updateColorHxya(newColorHxya)
  }

  useEffect(() => {
    if (colorHxya.h === null) return

    manipulatorHueSlider.current!.transform.baseVal.getItem(0).setTranslate(SLIDER_SIZE * ($colorHxya.get().h! / 360) - 1, -1)
  }, [colorHxya.h])

  useEffect(() => {
    hueSlider.current!.addEventListener('mousedown', () => {
      $mouseEventCallback.set(handleNewManipulatorPosition)
    })
  }, [])

  return (
    <div className="c-slider">
      <div className="c-slider__canvas c-slider__canvas--hue-bg-img">
        <div ref={hueSlider} className="u-w-full u-h-full" id="okhxy-h-slider"></div>
      </div>

      <div className="c-slider__handler">
        <svg ref={manipulatorHueSlider} transform="translate(0,0)" width="14" height="14">
          <circle cx="7" cy="7" r="4.8" fill="none" strokeWidth="2.8" stroke="#555555"></circle>
          <circle cx="7" cy="7" r="4.8" fill="none" strokeWidth="2.5" stroke="#ffffff"></circle>
        </svg>
      </div>
    </div>
  )
}
