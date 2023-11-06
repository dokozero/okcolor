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

const opacitysliderBackgroundImg =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAwIAAABUCAYAAAAxg4DPAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAJMSURBVHgB7dlBbQNAEATBcxQky5+Sl4pjAHmdLPnRVQTm3ZrH8/l8nQszc27s7rlhz549e/bs2bNnz569z+39HAAAIEcIAABAkBAAAIAgIQAAAEFCAAAAgoQAAAAECQEAAAgSAgAAECQEAAAgSAgAAECQEAAAgCAhAAAAQUIAAACCHq+3c2F3z42ZOTfs2bNnz549e/bs2bP3uT2PAAAABAkBAAAIEgIAABAkBAAAIEgIAABAkBAAAIAgIQAAAEFCAAAAgoQAAAAECQEAAAgSAgAAECQEAAAgSAgAAEDQ7+6eGzNzbtizZ8+ePXv27NmzZ+/7ex4BAAAIEgIAABAkBAAAIEgIAABAkBAAAIAgIQAAAEFCAAAAgoQAAAAECQEAAAgSAgAAECQEAAAgSAgAAECQEAAAgKDH6+1c2N1zY2bODXv27NmzZ+8/9uzZs2fvbs8jAAAAQUIAAACChAAAAAQJAQAACBICAAAQJAQAACBICAAAQJAQAACAICEAAABBQgAAAIKEAAAABAkBAAAIEgIAABD0u7vnxsycG/bs2bNnz549e/bs2fv+nkcAAACChAAAAAQJAQAACBICAAAQJAQAACBICAAAQJAQAACAICEAAABBQgAAAIKEAAAABAkBAAAIEgIAABAkBAAAIOjxejsXdvfcmJlzw549e/bs2bNnz549e5/b8wgAAECQEAAAgCAhAAAAQUIAAACChAAAAAQJAQAACBICAAAQJAQAACBICAAAQJAQAACAICEAAABBQgAAAIKEAAAABP0BZxb7duWmOFoAAAAASUVORK5CYII='

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
    const opacity = $colorHxya.get().a / 100
    manipulatorOpacitySlider.current!.transform.baseVal.getItem(0).setTranslate(SLIDER_SIZE * opacity - 1, -1)
  }

  const handleNewManipulatorPosition = (event: MouseEvent) => {
    const rect = opacitySlider.current!.getBoundingClientRect()
    const canvasY = event.clientX - rect.left - 7

    setColorHxyaWithSideEffects({
      newColorHxya: {
        a: Math.round(limitMouseManipulatorPosition(canvasY / SLIDER_SIZE) * 100)
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
        colorsRgba[`${$currentFillOrStroke.get()}`]!.r
      }, ${colorsRgba[`${$currentFillOrStroke.get()}`]!.g}, ${
        colorsRgba[`${$currentFillOrStroke.get()}`]!.b
      }, 1) 90%), url(${opacitysliderBackgroundImg})`
    }
  }, [colorsRgba, currentBgOrFg, lockContrast])

  useEffect(() => {
    opacitySlider.current!.addEventListener('mousedown', () => {
      setMouseEventCallback(handleNewManipulatorPosition)
    })
  }, [])

  return (
    <div className={'c-slider u-mt-16' + (currentBgOrFg === 'bg' || lockContrast ? ' c-slider--deactivated' : '')}>
      <div ref={opacitySliderWrapper} className="c-slider__canvas">
        <div ref={opacitySlider} className="u-w-full u-h-full" id="opacity-slider"></div>
      </div>

      <div className="c-slider__manipulator">
        <svg ref={manipulatorOpacitySlider} transform="translate(0,0)" width="14" height="14">
          <circle cx="7" cy="7" r="4.8" fill="none" strokeWidth="2.8" stroke="#555555"></circle>
          <circle cx="7" cy="7" r="4.8" fill="none" strokeWidth="2.5" stroke="#ffffff"></circle>
        </svg>
      </div>
    </div>
  )
}
