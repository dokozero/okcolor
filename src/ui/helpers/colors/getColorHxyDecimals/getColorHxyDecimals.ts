import { ColorHxyDecimals, CurrentColorModel, OklchHlDecimalPrecisionRange } from '../../../../types'
import { $currentColorModel } from '../../../stores/colors/currentColorModel/currentColorModel'
import { $lockRelativeChroma } from '../../../stores/colors/lockRelativeChroma/lockRelativeChroma'
import { $userSettings } from '../../../stores/settings/userSettings/userSettings'

type Props = {
  currentColorModel?: CurrentColorModel
  useSimplifiedChroma?: boolean
  oklchHlDecimalPrecision?: OklchHlDecimalPrecisionRange
  lockRelativeChroma?: boolean
  forInputs?: boolean
}

export default function getColorHxyDecimals(props: Props = {}): ColorHxyDecimals {
  const {
    currentColorModel = $currentColorModel.get(),
    useSimplifiedChroma = $userSettings.get().useSimplifiedChroma,
    oklchHlDecimalPrecision = $userSettings.get().oklchHlDecimalPrecision,
    lockRelativeChroma = $lockRelativeChroma.get(),
    forInputs = false
  } = props

  const returnObject: ColorHxyDecimals = { h: 0, x: 0, y: 0 }

  if (currentColorModel === 'oklch') {
    returnObject.h = oklchHlDecimalPrecision
    returnObject.y = oklchHlDecimalPrecision

    if (forInputs && useSimplifiedChroma) {
      returnObject.x = 1
    } else {
      // TODO - no need if x is always 6 decimals.
      returnObject.x = lockRelativeChroma ? 6 : 6
    }
  }

  return returnObject
}
