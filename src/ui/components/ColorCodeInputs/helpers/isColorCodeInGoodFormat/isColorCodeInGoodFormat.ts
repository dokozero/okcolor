import { converter } from '../../../../helpers/colors/culori.mjs'
import { CurrentColorModel } from '../../../../../types'
import { $currentColorModel } from '../../../../stores/colors/currentColorModel/currentColorModel'

const convertToRgb = converter('rgb')

type Props = {
  color: string
  format: string
  currentColorModel?: CurrentColorModel
}

export default function isColorCodeInGoodFormat(props: Props): boolean {
  const { color, format, currentColorModel = $currentColorModel.get() } = props

  let regex: RegExp
  let match: RegExpMatchArray | null

  let value1: number
  let value2: number
  let value3: number
  let value4: number | null

  if (format === 'oklch') {
    regex = /oklch\((\d+(\.\d+)?)%\s*(\d*(\.\d+)?)\s*(\d+(\.\d+)?)(\s*\/\s*(\d+(\.\d+)?))?\)/
    match = color.match(regex)

    if (!match) return false

    value1 = parseFloat(match[1])
    value2 = parseFloat(match[3])
    value3 = parseFloat(match[5])
    value4 = match[8] ? parseFloat(match[8]) : null

    if (value1 < 0 || value1 > 100) return false
    if (value2 < 0 || value2 > 1) return false
    if (value3 < 0 || value3 > 360) return false
    if (value4 !== null && (value4 < 0 || value4 > 1)) return false
  } else if (format === 'okhsl') {
    regex = /{mode:\s*"okhsl",\s*h:\s*(\d+)\s*,\s*s:\s*(\d+(\.\d+)?)\s*,\s*l:\s*(\d+(\.\d+)?)\s*}/
    match = color.match(regex)

    if (!match) return false

    value1 = parseInt(match[1])
    value2 = parseFloat(match[2])
    value3 = parseFloat(match[4])

    if (value1 < 0 || value1 > 360) return false
    if (value2 < 0 || value2 > 1) return false
    if (value3 < 0 || value3 > 1) return false
  } else if (format === 'okhsv') {
    regex = /{mode:\s*"okhsv",\s*h:\s*(\d+)\s*,\s*s:\s*(\d+(\.\d+)?)\s*,\s*v:\s*(\d+(\.\d+)?)\s*}/
    match = color.match(regex)

    if (!match) return false

    value1 = parseInt(match[1])
    value2 = parseFloat(match[2])
    value3 = parseFloat(match[4])

    if (value1 < 0 || value1 > 360) return false
    if (value2 < 0 || value2 > 1) return false
    if (value3 < 0 || value3 > 1) return false
  } else if (format === 'color') {
    if (['okhsv', 'okhsl'].includes(currentColorModel)) {
      regex = /color\(srgb\s*(\d+(\.\d+)?)\s*(\d+(\.\d+)?)\s*(\d+(\.\d+)?)(\s*\/\s*(\d+(\.\d+)?))?\)/
    } else {
      regex = /color\(display-p3\s*(\d+(\.\d+)?)\s*(\d+(\.\d+)?)\s*(\d+(\.\d+)?)(\s*\/\s*(\d+(\.\d+)?))?\)/
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
  } else if (format === 'hex') {
    const newColorRgb = convertToRgb(color)
    if (!newColorRgb) return false
  }

  return true
}
