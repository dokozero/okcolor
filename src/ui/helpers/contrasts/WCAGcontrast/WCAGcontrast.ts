import { RgbaArray, RgbArray, WcagContrast } from '../../../../types'
import round from 'lodash/round'

// Formulas for contrast from https://www.w3.org/WAI/WCAG22/Techniques/general/G145#tests

// For alphaCompositing, thanks to GPT-4
const alphaCompositing = (fg: RgbaArray, bg: RgbArray): RgbArray => {
  const resultRgbColor: RgbArray = [0, 0, 0]

  const opacity = fg[3] < 0.2 ? 0.2 : fg[3]

  for (let i = 0; i < 3; i++) {
    resultRgbColor[i] = opacity * fg[i] + (1 - opacity) * bg[i]
  }

  return resultRgbColor
}

const getLuminanceOfRgbArray = (rgbArray: RgbaArray | RgbArray) => {
  for (let i = 0; i < rgbArray.length; i++) {
    if (rgbArray[i] < 0.04045) {
      rgbArray[i] = rgbArray[i] / 12.92
    } else {
      rgbArray[i] = Math.pow((rgbArray[i] + 0.055) / 1.055, 2.4)
    }
  }

  return rgbArray[0] * 0.2126 + rgbArray[1] * 0.7152 + rgbArray[2] * 0.0722
}

export default function WCAGcontrast(fg: RgbaArray, bg: RgbArray): WcagContrast {
  let fgWithAlphaCompositing: RgbArray = [fg[0], fg[1], fg[2]]

  if (fg[3] < 1) {
    fgWithAlphaCompositing = alphaCompositing(fg, bg)
  }

  const fgLuminance = getLuminanceOfRgbArray(fgWithAlphaCompositing)
  const bgLuminance = getLuminanceOfRgbArray(bg)

  let contrast: WcagContrast
  if (fgLuminance > bgLuminance || (fgLuminance === 0 && bgLuminance === 0)) {
    // We force the value to be negative to have the same behavior as in APCA, see comment in types.ts for "WcagContrast".
    contrast = -round((fgLuminance + 0.05) / (bgLuminance + 0.05), 1)
  } else {
    contrast = round((bgLuminance + 0.05) / (fgLuminance + 0.05), 1)
  }

  return contrast
}
