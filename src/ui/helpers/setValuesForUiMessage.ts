import {
  $lockRelativeChroma,
  $lockContrast,
  $colorsRgba,
  $currentFillOrStroke,
  $currentBgOrFg,
  updateColorHxyaAndSyncColorsRgbaAndBackend
} from '../store'

/**
 * Reset interface state, we use these values to have a nice base look when the UI message is on.
 */
export default function setValuesForUiMessage() {
  $lockRelativeChroma.set(false)
  $lockContrast.set(false)
  $colorsRgba.setKey('parentFill', null)

  if (document.documentElement.classList.contains('figma-light')) {
    $colorsRgba.setKey('fill', { r: 255, g: 255, b: 255, a: 100 })
    $colorsRgba.setKey('stroke', { r: 255, g: 255, b: 255, a: 100 })
  } else if (document.documentElement.classList.contains('figma-dark')) {
    $colorsRgba.setKey('fill', { r: 44, g: 44, b: 44, a: 100 })
    $colorsRgba.setKey('stroke', { r: 44, g: 44, b: 44, a: 100 })
  }
  $currentFillOrStroke.set('fill')
  if ($currentBgOrFg.get() === 'bg') $currentBgOrFg.set('fg')

  // We send this color to get '0' on all values of the UI.
  updateColorHxyaAndSyncColorsRgbaAndBackend({ newColorHxya: { h: 0, x: 0, y: 0, a: 0 }, syncColorsRgba: false, syncColorRgbWithBackend: false })
}
