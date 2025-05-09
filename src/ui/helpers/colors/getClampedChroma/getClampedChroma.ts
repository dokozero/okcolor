import { ColorHxy, RelativeChroma } from '../../../../types'
import { $currentFileColorProfile } from '../../../stores/colors/currentFileColorProfile/currentFileColorProfile'
import round from 'lodash/round'
import getColorHxyDecimals from '../getColorHxyDecimals/getColorHxyDecimals'
import { clampChroma } from 'culori'

export default function getClampedChroma(colorHxy: ColorHxy, currentFileColorProfile = $currentFileColorProfile.get()): RelativeChroma {
  const clamped = clampChroma({ mode: 'oklch', l: colorHxy.y / 100, c: colorHxy.x, h: colorHxy.h }, 'oklch', currentFileColorProfile)

  // If we send a pure black to clampChroma (l and c to 0), clamped.c will be undefined.
  if (!clamped.c) return 0

  if (colorHxy.x > clamped.c) return round(clamped.c, getColorHxyDecimals().x)

  return colorHxy.x
}
