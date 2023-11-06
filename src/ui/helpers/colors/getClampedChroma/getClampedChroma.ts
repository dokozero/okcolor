import { ColorHxy, RelativeChroma } from '../../../../types'
import { $fileColorProfile } from '../../../stores/colors/fileColorProfile/fileColorProfile'
import roundWithDecimal from '../../numbers/roundWithDecimal/roundWithDecimal'
import { clampChromaInGamut } from '../culori.mjs'

export default function getClampedChroma(props: ColorHxy): RelativeChroma {
  const { h, x, y } = props

  const clamped = clampChromaInGamut({ mode: 'oklch', l: y / 100, c: x, h: h }, 'oklch', $fileColorProfile.get())

  // If we send a pure black to clampChromaInGamut (l and c to 0), clamped.c will be undefined.
  if (!clamped.c) return 0

  if (x > clamped.c) return roundWithDecimal(clamped.c, 3)

  return x
}