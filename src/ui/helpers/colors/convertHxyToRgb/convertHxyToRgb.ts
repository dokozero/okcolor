import { ColorHxy, ColorModelList, FileColorProfile, ColorRgb } from '../../../../types'
import { $currentColorModel } from '../../../stores/colors/currentColorModel/currentColorModel'
import { $fileColorProfile } from '../../../stores/colors/fileColorProfile/fileColorProfile'
import clampNumber from '../../numbers/clampNumber/clampNumber'
import { converter } from '../culori.mjs'
import type { Rgb, Okhsl, Okhsv, Oklch } from '../culori.mjs'

const convertToRgb = converter('rgb')
const convertToP3 = converter('p3')

type Props = {
  colorHxy: ColorHxy
  originColorModel?: keyof typeof ColorModelList
  colorSpace?: FileColorProfile
}

export default function convertHxyToRgb(props: Props): ColorRgb {
  const { colorHxy, originColorModel = $currentColorModel.get(), colorSpace = $fileColorProfile.get() } = props

  let culoriResult: Rgb | Okhsl | Okhsv | Oklch
  let newColorRgb: ColorRgb

  let colorObject

  switch (originColorModel) {
    case 'okhsv':
      colorObject = { mode: 'okhsv', h: colorHxy.h, s: colorHxy.x / 100, v: colorHxy.y / 100 }
      break
    case 'okhsl':
      colorObject = { mode: 'okhsl', h: colorHxy.h, s: colorHxy.x / 100, l: colorHxy.y / 100 }
      break
    case 'oklch':
    case 'oklchCss':
      colorObject = { mode: 'oklch', h: colorHxy.h, c: colorHxy.x, l: colorHxy.y / 100 }
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
      r: clampNumber(culoriResult.r, 0, 1),
      g: clampNumber(culoriResult.g, 0, 1),
      b: clampNumber(culoriResult.b, 0, 1)
    }
  }

  return newColorRgb
}
