import { clampChromaInGamut } from '../../../../helpers/colors/culori.mjs'
import { PICKER_SIZE, OKLCH_CHROMA_SCALE, MAX_CHROMA_P3 } from '../../../../../constants'
import { ColorHxya, SvgPath } from '../../../../../types'
import { $colorHxya } from '../../../../stores/colors/colorHxya/colorHxya'

type Props = {
  colorHxya?: ColorHxya
}

export default function getSrgbStrokeLimit(props: Props = {}): SvgPath {
  const { colorHxya = $colorHxya.get() } = props

  let d = 'M0 0 '

  const precision = 0.75

  for (let l = 0; l < PICKER_SIZE; l += 1 / precision) {
    const sRGBMaxChroma = clampChromaInGamut(
      {
        mode: 'oklch',
        l: (PICKER_SIZE - l) / PICKER_SIZE,
        c: MAX_CHROMA_P3,
        h: colorHxya.h
      },
      'oklch',
      'rgb'
    )
    d += `L${(sRGBMaxChroma.c * PICKER_SIZE * OKLCH_CHROMA_SCALE).toFixed(2)} ${l} `
  }

  return d
}
