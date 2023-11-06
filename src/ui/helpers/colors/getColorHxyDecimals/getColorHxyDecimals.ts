import { ColorHxyDecimals } from '../../../../types'
import { $currentColorModel } from '../../../stores/colors/currentColorModel/currentColorModel'
import { $lockRelativeChroma } from '../../../stores/colors/lockRelativeChroma/lockRelativeChroma'

export default function getColorHxyDecimals(
  currentColorModel = $currentColorModel.get(),
  lockRelativeChroma = $lockRelativeChroma.get()
): ColorHxyDecimals {
  switch (currentColorModel) {
    case 'okhsl':
    case 'okhsv':
      return { h: 0, x: 0, y: 0 }
    case 'oklch':
    case 'oklchCss':
      return { h: 1, x: lockRelativeChroma ? 6 : 3, y: 1 }
    default:
      return { h: 0, x: 0, y: 0 }
  }
}
