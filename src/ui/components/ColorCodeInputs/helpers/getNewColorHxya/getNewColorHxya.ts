import { ColorCodesInputValues, ColorHxya, ColorModelList, ColorHxy, Opacity } from '../../../../../types'
import { converter } from '../../../../helpers/colors/culori.mjs'
import convertRgbToHxy from '../../../../helpers/colors/convertRgbToHxy/convertRgbToHxy'
import getClampedChroma from '../../../../helpers/colors/getClampedChroma/getClampedChroma'
import roundWithDecimal from '../../../../helpers/numbers/roundWithDecimal/roundWithDecimal'
import { $colorHxya } from '../../../../stores/colors/colorHxya/colorHxya'
import { $currentColorModel } from '../../../../stores/colors/currentColorModel/currentColorModel'
import { $currentBgOrFg } from '../../../../stores/contrasts/currentBgOrFg/currentBgOrFg'
import getColorHxyDecimals from '../../../../helpers/colors/getColorHxyDecimals/getColorHxyDecimals'

const convertToRgb = converter('rgb')

const isColorCodeInGoodFormat = (color: string, format: string): boolean => {
  let regex
  let match

  let value1
  let value2
  let value3
  let value4

  if (format === 'oklch') {
    regex = /oklch\((\d+(\.\d+)?)%\s(\d+(\.\d+)?)\s(\d+(\.\d+)?)(\s\/\s(\d+(\.\d+)?))?\)/
    match = color.match(regex)

    if (!match) {
      return false
    }

    value1 = parseFloat(match[1])
    value2 = parseFloat(match[3])
    value3 = parseFloat(match[5])
    value4 = match[8] ? parseFloat(match[8]) : null

    if (value1 < 0 || value1 > 100) return false
    if (value2 < 0 || value2 > 1) return false
    if (value3 < 0 || value3 > 360) return false
    if (value4 !== null && (value4 < 0 || value4 > 1)) return false
  } else if (format === 'okhsl') {
    regex = /h:\s*(\d+)\s*,\s*s:\s*(\d+)\s*,\s*l:\s*(\d+)\s*/
    match = color.match(regex)

    if (!match) return false

    value1 = parseInt(match[1])
    value2 = parseInt(match[2])
    value3 = parseInt(match[3])

    if (value1 < 0 || value1 > 360) return false
    if (value2 < 0 || value2 > 100) return false
    if (value3 < 0 || value3 > 100) return false
  } else if (format === 'okhsv') {
    regex = /h:\s*(\d+)\s*,\s*s:\s*(\d+)\s*,\s*v:\s*(\d+)\s*/
    match = color.match(regex)

    if (!match) return false

    value1 = parseInt(match[1])
    value2 = parseInt(match[2])
    value3 = parseInt(match[3])

    if (value1 < 0 || value1 > 360) return false
    if (value2 < 0 || value2 > 100) return false
    if (value3 < 0 || value3 > 100) return false
  } else if (format === 'color') {
    if (['okhsv', 'okhsl'].includes($currentColorModel.get())) {
      regex = /color\(srgb\s(\d+(\.\d+)?)\s(\d+(\.\d+)?)\s(\d+(\.\d+)?)(\s\/\s(\d+(\.\d+)?))?\)/
    } else {
      regex = /color\(display-p3\s(\d+(\.\d+)?)\s(\d+(\.\d+)?)\s(\d+(\.\d+)?)(\s\/\s(\d+(\.\d+)?))?\)/
    }

    match = color.match(regex)

    if (!match) return false

    value1 = parseFloat(match[1])
    value2 = parseFloat(match[3])
    value3 = parseFloat(match[5])
    value4 = match[8] ? parseFloat(match[8]) : null

    if (value1 < 0 || value1 > 1) return false
    if (value2 < 0 || value2 > 1) return false
    if (value3 < 0 || value3 > 1) return false
    if (value4 !== null && (value4 < 0 || value4 > 1)) return false
  } else if (format === 'rgba') {
    regex = /rgba\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(,\s*(\d+(\.\d+)?))?\s*\)/
    match = color.match(regex)

    if (!match) {
      regex = /rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)/
      match = color.match(regex)
      if (!match) return false
    }

    value1 = parseInt(match[1])
    value2 = parseInt(match[2])
    value3 = parseInt(match[3])
    value4 = match[5] ? parseFloat(match[5]) : null

    if (value1 < 0 || value1 > 255) return false
    if (value2 < 0 || value2 > 255) return false
    if (value3 < 0 || value3 > 255) return false
    if (value4 !== null && (value4 < 0 || value4 > 1)) return false
  }

  return true
}

export default function getNewColorHxya(eventTargetId: keyof typeof ColorCodesInputValues, eventTargetValue: string): ColorHxya | undefined {
  let colorFormat: keyof typeof ColorCodesInputValues | keyof typeof ColorModelList = eventTargetId

  if (eventTargetId === 'currentColorModel') {
    if (['oklch', 'oklchCss'].includes($currentColorModel.get())) {
      colorFormat = 'oklch'
    } else {
      colorFormat = $currentColorModel.get()
    }
  }

  // For hex, the color eventTargetValue is already checked bellow with convertToRgb().
  if (colorFormat !== 'hex') {
    if (!isColorCodeInGoodFormat(eventTargetValue, colorFormat)) return
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
    if (['oklch', 'oklchCss'].includes($currentColorModel.get())) {
      regex = /(\d+(\.\d+)?)/g
      matches = eventTargetValue.match(regex)!

      newColorHxy = {
        h: parseFloat(matches[2]),
        x: parseFloat(matches[1]),
        y: parseFloat(matches[0])
      }
      if ($currentColorModel.get() === 'oklch') {
        newColorHxy = {
          h: roundWithDecimal(newColorHxy.h, getColorHxyDecimals().h),
          x: roundWithDecimal(newColorHxy.x * 100, getColorHxyDecimals().x),
          y: roundWithDecimal(newColorHxy.y, getColorHxyDecimals().y)
        }
      }

      newColorHxy.x = getClampedChroma(newColorHxy)
    } else {
      if ($currentColorModel.get() === 'okhsv') regex = /h:\s*(\d+)\s*,\s*s:\s*(\d+)\s*,\s*v:\s*(\d+)\s*/
      else if ($currentColorModel.get() === 'okhsl') regex = /h:\s*(\d+)\s*,\s*s:\s*(\d+)\s*,\s*l:\s*(\d+)\s*/

      matches = eventTargetValue.match(regex!)!
      newColorHxy = {
        h: parseInt(matches[1]),
        x: parseInt(matches[2]),
        y: parseInt(matches[3])
      }
      if ($currentBgOrFg.get() === 'fg') newColorA = $colorHxya.get().a
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
      colorSpace: ['oklch', 'oklchCss'].includes($currentColorModel.get()) ? 'p3' : 'rgb',
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
    if (newColorRgb.alpha && $currentBgOrFg.get() === 'fg') newColorA = newColorRgb.alpha
  }

  if (matches[3]?.valueOf() && $currentBgOrFg.get() === 'fg') {
    newColorA = parseFloat(matches![3])
  }

  return { ...newColorHxy, a: newColorA }
}
