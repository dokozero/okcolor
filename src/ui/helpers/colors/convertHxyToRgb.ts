import { converter } from './culori.mjs'
import type { Rgb, Okhsl, Okhsv, Oklch } from './culori.mjs'
import { ColorHxy, ColorModelList, ColorRgb, FileColorProfile } from '../../../types'
import clampNumber from '../numbers/clampNumber'

const convertToRgb = converter('rgb')
const convertToP3 = converter('p3')

type Props = {
  colorHxy: ColorHxy
  originColorModel: keyof typeof ColorModelList
  colorSpace: FileColorProfile
}

/**
 *
 * @param {colorHxy} ColorHxy x should always be between 0 and 100.
 */
export default function convertHxyToRgb(props: Props): ColorRgb {
  const { colorHxy, originColorModel, colorSpace } = props

  let culoriResult: Rgb | Okhsl | Okhsv | Oklch
  let newColorRgb: ColorRgb

  // convertToRgb() and convertToP3() needs these values between 0 and 1.
  colorHxy.x = colorHxy.x / 100
  colorHxy.y = colorHxy.y / 100

  let colorObject

  switch (originColorModel) {
    case 'okhsv':
      colorObject = { mode: 'okhsv', h: colorHxy.h, s: colorHxy.x, v: colorHxy.y }
      break
    case 'okhsl':
      colorObject = { mode: 'okhsl', h: colorHxy.h, s: colorHxy.x, l: colorHxy.y }
      break
    case 'oklch':
    case 'oklchCss':
      colorObject = { mode: 'oklch', h: colorHxy.h, c: colorHxy.x, l: colorHxy.y }
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
      r: clampNumber(culoriResult.r * 255, 0, 255),
      g: clampNumber(culoriResult.g * 255, 0, 255),
      b: clampNumber(culoriResult.b * 255, 0, 255)
    }
  }

  return newColorRgb
}
