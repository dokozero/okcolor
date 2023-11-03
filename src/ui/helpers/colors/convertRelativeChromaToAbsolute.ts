import { MAX_CHROMA_P3 } from '../../../constants'
import { ColorHxy, ColorHxya, RelativeChroma } from '../../../types'
import { getColorValueDecimals } from '../../stores/colors/colorHxya'
import { $fileColorProfile } from '../../stores/colors/fileColorProfile'
import { $relativeChroma } from '../../stores/colors/relativeChroma'
import roundWithDecimal from '../numbers/roundWithDecimal'
import { clampChromaInGamut } from './culori.mjs'

type Props = {
  colorHxya: ColorHxya | ColorHxy
  relativeChroma?: RelativeChroma
}

// TODO - optimized param, only give H and Y?
export default function convertRelativeChromaToAbsolute(props: Props): RelativeChroma {
  const { colorHxya: colorHxy, relativeChroma = $relativeChroma.get() } = props

  // We do this test because with a lightness of 0, we get an undefined value for currentMaxChroma.c.
  if (colorHxy.y === 0) return 0

  const currentMaxChroma = clampChromaInGamut(
    { mode: 'oklch', l: colorHxy.y / 100, c: MAX_CHROMA_P3, h: colorHxy.h },
    'oklch',
    $fileColorProfile.get()
  ).c

  const returnValue = (relativeChroma * currentMaxChroma) / 100

  return roundWithDecimal(returnValue, getColorValueDecimals().x)
}
