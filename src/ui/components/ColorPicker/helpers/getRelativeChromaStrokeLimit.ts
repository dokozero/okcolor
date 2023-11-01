import { PICKER_SIZE, OKLCH_CHROMA_SCALE, MAX_CHROMA_P3 } from '../../../../constants'
import { SvgPath } from '../../../../types'
import { clampChromaInGamut } from '../../../helpers/colors/culori.mjs'
import { $colorHxya } from '../../../stores/colors/colorHxya'
import { $fileColorProfile } from '../../../stores/colors/fileColorProfile'
import { $relativeChroma } from '../../../stores/colors/relativeChroma'

export default function getRelativeChromaStrokeLimit(): SvgPath {
  let d = 'M0 0 '

  const precision = 0.75

  for (let l = 0; l < PICKER_SIZE; l += 1 / precision) {
    const maxChromaCurrentProfil = clampChromaInGamut(
      {
        mode: 'oklch',
        l: (PICKER_SIZE - l) / PICKER_SIZE,
        c: MAX_CHROMA_P3,
        h: $colorHxya.get().h
      },
      'oklch',
      $fileColorProfile.get()
    )
    d += `L${(maxChromaCurrentProfil.c * ($relativeChroma.get() / 100) * PICKER_SIZE * OKLCH_CHROMA_SCALE).toFixed(2)} ${l} `
  }

  return d
}
