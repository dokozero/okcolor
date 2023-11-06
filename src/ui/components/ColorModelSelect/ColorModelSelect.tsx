import { useRef } from 'react'
import { consoleLogInfos } from '../../../constants'
import { useStore } from '@nanostores/react'
import { CurrentColorModel } from '../../../types'
import { $currentColorModel, setCurrentColorModelWithSideEffects } from '../../stores/colors/currentColorModel/currentColorModel'

export default function ColorModelSelect() {
  if (consoleLogInfos.includes('Component renders')) {
    console.log('Component render — ColorModelSelect')
  }

  const colorModelSelect = useRef<HTMLSelectElement>(null)
  const currentColorModel = useStore($currentColorModel)

  const handleColorModel = (event: { target: HTMLSelectElement }) => {
    setCurrentColorModelWithSideEffects({ newCurrentColorModel: event.target.value as CurrentColorModel })
  }

  return (
    <div className="select-wrapper c-select-input-controls__select-wrapper">
      <select ref={colorModelSelect} onChange={handleColorModel} name="color_model" id="color_model">
        <option value="okhsv" selected={currentColorModel === 'okhsv' ? true : false}>
          OkHSV
        </option>
        <option value="okhsl" selected={currentColorModel === 'okhsl' ? true : false}>
          OkHSL
        </option>
        <option value="oklch" selected={currentColorModel === 'oklch' ? true : false}>
          OkLCH
        </option>
        <option value="oklchCss" selected={currentColorModel === 'oklchCss' ? true : false}>
          OkLCH (CSS)
        </option>
      </select>
    </div>
  )
}
