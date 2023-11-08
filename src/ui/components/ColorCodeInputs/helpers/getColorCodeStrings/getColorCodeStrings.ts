import { formatHex8, formatHex, clampChromaInGamut } from '../../../../helpers/colors/culori.mjs'
import { ColorCodesInputValues, ColorRgb } from '../../../../../types'
import convertHxyToRgb from '../../../../helpers/colors/convertHxyToRgb/convertHxyToRgb'
import { $colorHxya } from '../../../../stores/colors/colorHxya/colorHxya'
import { $currentColorModel } from '../../../../stores/colors/currentColorModel/currentColorModel'
import round from 'lodash/round'

type NewColorStrings = {
  [key in ColorCodesInputValues]: string
}

export default function getColorCodeStrings(): NewColorStrings {
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
  if (['oklch', 'oklchCss'].includes($currentColorModel.get())) {
    clamped = clampChromaInGamut({ mode: 'oklch', l: $colorHxya.get().y / 100, c: $colorHxya.get().x, h: $colorHxya.get().h }, 'oklch', 'rgb')
    rgbSrgb = convertHxyToRgb({
      colorHxy: {
        h: clamped.h,
        x: clamped.c,
        y: clamped.l * 100
      },
      colorSpace: 'rgb'
    })
    rgbP3 = convertHxyToRgb({
      colorHxy: $colorHxya.get(),
      colorSpace: 'p3'
    })
  } else {
    rgbSrgb = convertHxyToRgb({
      colorHxy: $colorHxya.get(),
      colorSpace: 'rgb'
    })
  }

  if (['oklch', 'oklchCss'].includes($currentColorModel.get())) {
    newColorStrings.currentColorModel =
      `oklch(${$colorHxya.get().y}% ${round($colorHxya.get().x, 6)} ${$colorHxya.get().h}` +
      ($colorHxya.get().a !== 1 ? ` / ${$colorHxya.get().a})` : ')')
  } else if ($currentColorModel.get() === 'okhsl') {
    newColorStrings.currentColorModel = `{mode: "okhsl", h: ${$colorHxya.get().h}, s: ${$colorHxya.get().x}, l: ${$colorHxya.get().y}}`
  } else if ($currentColorModel.get() === 'okhsv') {
    newColorStrings.currentColorModel = `{mode: "okhsv", h: ${$colorHxya.get().h}, s: ${$colorHxya.get().x}, v: ${$colorHxya.get().y}}`
  }

  if (['oklch', 'oklchCss'].includes($currentColorModel.get())) {
    newColorStrings.color =
      `color(display-p3 ${round(rgbP3.r, 4)} ${round(rgbP3.g, 4)} ${round(rgbP3.b, 4)}` +
      ($colorHxya.get().a !== 1 ? ` / ${$colorHxya.get().a})` : ')')
  } else {
    newColorStrings.color =
      `color(srgb ${round(rgbSrgb.r, 4)} ${round(rgbSrgb.g, 4)} ${round(rgbSrgb.b, 4)}` +
      ($colorHxya.get().a !== 1 ? ` / ${$colorHxya.get().a})` : ')')
  }

  newColorStrings.rgba = `rgba(${round(rgbSrgb.r * 255, 0)}, ${round(rgbSrgb.g * 255, 0)}, ${round(rgbSrgb.b * 255, 0)}, ${$colorHxya.get().a})`

  if ($colorHxya.get().a !== 1) {
    newColorStrings.hex = formatHex8(
      `rgba(${round(rgbSrgb.r * 255, 0)}, ${round(rgbSrgb.g * 255, 0)}, ${round(rgbSrgb.b * 255, 0)}, ${$colorHxya.get().a})`
    )!.toUpperCase()
  } else {
    newColorStrings.hex = formatHex(`rgb(${round(rgbSrgb.r * 255, 0)}, ${round(rgbSrgb.g * 255, 0)}, ${round(rgbSrgb.b * 255, 0)})`)!.toUpperCase()
  }

  return newColorStrings
}
