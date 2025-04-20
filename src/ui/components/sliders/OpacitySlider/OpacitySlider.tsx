import { useRef, useEffect } from 'react'
import { SLIDER_SIZE, consoleLogInfos } from '../../../../constants'
import { useStore } from '@nanostores/react'
import limitMouseManipulatorPosition from '../../../helpers/limitMouseManipulatorPosition/limitMouseManipulatorPosition'
import { $colorHxya, setColorHxyaWithSideEffects } from '../../../stores/colors/colorHxya/colorHxya'
import { $colorsRgba } from '../../../stores/colors/colorsRgba/colorsRgba'
import { $currentBgOrFg } from '../../../stores/contrasts/currentBgOrFg/currentBgOrFg'
import { $lockContrast } from '../../../stores/contrasts/lockContrast/lockContrast'
import { $currentFillOrStroke } from '../../../stores/currentFillOrStroke/currentFillOrStroke'
import { setMouseEventCallback } from '../../../stores/mouseEventCallback/mouseEventCallback'
import getLinearMappedValue from '../../../helpers/getLinearMappedValue/getLinearMappedValue'

const opacitysliderBackgroundImg =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAWQAAAAgCAYAAAAlpQLuAAAACXBIWXMAAAsTAAALEwEAmpwYAAABaWlDQ1BEaXNwbGF5IFAzAAB4nHWQvUvDUBTFT6tS0DqIDh0cMolD1NIKdnFoKxRFMFQFq1OafgltfCQpUnETVyn4H1jBWXCwiFRwcXAQRAcR3Zw6KbhoeN6XVNoi3sfl/Ticc7lcwBtQGSv2AijplpFMxKS11Lrke4OHnlOqZrKooiwK/v276/PR9d5PiFlNu3YQ2U9cl84ul3aeAlN//V3Vn8maGv3f1EGNGRbgkYmVbYsJ3iUeMWgp4qrgvMvHgtMunzuelWSc+JZY0gpqhrhJLKc79HwHl4plrbWD2N6f1VeXxRzqUcxhEyYYilBRgQQF4X/8044/ji1yV2BQLo8CLMpESRETssTz0KFhEjJxCEHqkLhz634PrfvJbW3vFZhtcM4v2tpCAzidoZPV29p4BBgaAG7qTDVUR+qh9uZywPsJMJgChu8os2HmwiF3e38M6Hvh/GMM8B0CdpXzryPO7RqFn4Er/QcXKWq8MSlPPgAAATpJREFUeAHt2yFuAmEYBNCfphgCAgEH4P5XAg8IBASDoF1OMJQ0GfFeghs2O2bEJt9sv98/R2C5XI7tdptEx/l8HtfrNcrudrsod7vdxul0irKbzWasVqsoezgcopz++uuvf+KT/l8DgAoGGaCEQQYoYZABShhkgBIGGaCEQQYoYZABShhkgBKz4/EYXerN5/PXL/F4PF6/xGKxiHLvPPOdd73f71FOf/311z/xSf/Z81fyR6eb+uuvf0L/v/f3yQKghEEGKGGQAUoYZIASBhmghEEGKGGQAUoYZIASBhmghNNpp6NRTn/99f///t/TSWBiOl1cr9dRdjpdTJ+bnkNOz7tcLlF2Ol2c3jeRnkPqr7/++ic+6e+TBUAJgwxQwiADlDDIACUMMkAJgwxQwiADlDDIACUMMkCJH64TqqJTPwcKAAAAAElFTkSuQmCC'

export default function OpacitySlider() {
  if (consoleLogInfos.includes('Component renders')) {
    console.log('Component render — OpacitySlider')
  }

  const colorHxya = useStore($colorHxya)
  const colorsRgba = useStore($colorsRgba)
  const currentBgOrFg = useStore($currentBgOrFg)
  const lockContrast = useStore($lockContrast)

  const opacitySliderWrapper = useRef<HTMLDivElement>(null)
  const opacitySlider = useRef<HTMLDivElement>(null)
  const manipulatorOpacitySlider = useRef<SVGSVGElement>(null)

  const updateManipulatorPosition = () => {
    const xPosition = getLinearMappedValue({
      valueToMap: $colorHxya.get().a,
      originalRange: { min: 0, max: 1 },
      targetRange: { min: -1, max: SLIDER_SIZE }
    })

    manipulatorOpacitySlider.current!.transform.baseVal.getItem(0).setTranslate(xPosition, -1)
  }

  const handleNewManipulatorPosition = (event: MouseEvent) => {
    const rect = opacitySlider.current!.getBoundingClientRect()
    const canvasY = event.clientX - rect.left - 7

    setColorHxyaWithSideEffects({
      newColorHxya: {
        a: limitMouseManipulatorPosition(canvasY / SLIDER_SIZE)
      }
    })
  }

  useEffect(() => {
    updateManipulatorPosition()
  }, [colorHxya.a])

  useEffect(() => {
    if (currentBgOrFg === 'bg' || lockContrast) {
      opacitySliderWrapper.current!.style.backgroundImage = `linear-gradient(to right, rgba(255, 255, 255, 0), rgba(0, 0, 0, 1) 90%), url(${opacitysliderBackgroundImg})`
    } else {
      opacitySliderWrapper.current!.style.backgroundImage = `linear-gradient(to right, rgba(255, 255, 255, 0), rgba(${
        colorsRgba[`${$currentFillOrStroke.get()}`]!.r * 255
      }, ${colorsRgba[`${$currentFillOrStroke.get()}`]!.g * 255}, ${
        colorsRgba[`${$currentFillOrStroke.get()}`]!.b * 255
      }, 1) 90%), url(${opacitysliderBackgroundImg})`
    }
  }, [colorsRgba, currentBgOrFg, lockContrast])

  useEffect(() => {
    opacitySlider.current!.addEventListener('mousedown', () => {
      setMouseEventCallback(handleNewManipulatorPosition)
    })
  }, [])

  return (
    <div className={'c-slider u-mt-12' + (currentBgOrFg === 'bg' || lockContrast ? ' c-slider--deactivated' : '')}>
      <div ref={opacitySliderWrapper} className="c-slider__canvas">
        <div ref={opacitySlider} className="u-w-full u-h-full" id="opacity-slider"></div>
      </div>

      <div className="c-slider__manipulator">
        <svg ref={manipulatorOpacitySlider} transform="translate(0,0)" width="18" height="18">
          <circle cx="9" cy="9" r="5.3" fill="none" strokeWidth="4.6" stroke="#555555"></circle>
          <circle cx="9" cy="9" r="5.3" fill="none" strokeWidth="4" stroke="#ffffff"></circle>
        </svg>
      </div>
    </div>
  )
}
