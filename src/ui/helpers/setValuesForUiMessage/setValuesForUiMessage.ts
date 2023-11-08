import { setColorHxyaWithSideEffects } from '../../stores/colors/colorHxya/colorHxya'
import { setColorsRgbaWithSideEffects } from '../../stores/colors/colorsRgba/colorsRgba'
import { setLockRelativeChroma } from '../../stores/colors/lockRelativeChroma/lockRelativeChroma'
import { setRelativeChroma } from '../../stores/colors/relativeChroma/relativeChroma'
import { $currentBgOrFg, setCurrentBgOrFg } from '../../stores/contrasts/currentBgOrFg/currentBgOrFg'
import { setLockContrast } from '../../stores/contrasts/lockContrast/lockContrast'
import { setCurrentFillOrStroke } from '../../stores/currentFillOrStroke/currentFillOrStroke'

/**
 * Reset interface state, we use these values to have a nice base look when the UI message is on.
 */
export default function setValuesForUiMessage() {
  setLockRelativeChroma(false)
  setLockContrast(false)

  if (document.documentElement.classList.contains('figma-light')) {
    setColorsRgbaWithSideEffects({
      newColorsRgba: {
        parentFill: null,
        fill: { r: 1, g: 1, b: 1, a: 1 },
        stroke: { r: 1, g: 1, b: 1, a: 1 }
      },
      sideEffects: {
        syncColorRgbWithBackend: false,
        colorHxya: {
          syncColorHxya: false
        },
        syncContrast: false
      }
    })
  } else if (document.documentElement.classList.contains('figma-dark')) {
    setColorsRgbaWithSideEffects({
      newColorsRgba: {
        parentFill: null,
        fill: { r: 0.173, g: 0.173, b: 0.173, a: 1 },
        stroke: { r: 0.173, g: 0.173, b: 0.173, a: 1 }
      },
      sideEffects: {
        syncColorRgbWithBackend: false,
        colorHxya: {
          syncColorHxya: false
        },
        syncContrast: false
      }
    })
  }

  setCurrentFillOrStroke('fill')

  if ($currentBgOrFg.get() === 'bg') setCurrentBgOrFg('fg')

  // We send this color to get '0' on all values of the UI.
  setColorHxyaWithSideEffects({
    newColorHxya: { h: 0, x: 0, y: 0, a: 0 },
    sideEffects: {
      colorsRgba: {
        syncColorsRgba: false
      }
    }
  })

  setRelativeChroma(0)
}
