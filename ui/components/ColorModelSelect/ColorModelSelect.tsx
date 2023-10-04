import { useRef } from 'react'
import { consoleLogInfos } from '../../../constants'
import { $colorHxya, $currentColorModel, $currentFillOrStroke, $fileColorProfile, $colorsRgba } from '../../store'
import { useStore } from '@nanostores/react'
import { CurrentColorModel } from '../../../types'
import convertRgbToHxy from '../../helpers/convertRgbToHxy'

export default function ColorModelSelect() {
  if (consoleLogInfos.includes('Component renders')) {
    console.log('Component render — ColorModelSelect')
  }

  const colorModelSelect = useRef<HTMLSelectElement>(null)
  const currentColorModel = useStore($currentColorModel)

  const handleColorModel = (event: { target: HTMLSelectElement }) => {
    const newCurrentColorModel = event.target.value as CurrentColorModel

    $currentColorModel.set(newCurrentColorModel)

    parent.postMessage(
      {
        pluginMessage: {
          message: 'syncCurrentColorModel',
          currentColorModel: newCurrentColorModel
        }
      },
      '*'
    )

    const currentColorRgba = $colorsRgba.get()[`${$currentFillOrStroke.get()}`]!

    const newColorHxy = convertRgbToHxy({
      colorRgb: {
        r: currentColorRgba.r,
        g: currentColorRgba.g,
        b: currentColorRgba.b
      },
      targetColorModel: newCurrentColorModel,
      fileColorProfile: $fileColorProfile.get()!
    })

    $colorHxya.set({ ...newColorHxy, a: $colorHxya.get().a })

    // We constrain to sRGB profile with these models to avoid confusion for users as they are not intended to be used in P3 space.
    if (['okhsv', 'okhsl'].includes(newCurrentColorModel)) {
      $fileColorProfile.set('rgb')

      parent.postMessage(
        {
          pluginMessage: {
            message: 'syncFileColorProfile',
            fileColorProfile: 'rgb'
          }
        },
        '*'
      )
    }
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
