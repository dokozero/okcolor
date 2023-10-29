import { formatHex8, formatHex } from 'culori'
import { roundWithDecimal } from '../../../helpers/others'
import { $currentColorModel, $colorHxya } from '../../../store'
import { clampChromaInGamut } from '../../../helpers/culori.mjs'
import { ColorCodesInputValues, ColorRgb } from '../../../../types'
import convertHxyToRgb from '../../../helpers/convertHxyToRgb'

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
        x: clamped.c * 100,
        y: clamped.l * 100
      },
      originColorModel: $currentColorModel.get(),
      fileColorProfile: 'rgb'
    })
    rgbP3 = convertHxyToRgb({
      colorHxy: {
        h: $colorHxya.get().h,
        x: $colorHxya.get().x * 100,
        y: $colorHxya.get().y
      },
      originColorModel: $currentColorModel.get(),
      fileColorProfile: 'p3'
    })
  } else {
    rgbSrgb = convertHxyToRgb({
      colorHxy: {
        h: $colorHxya.get().h,
        x: $colorHxya.get().x,
        y: $colorHxya.get().y
      },
      originColorModel: $currentColorModel.get(),
      fileColorProfile: 'rgb'
    })
  }

  const opacity = $colorHxya.get().a / 100

  if (['oklch', 'oklchCss'].includes($currentColorModel.get())) {
    newColorStrings.currentColorModel =
      `oklch(${$colorHxya.get().y}% ${roundWithDecimal($colorHxya.get().x, 6)} ${$colorHxya.get().h}` + (opacity !== 1 ? ` / ${opacity})` : ')')
  } else if ($currentColorModel.get() === 'okhsl') {
    newColorStrings.currentColorModel = `{mode: "okhsl", h: ${$colorHxya.get().h}, s: ${$colorHxya.get().x}, l: ${$colorHxya.get().y}}`
  } else if ($currentColorModel.get() === 'okhsv') {
    newColorStrings.currentColorModel = `{mode: "okhsv", h: ${$colorHxya.get().h}, s: ${$colorHxya.get().x}, v: ${$colorHxya.get().y}}`
  }

  if (['oklch', 'oklchCss'].includes($currentColorModel.get())) {
    newColorStrings.color =
      `color(display-p3 ${roundWithDecimal(rgbP3.r / 255, 4)} ${roundWithDecimal(rgbP3.g / 255, 4)} ${roundWithDecimal(rgbP3.b / 255, 4)}` +
      (opacity !== 1 ? ` / ${opacity})` : ')')
  } else {
    newColorStrings.color =
      `color(srgb ${roundWithDecimal(rgbSrgb.r / 255, 4)} ${roundWithDecimal(rgbSrgb.g / 255, 4)} ${roundWithDecimal(rgbSrgb.b / 255, 4)}` +
      (opacity !== 1 ? ` / ${opacity})` : ')')
  }

  newColorStrings.rgba = `rgba(${roundWithDecimal(rgbSrgb.r, 0)}, ${roundWithDecimal(rgbSrgb.g, 0)}, ${roundWithDecimal(rgbSrgb.b, 0)}, ${opacity})`

  if (opacity !== 1) {
    newColorStrings.hex = formatHex8(
      `rgba(${roundWithDecimal(rgbSrgb.r, 0)}, ${roundWithDecimal(rgbSrgb.g, 0)}, ${roundWithDecimal(rgbSrgb.b, 0)}, ${opacity})`
    )!.toUpperCase()
  } else {
    newColorStrings.hex = formatHex(
      `rgb(${roundWithDecimal(rgbSrgb.r, 0)}, ${roundWithDecimal(rgbSrgb.g, 0)}, ${roundWithDecimal(rgbSrgb.b, 0)})`
    )!.toUpperCase()
  }

  return newColorStrings
}
