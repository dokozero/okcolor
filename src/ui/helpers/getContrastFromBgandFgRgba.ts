import { APCAcontrast, sRGBtoY, alphaBlend, displayP3toY } from 'apca-w3'
import { ApcaContrast, ColorRgb, ColorRgba, CurrentContrastMethod, RgbArray, RgbaArray, WcagContrast } from '../../types'
import WCAGcontrast from './WCAGcontrast'
import { $currentContrastMethod } from '../stores/contrasts/currentContrastMethod'
import { $fileColorProfile } from '../stores/colors/fileColorProfile'

export default function getContrastFromBgandFgRgba(
  fg: ColorRgba,
  bg: ColorRgb,
  currentContrastMethod: CurrentContrastMethod = $currentContrastMethod.get()
): ApcaContrast | WcagContrast {
  let bgRgb: RgbArray = [bg.r, bg.g, bg.b]
  let fgRgb: RgbaArray = [fg.r, fg.g, fg.b, fg.a / 100]
  let APCAContrastResult: ApcaContrast | string
  let newContrast: ApcaContrast | WcagContrast = 0

  switch (currentContrastMethod) {
    case 'apca':
      if ($fileColorProfile.get() === 'rgb') {
        APCAContrastResult = APCAcontrast(sRGBtoY(alphaBlend(fgRgb, bgRgb)), sRGBtoY(bgRgb))
      } else {
        // displayP3toY need these value between 0 and 1.
        bgRgb = [bg.r / 255, bg.g / 255, bg.b / 255]
        fgRgb = [fg.r / 255, fg.g / 255, fg.b / 255, fg.a / 100]

        APCAContrastResult = APCAcontrast(displayP3toY(alphaBlend(fgRgb, bgRgb, false)), displayP3toY(bgRgb))
      }

      // From some reason, APCAcontrast() can return a string. so we need to convert it to number if that the case.
      if (typeof APCAContrastResult === 'string') newContrast = parseInt(APCAContrastResult)
      else newContrast = APCAContrastResult

      newContrast = Math.round(newContrast)
      break

    case 'wcag':
      newContrast = WCAGcontrast(fgRgb, bgRgb)
      break

    default:
      break
  }

  return newContrast
}
