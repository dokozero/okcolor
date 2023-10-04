import { PICKER_SIZE, OKLCH_CHROMA_SCALE } from '../../../../constants'
import { $colorHxya } from '../../../store'
import { clampChromaInGamut } from '../../../helpers/culori.mjs'

export default function getSrgbStrokeLimit(): string {
  let d = 'M0 0 '

  const precision = 0.75
  // Precision 0.5 to reduce the load; the rest will be rendered by the browser itself.
  // It gives a slightly skewed angle at hue 0 and 360; it can be slightly increased
  for (let l = 0; l < PICKER_SIZE; l += 1 / precision) {
    const sRGBMaxChroma = clampChromaInGamut(
      {
        mode: 'oklch',
        l: (PICKER_SIZE - l) / PICKER_SIZE,
        c: 0.37,
        h: $colorHxya.get().h
      },
      'oklch',
      'rgb'
    )
    d += `L${(sRGBMaxChroma.c * PICKER_SIZE * OKLCH_CHROMA_SCALE).toFixed(2)} ${l} `
  }

  return d
}
