import { converter } from '../helpers/culori.mjs'
import type { Rgb, Okhsl, Okhsv, Oklch } from '../helpers/culori.mjs'

import { roundWithDecimal } from './others'
import { ColorHxy, ColorModelList, ColorRgb, FileColorProfile } from '../../types'
import { getColorValueDecimals } from '../stores/colors/colorHxya'

const convertToOkhsl = converter('okhsl')
const convertToOkhsv = converter('okhsv')
const convertToOklch = converter('oklch')

type Props = {
  colorRgb: ColorRgb
  targetColorModel: keyof typeof ColorModelList
  fileColorProfile: FileColorProfile
  keepOklchDoubleDigit?: boolean
}

export default function convertRgbToHxy(props: Props): ColorHxy {
  const { colorRgb, targetColorModel, fileColorProfile, keepOklchDoubleDigit = false } = props

  let culoriResult: Rgb | Okhsl | Okhsv | Oklch
  let newColorHxy: ColorHxy

  // No need to go all through color conversion if we have a white of black color, we can manually find the corresponding values.
  // Also this is useful because if the color is white and we don't do this, we'll get a value with a hue of 90 and a saturation of 56 in OkHSL.

  if (colorRgb.r > 254 && colorRgb.g > 254 && colorRgb.b > 254) {
    return {
      h: 0,
      x: 0,
      y: 100
    }
  } else if (colorRgb.r === 0 && colorRgb.g === 0 && colorRgb.b === 0) {
    return {
      h: 0,
      x: 0,
      y: 0
    }
  }

  // We need the RGB values between 0 and 1.
  colorRgb.r = colorRgb.r / 255
  colorRgb.g = colorRgb.g / 255
  colorRgb.b = colorRgb.b / 255

  // color() function in CSS use different names for the color profile than the one used in this plugin.
  let colorFunctionSpace: string

  if (fileColorProfile === 'p3') {
    colorFunctionSpace = 'display-p3'
  } else {
    colorFunctionSpace = 'srgb'
  }

  switch (targetColorModel) {
    case 'okhsv':
      culoriResult = convertToOkhsv(`color(srgb ${colorRgb.r} ${colorRgb.g} ${colorRgb.b})`)
      break
    case 'okhsl':
      culoriResult = convertToOkhsl(`color(srgb ${colorRgb.r} ${colorRgb.g} ${colorRgb.b})`)
      break
    case 'oklch':
    case 'oklchCss':
      culoriResult = convertToOklch(`color(${colorFunctionSpace} ${colorRgb.r} ${colorRgb.g} ${colorRgb.b})`)
      break
  }

  switch (targetColorModel) {
    case 'okhsv':
      newColorHxy = {
        h: Math.round(culoriResult.h),
        x: Math.round(culoriResult.s * 100),
        y: Math.round(culoriResult.v * 100)
      }
      break
    case 'okhsl':
      newColorHxy = {
        h: Math.round(culoriResult.h),
        x: Math.round(culoriResult.s * 100),
        y: Math.round(culoriResult.l * 100)
      }
      break
    case 'oklch':
    case 'oklchCss':
      if (!keepOklchDoubleDigit) {
        newColorHxy = {
          h: roundWithDecimal(culoriResult.h, getColorValueDecimals().h),
          x: roundWithDecimal(culoriResult.c, getColorValueDecimals().x),
          y: roundWithDecimal(culoriResult.l * 100, getColorValueDecimals().y)
        }
      } else {
        newColorHxy = {
          h: roundWithDecimal(culoriResult.h, 2),
          x: roundWithDecimal(culoriResult.c, 6),
          y: roundWithDecimal(culoriResult.l * 100, 2)
        }
      }
      break
  }

  // We need to do this because if for example we get a color like #888888, we will get Nan for newColorHxy.h, also, with others gray values we'll sometimes get a hue of 90 or 0.
  // The reason we use roundWithDecimal() is because without it we can have for example param1 = 123.99995 and param2 = 123.99994.
  if (
    roundWithDecimal(colorRgb.r, 3) === roundWithDecimal(colorRgb.g, 3) &&
    roundWithDecimal(colorRgb.r, 3) === roundWithDecimal(colorRgb.b, 3) &&
    roundWithDecimal(colorRgb.g, 3) === roundWithDecimal(colorRgb.b, 3)
  ) {
    newColorHxy.h = 0
  }

  return newColorHxy
}
