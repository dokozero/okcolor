import { APCAcontrast, sRGBtoY, alphaBlend, displayP3toY } from 'apca-w3'
import {
  ColorRgba,
  ColorRgb,
  CurrentContrastMethod,
  ApcaContrast,
  WcagContrast,
  RgbArray,
  RgbaArray,
  CurrentFileColorProfile
} from '../../../../types'
import { $currentFileColorProfile } from '../../../stores/colors/currentFileColorProfile/currentFileColorProfile'
import { $currentContrastMethod } from '../../../stores/contrasts/currentContrastMethod/currentContrastMethod'
import WCAGcontrast from '../WCAGcontrast/WCAGcontrast'

type Props = {
  fg: ColorRgba
  bg: ColorRgb
  currentContrastMethod?: CurrentContrastMethod
  currentFileColorProfile?: CurrentFileColorProfile
}

export default function getContrastFromBgandFgRgba(props: Props): ApcaContrast | WcagContrast {
  const { fg, bg, currentContrastMethod = $currentContrastMethod.get(), currentFileColorProfile = $currentFileColorProfile.get() } = props

  let bgRgb: RgbArray = [bg.r, bg.g, bg.b]
  let fgRgb: RgbaArray = [fg.r, fg.g, fg.b, fg.a]
  let APCAContrastResult: ApcaContrast | string
  let newContrast: ApcaContrast | WcagContrast = 0

  switch (currentContrastMethod) {
    case 'apca':
      if (currentFileColorProfile === 'rgb') {
        // sRGBtoY need these value between 0 and 255.
        bgRgb = [bg.r * 255, bg.g * 255, bg.b * 255]
        fgRgb = [fg.r * 255, fg.g * 255, fg.b * 255, fg.a]

        APCAContrastResult = APCAcontrast(sRGBtoY(alphaBlend(fgRgb, bgRgb)), sRGBtoY(bgRgb))
      } else {
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
