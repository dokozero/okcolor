import { clampChroma } from 'culori'
import { MAX_CHROMA_P3 } from '../../../../constants'
import { RelativeChroma, CurrentFileColorProfile, Lightness, Hue } from '../../../../types'
import { $currentFileColorProfile } from '../../../stores/colors/currentFileColorProfile/currentFileColorProfile'
import { $relativeChroma } from '../../../stores/colors/relativeChroma/relativeChroma'
import getColorHxyDecimals from '../getColorHxyDecimals/getColorHxyDecimals'
import round from 'lodash/round'

type Props = {
  h: Hue
  y: Lightness
  relativeChroma?: RelativeChroma
  currentFileColorProfile?: CurrentFileColorProfile
}

export default function convertRelativeChromaToAbsolute(props: Props): RelativeChroma {
  const { h, y, relativeChroma = $relativeChroma.get(), currentFileColorProfile = $currentFileColorProfile.get() } = props

  // We do this test because with a lightness of 0, we get an undefined value for currentMaxChroma.c.
  if (y === 0) return 0

  const currentMaxChroma = clampChroma({ mode: 'oklch', l: y / 100, c: MAX_CHROMA_P3, h: h }, 'oklch', currentFileColorProfile).c

  const returnValue = (relativeChroma * currentMaxChroma) / 100

  return round(returnValue, getColorHxyDecimals().x)
}
