import { MAX_CHROMA_P3 } from '../../../../constants'
import { ColorHxy, RelativeChroma, AbsoluteChroma, CurrentFileColorProfile } from '../../../../types'
import { $currentFileColorProfile } from '../../../stores/colors/currentFileColorProfile/currentFileColorProfile'
import { clampChromaInGamut } from '../culori.mjs'
import clamp from 'lodash/clamp'

type Props = {
  colorHxy: ColorHxy
  currentFileColorProfile?: CurrentFileColorProfile
}

export default function convertAbsoluteChromaToRelative(props: Props): RelativeChroma {
  const { colorHxy, currentFileColorProfile = $currentFileColorProfile.get() } = props

  // We do this test because with a lightness of 0, we get an undefined value for currentMaxChroma.c
  if (colorHxy.y === 0) return 0

  const currentMaxChroma: AbsoluteChroma = clampChromaInGamut(
    { mode: 'oklch', l: colorHxy.y / 100, c: MAX_CHROMA_P3, h: colorHxy.h },
    'oklch',
    currentFileColorProfile
  ).c

  // Sometimes we can get 101%, like with #FFFF00, so we use clamp().
  return clamp(Math.round((colorHxy.x * 100) / currentMaxChroma), 0, 100)
}
