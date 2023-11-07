import { ColorHxyDecimals, CurrentColorModel } from '../../../../types'
import { $currentColorModel } from '../../../stores/colors/currentColorModel/currentColorModel'
import { $lockRelativeChroma } from '../../../stores/colors/lockRelativeChroma/lockRelativeChroma'

type Props = {
  currentColorModel?: CurrentColorModel
  lockRelativeChroma?: boolean
  forInputs?: boolean
}

export default function getColorHxyDecimals(props: Props = {}): ColorHxyDecimals {
  const { currentColorModel = $currentColorModel.get(), lockRelativeChroma = $lockRelativeChroma.get(), forInputs = false } = props

  switch (currentColorModel) {
    case 'okhsl':
    case 'okhsv':
      return { h: 0, x: 0, y: 0 }

    case 'oklch':
    case 'oklchCss':
      if (forInputs && currentColorModel === 'oklch') return { h: 1, x: 1, y: 1 }
      else return { h: 1, x: lockRelativeChroma ? 6 : 3, y: 1 }
  }
}
