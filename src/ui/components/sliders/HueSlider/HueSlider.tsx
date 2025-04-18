import { useEffect, useRef } from 'react'
import { consoleLogInfos, SLIDER_SIZE } from '../../../../constants'
import { useStore } from '@nanostores/react'
import limitMouseManipulatorPosition from '../../../helpers/limitMouseManipulatorPosition/limitMouseManipulatorPosition'
import { $colorHxya, setColorHxyaWithSideEffects } from '../../../stores/colors/colorHxya/colorHxya'
import { setMouseEventCallback } from '../../../stores/mouseEventCallback/mouseEventCallback'
import getColorHxyDecimals from '../../../helpers/colors/getColorHxyDecimals/getColorHxyDecimals'
import round from 'lodash/round'
import { $oklchRenderMode } from '../../../stores/oklchRenderMode/oklchRenderMode'
import convertRelativeChromaToAbsolute from '../../../helpers/colors/convertRelativeChromaToAbsolute/convertRelativeChromaToAbsolute'
import { $currentColorModel } from '../../../stores/colors/currentColorModel/currentColorModel'
import getLinearMappedValue from '../../../helpers/getLinearMappedValue/getLinearMappedValue'

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

    const newHValue = round(limitMouseManipulatorPosition(canvasY / SLIDER_SIZE) * 360, getColorHxyDecimals().h)

    if ($currentColorModel.get() !== 'oklch') {
      setColorHxyaWithSideEffects({
        newColorHxya: {
          h: round(limitMouseManipulatorPosition(canvasY / SLIDER_SIZE) * 360, getColorHxyDecimals().h)
        }
      })
    } else {
      if ($oklchRenderMode.get() === 'triangle') {
        setColorHxyaWithSideEffects({
          newColorHxya: {
            h: newHValue
          }
        })
      } else if ($oklchRenderMode.get() === 'square') {
        const newXValue = convertRelativeChromaToAbsolute({
          h: newHValue,
          y: $colorHxya.get().y
        })

        setColorHxyaWithSideEffects({
          newColorHxya: {
            x: newXValue,
            h: newHValue
          },
          sideEffects: {
            syncRelativeChroma: false
          }
        })
      }
    }
  }

  useEffect(() => {
    const xPosition = getLinearMappedValue({
      valueToMap: $colorHxya.get().h,
      originalRange: { min: 0, max: 360 },
      targetRange: { min: -1, max: SLIDER_SIZE }
    })

    manipulatorHueSlider.current!.transform.baseVal.getItem(0).setTranslate(xPosition, -1)
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
        <svg ref={manipulatorHueSlider} transform="translate(0,0)" width="18" height="18">
          <circle cx="9" cy="9" r="5.3" fill="none" strokeWidth="4.6" stroke="#555555"></circle>
          <circle cx="9" cy="9" r="5.3" fill="none" strokeWidth="4" stroke="#ffffff"></circle>
        </svg>
      </div>
    </div>
  )
}
