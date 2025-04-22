import { ColorCodesInputValues, ColorHxya, ColorHxy, Opacity, CurrentBgOrFg, CurrentColorModel } from '../../../../../types'
import convertRgbToHxy from '../../../../helpers/colors/convertRgbToHxy/convertRgbToHxy'
import getClampedChroma from '../../../../helpers/colors/getClampedChroma/getClampedChroma'
import { $colorHxya } from '../../../../stores/colors/colorHxya/colorHxya'
import { $currentColorModel } from '../../../../stores/colors/currentColorModel/currentColorModel'
import { $currentBgOrFg } from '../../../../stores/contrasts/currentBgOrFg/currentBgOrFg'
import getColorHxyDecimals from '../../../../helpers/colors/getColorHxyDecimals/getColorHxyDecimals'
import round from 'lodash/round'
import { converter } from 'culori'

const convertToRgb = converter('rgb')

type Props = {
  eventTargetId: keyof typeof ColorCodesInputValues
  eventTargetValue: string
  colorHxya?: ColorHxya
  currentColorModel?: CurrentColorModel
  currentBgOrFg?: CurrentBgOrFg
}

export default function getNewColorHxya(props: Props): ColorHxya | undefined {
  const {
    eventTargetId,
    eventTargetValue,
    colorHxya = $colorHxya.get(),
    currentColorModel = $currentColorModel.get(),
    currentBgOrFg = $currentBgOrFg.get()
  } = props

  let regex: RegExp
  let matches: RegExpMatchArray | null

  let newColorHxy: ColorHxy = {
    h: 0,
    x: 0,
    y: 0
  }
  let newColorA: Opacity = 1

  if (eventTargetId === 'currentColorModel') {
    regex = /(\d+(\.\d+)?)/g
    matches = eventTargetValue.match(regex)
    // Just in case of the isColorCodeInGoodFormat() didn't catched an error.
    if (!matches) return

    if (currentColorModel === 'oklch') {
      newColorHxy = {
        h: round(parseFloat(matches[2]), getColorHxyDecimals().h),
        x: parseFloat(matches[1]),
        y: round(parseFloat(matches[0]), getColorHxyDecimals().h)
      }

      newColorHxy.x = round(getClampedChroma(newColorHxy), getColorHxyDecimals().x)

      if (matches[3]?.valueOf() && currentBgOrFg === 'fg') {
        newColorA = parseFloat(matches![3])
      }
    } else {
      newColorHxy = {
        h: parseInt(matches[0]),
        x: round(parseFloat(matches[1]) * 100, getColorHxyDecimals().x),
        y: round(parseFloat(matches[2]) * 100, getColorHxyDecimals().y)
      }
      if (currentBgOrFg === 'fg') newColorA = colorHxya.a
    }
  } else if (eventTargetId === 'color') {
    regex = /(\b\d+(\.\d+)?\b)/g
    matches = eventTargetValue.match(regex)
    // Just in case of the isColorCodeInGoodFormat() didn't catched an error.
    if (!matches) return

    newColorHxy = convertRgbToHxy({
      colorRgb: {
        r: parseFloat(matches![0]),
        g: parseFloat(matches![1]),
        b: parseFloat(matches![2])
      },
      colorSpace: currentColorModel === 'oklch' ? 'p3' : 'rgb'
    })

    if (matches[3]?.valueOf() && currentBgOrFg === 'fg') {
      newColorA = parseFloat(matches![3])
    }
  } else if (eventTargetId === 'rgba') {
    regex = /(\d+(\.\d+)?)/g
    matches = eventTargetValue.match(regex)
    // Just in case of the isColorCodeInGoodFormat() didn't catched an error.
    if (!matches) return

    newColorHxy = convertRgbToHxy({
      colorRgb: {
        r: parseFloat(matches![0]) / 255,
        g: parseFloat(matches![1]) / 255,
        b: parseFloat(matches![2]) / 255
      },
      colorSpace: 'rgb'
    })

    if (matches[3]?.valueOf() && currentBgOrFg === 'fg') {
      newColorA = parseFloat(matches![3])
    }
  } else if (eventTargetId === 'hex') {
    const newColorRgb = convertToRgb(eventTargetValue)
    if (!newColorRgb) return

    newColorHxy = convertRgbToHxy({
      colorRgb: newColorRgb,
      colorSpace: 'rgb'
    })

    if (newColorRgb.alpha && currentBgOrFg === 'fg') {
      newColorA = newColorRgb.alpha
    }
  }

  return { ...newColorHxy, a: newColorA }
}
