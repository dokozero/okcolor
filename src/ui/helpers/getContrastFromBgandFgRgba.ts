import { APCAcontrast, sRGBtoY, alphaBlend, displayP3toY } from 'apca-w3'
import { ApcaContrast, ColorRgb, ColorRgba } from '../../types'
import { $fileColorProfile } from '../store'

type RgbArray = [number, number, number]
type RgbaArray = [number, number, number, number]

export default function getContrastFromBgandFgRgba(bg: ColorRgb, fg: ColorRgba): ApcaContrast {
  let background: RgbArray = [0, 0, 0]
  let foreground: RgbaArray = [0, 0, 0, 0]
  let APCAContrastResult: number | string
  let newContrast: ApcaContrast

  if ($fileColorProfile.get() === 'rgb') {
    background = [bg.r, bg.g, bg.b]
    foreground = [fg.r, fg.g, fg.b, fg.a / 100]

    APCAContrastResult = APCAcontrast(sRGBtoY(alphaBlend(foreground, background)), sRGBtoY(background))
  } else {
    background = [bg.r / 255, bg.g / 255, bg.b / 255]
    foreground = [fg.r / 255, fg.g / 255, fg.b / 255, fg.a / 100]

    APCAContrastResult = APCAcontrast(displayP3toY(alphaBlend(foreground, background, false)), displayP3toY(background))
  }

  // From some reason, APCAcontrast() can return a string. so we need to convert it to number if that the case.
  if (typeof APCAContrastResult === 'string') newContrast = parseInt(APCAContrastResult)
  else newContrast = APCAContrastResult

  return Math.round(newContrast)
}
