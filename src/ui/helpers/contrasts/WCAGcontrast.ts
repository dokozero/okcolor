import { RgbArray, RgbaArray, WcagContrast } from '../../../types'
import roundWithDecimal from '../numbers/roundWithDecimal'

// Formulas for contrast from https://www.w3.org/WAI/WCAG22/Techniques/general/G145#tests
// For alphaCompositing, thanks to GPT-4

const alphaCompositing = (fg: RgbaArray, bg: RgbArray): RgbArray => {
  const resultRgbColor: RgbArray = [0, 0, 0]

  const opacity = fg[3] < 0.2 ? 0.2 : fg[3]

  for (let i = 0; i < 3; i++) {
    resultRgbColor[i] = Math.floor(opacity * fg[i] + (1 - opacity) * bg[i])
  }

  return resultRgbColor
}

const getLuminanceOfRgbArray = (rgbArray: RgbaArray | RgbArray) => {
  const formatedRgbArray = [rgbArray[0] / 255, rgbArray[1] / 255, rgbArray[2] / 255]

  for (let i = 0; i < formatedRgbArray.length; i++) {
    if (formatedRgbArray[i] < 0.04045) {
      formatedRgbArray[i] = formatedRgbArray[i] / 12.92
    } else {
      formatedRgbArray[i] = Math.pow((formatedRgbArray[i] + 0.055) / 1.055, 2.4)
    }
  }

  return formatedRgbArray[0] * 0.2126 + formatedRgbArray[1] * 0.7152 + formatedRgbArray[2] * 0.0722
}

export default function WCAGcontrast(fg: RgbaArray, bg: RgbArray): WcagContrast {
  let fgWithAlphaCompositing: RgbArray = [fg[0], fg[1], fg[2]]

  if (fg[3] < 1) {
    fgWithAlphaCompositing = alphaCompositing(fg, bg)
  }

  const fgLuminance = getLuminanceOfRgbArray(fgWithAlphaCompositing)
  const bgLuminance = getLuminanceOfRgbArray(bg)

  let contrast: WcagContrast
  if (fgLuminance > bgLuminance) {
    // We for the value to be negative to have the same behavior as in APCA, see comment in types.ts for "WcagContrast".
    contrast = -roundWithDecimal((fgLuminance + 0.05) / (bgLuminance + 0.05), 1)
  } else {
    contrast = roundWithDecimal((bgLuminance + 0.05) / (fgLuminance + 0.05), 1)
  }

  return contrast
}
