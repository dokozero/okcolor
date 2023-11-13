import { consoleLogInfos } from '../../../constants'
import { useStore } from '@nanostores/react'
import { CurrentColorModel } from '../../../types'
import { $currentColorModel, setCurrentColorModelWithSideEffects } from '../../stores/colors/currentColorModel/currentColorModel'

const handleColorModel = (event: { target: HTMLSelectElement }) => {
  setCurrentColorModelWithSideEffects({ newCurrentColorModel: event.target.value as CurrentColorModel })
}

export default function ColorModelSelect() {
  if (consoleLogInfos.includes('Component renders')) {
    console.log('Component render — ColorModelSelect')
  }

  const currentColorModel = useStore($currentColorModel)

  return (
    <div className="select-wrapper u-flex-no-shrink u-flex-basis-60">
      <select onChange={handleColorModel} name="color_model" id="color_model">
        <option value="oklch" selected={currentColorModel === 'oklch' ? true : false}>
          OkLCH
        </option>
        <option value="okhsl" selected={currentColorModel === 'okhsl' ? true : false}>
          OkHSL
        </option>
        <option value="okhsv" selected={currentColorModel === 'okhsv' ? true : false}>
          OkHSV
        </option>
      </select>
    </div>
  )
}
