import { MAX_CHROMA_P3 } from '../../../../constants'
import { RelativeChroma, FileColorProfile, Lightness, Hue } from '../../../../types'
import { $fileColorProfile } from '../../../stores/colors/fileColorProfile/fileColorProfile'
import { $relativeChroma } from '../../../stores/colors/relativeChroma/relativeChroma'
import roundWithDecimal from '../../numbers/roundWithDecimal/roundWithDecimal'
import { clampChromaInGamut } from '../culori.mjs'
import getColorHxyDecimals from '../getColorHxyDecimals/getColorHxyDecimals'

type Props = {
  h: Hue
  y: Lightness
  relativeChroma?: RelativeChroma
  fileColorProfile?: FileColorProfile
}

export default function convertRelativeChromaToAbsolute(props: Props): RelativeChroma {
  const { h, y, relativeChroma = $relativeChroma.get(), fileColorProfile = $fileColorProfile.get() } = props

  // We do this test because with a lightness of 0, we get an undefined value for currentMaxChroma.c.
  if (y === 0) return 0

  const currentMaxChroma = clampChromaInGamut({ mode: 'oklch', l: y / 100, c: MAX_CHROMA_P3, h: h }, 'oklch', fileColorProfile).c

  const returnValue = (relativeChroma * currentMaxChroma) / 100

  return roundWithDecimal(returnValue, getColorHxyDecimals().x)
}
