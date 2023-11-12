import { ColorCodesInputValues, ColorHxya, ColorModelList, ColorHxy, Opacity, CurrentBgOrFg, CurrentColorModel } from '../../../../../types'
import { converter } from '../../../../helpers/colors/culori.mjs'
import convertRgbToHxy from '../../../../helpers/colors/convertRgbToHxy/convertRgbToHxy'
import getClampedChroma from '../../../../helpers/colors/getClampedChroma/getClampedChroma'
import { $colorHxya } from '../../../../stores/colors/colorHxya/colorHxya'
import { $currentColorModel } from '../../../../stores/colors/currentColorModel/currentColorModel'
import { $currentBgOrFg } from '../../../../stores/contrasts/currentBgOrFg/currentBgOrFg'
import getColorHxyDecimals from '../../../../helpers/colors/getColorHxyDecimals/getColorHxyDecimals'
import round from 'lodash/round'
import isColorCodeInGoodFormat from '../isColorCodeInGoodFormat/isColorCodeInGoodFormat'

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

  let colorFormat: keyof typeof ColorCodesInputValues | keyof typeof ColorModelList = eventTargetId

  if (eventTargetId === 'currentColorModel') {
    if (['oklch', 'oklchCss'].includes(currentColorModel)) {
      colorFormat = 'oklch'
    } else {
      colorFormat = currentColorModel
    }
  }

  // For hex, the color eventTargetValue is already checked bellow with convertToRgb().
  if (colorFormat !== 'hex') {
    if (!isColorCodeInGoodFormat({ color: eventTargetValue, format: colorFormat })) return
  }

  let regex: RegExp
  let matches: RegExpMatchArray | [] = []

  let newColorHxy: ColorHxy = {
    h: 0,
    x: 0,
    y: 0
  }
  let newColorA: Opacity = 1

  if (eventTargetId === 'currentColorModel') {
    if (['oklch', 'oklchCss'].includes(currentColorModel)) {
      regex = /(\d+(\.\d+)?)/g
      matches = eventTargetValue.match(regex)!

      newColorHxy = {
        h: parseFloat(matches[2]),
        x: parseFloat(matches[1]),
        y: parseFloat(matches[0])
      }

      newColorHxy.x = getClampedChroma(newColorHxy)
    } else {
      if (currentColorModel === 'okhsv') regex = /h:\s*(\d+)\s*,\s*s:\s*(\d+)\s*,\s*v:\s*(\d+)\s*/
      else if (currentColorModel === 'okhsl') regex = /h:\s*(\d+)\s*,\s*s:\s*(\d+)\s*,\s*l:\s*(\d+)\s*/

      matches = eventTargetValue.match(regex!)!
      newColorHxy = {
        h: parseInt(matches[1]),
        x: parseInt(matches[2]),
        y: parseInt(matches[3])
      }
      if (currentBgOrFg === 'fg') newColorA = colorHxya.a
    }
  } else if (eventTargetId === 'color') {
    regex = /(\b\d+(\.\d+)?\b)/g
    matches = eventTargetValue.match(regex)!

    newColorHxy = convertRgbToHxy({
      colorRgb: {
        r: parseFloat(matches![0]),
        g: parseFloat(matches![1]),
        b: parseFloat(matches![2])
      },
      colorSpace: ['oklch', 'oklchCss'].includes(currentColorModel) ? 'p3' : 'rgb',
      keepOklchDoubleDigit: true
    })
  } else if (eventTargetId === 'rgba') {
    regex = /(\d+(\.\d+)?)/g
    matches = eventTargetValue.match(regex)!

    newColorHxy = convertRgbToHxy({
      colorRgb: {
        r: parseFloat(matches![0]) / 255,
        g: parseFloat(matches![1]) / 255,
        b: parseFloat(matches![2]) / 255
      },
      colorSpace: 'rgb'
    })
  } else if (eventTargetId === 'hex') {
    const newColorRgb = convertToRgb(eventTargetValue)
    if (newColorRgb === undefined) return undefined

    newColorHxy = convertRgbToHxy({
      colorRgb: newColorRgb,
      colorSpace: 'rgb'
    })
    if (newColorRgb.alpha && currentBgOrFg === 'fg') newColorA = newColorRgb.alpha
  }

  if (matches[3]?.valueOf() && currentBgOrFg === 'fg') {
    newColorA = parseFloat(matches![3])
  }

  return { ...newColorHxy, a: newColorA }
}
