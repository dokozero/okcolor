import { useEffect, useRef } from 'react'

import { consoleLogInfos, SLIDER_SIZE } from '../../../../constants'
import { limitMouseManipulatorPosition, roundWithDecimal } from '../../../helpers/others'
import { $colorHxya, $colorValueDecimals, updateColorHxyaAndSyncColorsRgbaAndBackend, $mouseEventCallback } from '../../../store'
import { useStore } from '@nanostores/react'

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
      h: roundWithDecimal(limitMouseManipulatorPosition(canvasY / SLIDER_SIZE) * 360, $colorValueDecimals.get().h),
      x: $colorHxya.get().x
    }

    updateColorHxyaAndSyncColorsRgbaAndBackend({ newColorHxya: newColorHxya })
  }

  useEffect(() => {
    manipulatorHueSlider.current!.transform.baseVal.getItem(0).setTranslate(SLIDER_SIZE * ($colorHxya.get().h / 360) - 1, -1)
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

      <div className="c-slider__manipulator">
        <svg ref={manipulatorHueSlider} transform="translate(0,0)" width="14" height="14">
          <circle cx="7" cy="7" r="4.8" fill="none" strokeWidth="2.8" stroke="#555555"></circle>
          <circle cx="7" cy="7" r="4.8" fill="none" strokeWidth="2.5" stroke="#ffffff"></circle>
        </svg>
      </div>
    </div>
  )
}
