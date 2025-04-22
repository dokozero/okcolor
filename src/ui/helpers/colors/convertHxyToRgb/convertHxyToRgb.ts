import { ColorHxy, ColorModelList, CurrentFileColorProfile, ColorRgb } from '../../../../types'
import { $currentColorModel } from '../../../stores/colors/currentColorModel/currentColorModel'
import { $currentFileColorProfile } from '../../../stores/colors/currentFileColorProfile/currentFileColorProfile'
import { converter } from 'culori'
import type { Rgb, Okhsl, Okhsv, Oklch } from 'culori'
import clamp from 'lodash/clamp'

const convertToRgb = converter('rgb')
const convertToP3 = converter('p3')

type Props = {
  colorHxy: ColorHxy
  originColorModel?: keyof typeof ColorModelList
  colorSpace?: CurrentFileColorProfile
}

export default function convertHxyToRgb(props: Props): ColorRgb {
  const { colorHxy, originColorModel = $currentColorModel.get(), colorSpace = $currentFileColorProfile.get() } = props

  let culoriResult: Rgb | Okhsl | Okhsv | Oklch
  let newColorRgb: ColorRgb

  let colorObject

  switch (originColorModel) {
    case 'oklch':
      colorObject = { mode: 'oklch', h: colorHxy.h, c: colorHxy.x, l: colorHxy.y / 100 }
      break
    case 'okhsl':
      colorObject = { mode: 'okhsl', h: colorHxy.h, s: colorHxy.x / 100, l: colorHxy.y / 100 }
      break
    case 'okhsv':
      colorObject = { mode: 'okhsv', h: colorHxy.h, s: colorHxy.x / 100, v: colorHxy.y / 100 }
      break
  }

  if (colorSpace === 'rgb') {
    culoriResult = convertToRgb(colorObject)
  } else if (colorSpace === 'p3') {
    culoriResult = convertToP3(colorObject)
  }

  if (colorHxy.y === 0) {
    // If we have a black color (luminosity / value = 0), convertToRgb() return NaN for the RGB values so we fix this.
    newColorRgb = {
      r: 0,
      g: 0,
      b: 0
    }
  } else {
    newColorRgb = {
      r: clamp(culoriResult.r, 0, 1),
      g: clamp(culoriResult.g, 0, 1),
      b: clamp(culoriResult.b, 0, 1)
    }
  }

  return newColorRgb
}
