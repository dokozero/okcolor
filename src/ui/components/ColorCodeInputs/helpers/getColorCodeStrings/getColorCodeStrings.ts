import { clampChroma, formatHex, formatHex8 } from 'culori'
import { ColorCodesInputValues, ColorHxya, ColorRgb, CurrentColorModel } from '../../../../../types'
import convertHxyToRgb from '../../../../helpers/colors/convertHxyToRgb/convertHxyToRgb'
import { $colorHxya } from '../../../../stores/colors/colorHxya/colorHxya'
import { $currentColorModel } from '../../../../stores/colors/currentColorModel/currentColorModel'
import round from 'lodash/round'

type NewColorStrings = {
  [key in ColorCodesInputValues]: string
}

type Props = {
  colorHxya?: ColorHxya
  currentColorModel?: CurrentColorModel
}

export default function getColorCodeStrings(props: Props = {}): NewColorStrings {
  const { colorHxya = $colorHxya.get(), currentColorModel = $currentColorModel.get() } = props

  const newColorStrings: NewColorStrings = {
    currentColorModel: '',
    color: '',
    rgba: '',
    hex: ''
  }

  let clamped
  let rgbSrgb: ColorRgb = {
    r: 0,
    g: 0,
    b: 0
  }
  let rgbP3: ColorRgb = {
    r: 0,
    g: 0,
    b: 0
  }

  // We don't clamp chroma with the models that don't use it because they already work in sRGB.
  if (currentColorModel === 'oklch') {
    clamped = clampChroma({ mode: 'oklch', l: colorHxya.y / 100, c: colorHxya.x, h: colorHxya.h }, 'oklch', 'rgb')
    rgbSrgb = convertHxyToRgb({
      colorHxy: {
        h: clamped.h,
        x: clamped.c,
        y: clamped.l * 100
      },
      colorSpace: 'rgb'
    })
    rgbP3 = convertHxyToRgb({
      colorHxy: colorHxya,
      colorSpace: 'p3'
    })
  } else {
    rgbSrgb = convertHxyToRgb({
      colorHxy: colorHxya,
      colorSpace: 'rgb'
    })
  }

  if (currentColorModel === 'oklch') {
    newColorStrings.currentColorModel =
      `oklch(${colorHxya.y}% ${round(colorHxya.x, 6)} ${colorHxya.h}` + (colorHxya.a !== 1 ? ` / ${colorHxya.a})` : ')')
  } else if (currentColorModel === 'okhsl') {
    newColorStrings.currentColorModel = `{mode: "okhsl", h: ${colorHxya.h}, s: ${colorHxya.x / 100}, l: ${colorHxya.y / 100}}`
  } else if (currentColorModel === 'okhsv') {
    newColorStrings.currentColorModel = `{mode: "okhsv", h: ${colorHxya.h}, s: ${colorHxya.x / 100}, v: ${colorHxya.y / 100}}`
  }

  if (currentColorModel === 'oklch') {
    newColorStrings.color =
      `color(display-p3 ${round(rgbP3.r, 4)} ${round(rgbP3.g, 4)} ${round(rgbP3.b, 4)}` + (colorHxya.a !== 1 ? ` / ${colorHxya.a})` : ')')
  } else {
    newColorStrings.color =
      `color(srgb ${round(rgbSrgb.r, 4)} ${round(rgbSrgb.g, 4)} ${round(rgbSrgb.b, 4)}` + (colorHxya.a !== 1 ? ` / ${colorHxya.a})` : ')')
  }

  newColorStrings.rgba = `rgba(${round(rgbSrgb.r * 255, 0)}, ${round(rgbSrgb.g * 255, 0)}, ${round(rgbSrgb.b * 255, 0)}, ${colorHxya.a})`

  if (colorHxya.a !== 1) {
    newColorStrings.hex = formatHex8(
      `rgba(${round(rgbSrgb.r * 255, 0)}, ${round(rgbSrgb.g * 255, 0)}, ${round(rgbSrgb.b * 255, 0)}, ${colorHxya.a})`
    )!.toUpperCase()
  } else {
    newColorStrings.hex = formatHex(`rgb(${round(rgbSrgb.r * 255, 0)}, ${round(rgbSrgb.g * 255, 0)}, ${round(rgbSrgb.b * 255, 0)})`)!.toUpperCase()
  }

  return newColorStrings
}
