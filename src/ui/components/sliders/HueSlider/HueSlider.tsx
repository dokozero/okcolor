import { useEffect, useRef } from 'react'
import { consoleLogInfos, SLIDER_SIZE } from '../../../../constants'
import { useStore } from '@nanostores/react'
import limitMouseManipulatorPosition from '../../../helpers/limitMouseManipulatorPosition/limitMouseManipulatorPosition'
import { $colorHxya, setColorHxyaWithSideEffects } from '../../../stores/colors/colorHxya/colorHxya'
import { setMouseEventCallback } from '../../../stores/mouseEventCallback/mouseEventCallback'
import getColorHxyDecimals from '../../../helpers/colors/getColorHxyDecimals/getColorHxyDecimals'
import round from 'lodash/round'

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

    setColorHxyaWithSideEffects({
      newColorHxya: {
        h: round(limitMouseManipulatorPosition(canvasY / SLIDER_SIZE) * 360, getColorHxyDecimals().h)
      }
    })
  }

  useEffect(() => {
    manipulatorHueSlider.current!.transform.baseVal.getItem(0).setTranslate(SLIDER_SIZE * ($colorHxya.get().h / 360) - 1, -1)
  }, [colorHxya.h])

  useEffect(() => {
    hueSlider.current!.addEventListener('mousedown', () => {
      setMouseEventCallback(handleNewManipulatorPosition)
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
