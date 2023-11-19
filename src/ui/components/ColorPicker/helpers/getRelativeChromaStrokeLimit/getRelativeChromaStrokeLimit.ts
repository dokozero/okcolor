import { clampChromaInGamut } from '../../../../helpers/colors/culori.mjs'
import { PICKER_SIZE, OKLCH_CHROMA_SCALE, MAX_CHROMA_P3 } from '../../../../../constants'
import { ColorHxya, CurrentFileColorProfile, RelativeChroma, SvgPath } from '../../../../../types'
import { $colorHxya } from '../../../../stores/colors/colorHxya/colorHxya'
import { $currentFileColorProfile } from '../../../../stores/colors/currentFileColorProfile/currentFileColorProfile'
import { $relativeChroma } from '../../../../stores/colors/relativeChroma/relativeChroma'

type Props = {
  colorHxya?: ColorHxya
  currentFileColorProfile?: CurrentFileColorProfile
  relativeChroma?: RelativeChroma
}

export default function getRelativeChromaStrokeLimit(props: Props = {}): SvgPath {
  const { colorHxya = $colorHxya.get(), currentFileColorProfile = $currentFileColorProfile.get(), relativeChroma = $relativeChroma.get() } = props

  let d = 'M0 0 '

  const precision = 0.75

  for (let l = 0; l < PICKER_SIZE; l += 1 / precision) {
    const maxChromaCurrentProfil = clampChromaInGamut(
      {
        mode: 'oklch',
        l: (PICKER_SIZE - l) / PICKER_SIZE,
        c: MAX_CHROMA_P3,
        h: colorHxya.h
      },
      'oklch',
      currentFileColorProfile
    )
    d += `L${(maxChromaCurrentProfil.c * (relativeChroma / 100) * PICKER_SIZE * OKLCH_CHROMA_SCALE).toFixed(2)} ${l} `
  }

  return d
}
