import { ColorRgb, ColorModelList, FileColorProfile, ColorHxy } from '../../../../types'
import { $currentColorModel } from '../../../stores/colors/currentColorModel/currentColorModel'
import { $fileColorProfile } from '../../../stores/colors/fileColorProfile/fileColorProfile'
import roundWithDecimal from '../../numbers/roundWithDecimal/roundWithDecimal'
import { converter } from '../culori.mjs'
import type { Rgb, Okhsl, Okhsv, Oklch } from '../culori.mjs'
import getColorHxyDecimals from '../getColorHxyDecimals/getColorHxyDecimals'

const convertToOkhsl = converter('okhsl')
const convertToOkhsv = converter('okhsv')
const convertToOklch = converter('oklch')

type Props = {
  colorRgb: ColorRgb
  targetColorModel?: keyof typeof ColorModelList
  colorSpace?: FileColorProfile
  keepOklchDoubleDigit?: boolean
}

export default function convertRgbToHxy(props: Props): ColorHxy {
  const { colorRgb, targetColorModel = $currentColorModel.get(), colorSpace = $fileColorProfile.get(), keepOklchDoubleDigit = false } = props

  let culoriResult: Rgb | Okhsl | Okhsv | Oklch
  let newColorHxy: ColorHxy

  // No need to go all through color conversion if we have a white of black color, we can manually find the corresponding values.
  // Also this is useful because if the color is white and we don't do this, we'll get a value with a hue of 90 and a saturation of 56 in OkHSL.
  if (colorRgb.r > 0.99 && colorRgb.g > 0.99 && colorRgb.b > 0.99) {
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

  // color() function in CSS use different names for the color profile than the one used in this plugin.
  let colorFunctionSpace: string

  if (colorSpace === 'p3') {
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
          h: roundWithDecimal(culoriResult.h, getColorHxyDecimals().h),
          x: roundWithDecimal(culoriResult.c, getColorHxyDecimals().x),
          y: roundWithDecimal(culoriResult.l * 100, getColorHxyDecimals().y)
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