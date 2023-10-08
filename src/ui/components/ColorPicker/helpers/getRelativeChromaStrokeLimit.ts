import { PICKER_SIZE, OKLCH_CHROMA_SCALE, MAX_CHROMA_P3 } from '../../../../constants'
import { clampChromaInGamut } from '../../../helpers/culori.mjs'
import { $colorHxya, $fileColorProfile, $relativeChroma } from '../../../store'

export default function getRelativeChromaStrokeLimit(): string {
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
    d += `L${(maxChromaCurrentProfil.c * ($relativeChroma.get()! / 100) * PICKER_SIZE * OKLCH_CHROMA_SCALE).toFixed(2)} ${l} `
  }

  return d
}
