import { setColorHxyaWithSideEffects } from '../stores/colors/colorHxya'
import { setColorsRgbaWithSideEffects } from '../stores/colors/colorsRgba'
import { setLockRelativeChroma } from '../stores/colors/lockRelativeChroma'
import { $currentBgOrFg, setCurrentBgOrFg } from '../stores/contrasts/currentBgOrFg'
import { setLockContrast } from '../stores/contrasts/lockContrast'
import { setCurrentFillOrStroke } from '../stores/currentFillOrStroke'

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
        fill: { r: 255, g: 255, b: 255, a: 100 },
        stroke: { r: 255, g: 255, b: 255, a: 100 }
      },
      syncColorHxya: false
    })
  } else if (document.documentElement.classList.contains('figma-dark')) {
    setColorsRgbaWithSideEffects({
      newColorsRgba: {
        parentFill: null,
        fill: { r: 44, g: 44, b: 44, a: 100 },
        stroke: { r: 44, g: 44, b: 44, a: 100 }
      },
      syncColorHxya: false
    })
  }
  setCurrentFillOrStroke('fill')
  if ($currentBgOrFg.get() === 'bg') setCurrentBgOrFg('fg')

  // We send this color to get '0' on all values of the UI.
  setColorHxyaWithSideEffects({ newColorHxya: { h: 0, x: 0, y: 0, a: 0 }, syncColorsRgba: false, syncColorRgbWithBackend: false })
}
