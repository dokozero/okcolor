import { ColorHxy, RelativeChroma } from '../../../../types'
import { $fileColorProfile } from '../../../stores/colors/fileColorProfile/fileColorProfile'
import { clampChromaInGamut } from '../culori.mjs'
import round from 'lodash/round'

export default function getClampedChroma(colorHxy: ColorHxy, fileColorProfile = $fileColorProfile.get()): RelativeChroma {
  const clamped = clampChromaInGamut({ mode: 'oklch', l: colorHxy.y / 100, c: colorHxy.x, h: colorHxy.h }, 'oklch', fileColorProfile)

  // If we send a pure black to clampChromaInGamut (l and c to 0), clamped.c will be undefined.
  if (!clamped.c) return 0

  if (colorHxy.x > clamped.c) return round(clamped.c, 3)

  return colorHxy.x
}
