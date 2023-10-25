import {
  $lockRelativeChroma,
  $lockContrast,
  $colorsRgba,
  $currentFillOrStroke,
  $updateParent,
  updateColorHxyaAndSyncColorsRgbaAndPlugin
} from '../store'

/**
 * Reset interface state, we use these values to have a nice base look when the UI message is on.
 */
export default function setValuesForUiMessage() {
  $lockRelativeChroma.set(false)
  $lockContrast.set(false)
  $colorsRgba.setKey('parentFill', null)
  const theme = document.documentElement.classList.value
  if (theme === 'figma-light') {
    $colorsRgba.setKey('fill', { r: 255, g: 255, b: 255, a: 100 })
    $colorsRgba.setKey('stroke', { r: 255, g: 255, b: 255, a: 100 })
  } else if (theme === 'figma-dark') {
    $colorsRgba.setKey('fill', { r: 44, g: 44, b: 44, a: 100 })
    $colorsRgba.setKey('stroke', { r: 44, g: 44, b: 44, a: 100 })
  }
  $currentFillOrStroke.set('fill')
  if ($updateParent.get()) $updateParent.set(false)

  // We send this color to get '0' on all values of the UI.
  updateColorHxyaAndSyncColorsRgbaAndPlugin({ newColorHxya: { h: 0, x: 0, y: 0, a: 0 }, syncColorsRgba: false, syncColorRgbWithPlugin: false })
}
