import { clampChromaInGamut } from '../../../../helpers/colors/culori.mjs'
import { PICKER_SIZE, OKLCH_CHROMA_SCALE, MAX_CHROMA_P3 } from '../../../../../constants'
import { ColorHxya, OklchRenderMode, SvgPath } from '../../../../../types'
import { $colorHxya } from '../../../../stores/colors/colorHxya/colorHxya'
import { $oklchRenderMode } from '../../../../stores/oklchRenderMode/oklchRenderMode'
import getLinearMappedValue from '../../../../helpers/getLinearMappedValue/getLinearMappedValue'

type Props = {
  colorHxya?: ColorHxya
  oklchRenderMode?: OklchRenderMode
  position: number
}

let lightnessValueToUse: number

export default function getSrgbStrokeLimit(props: Props): SvgPath {
  const { colorHxya = $colorHxya.get(), oklchRenderMode = $oklchRenderMode.get(), position } = props

  let d = 'M0 0 '

  const precision = 0.5

  for (let l = 0; l < PICKER_SIZE; l += 1 / precision) {
    let xPosition

    // We do this to avoid not stright line at of the line near the bottom.
    if (oklchRenderMode === 'square' && position === 100 && l > 230) {
      lightnessValueToUse = 230
    } else {
      lightnessValueToUse = l
    }

    const sRGBMaxChroma = clampChromaInGamut(
      {
        mode: 'oklch',
        l: (PICKER_SIZE - lightnessValueToUse) / PICKER_SIZE,
        c: MAX_CHROMA_P3,
        h: colorHxya.h
      },
      'oklch',
      'rgb'
    )

    const p3MaxChroma = clampChromaInGamut(
      {
        mode: 'oklch',
        l: (PICKER_SIZE - lightnessValueToUse) / PICKER_SIZE,
        c: MAX_CHROMA_P3,
        h: colorHxya.h
      },
      'oklch',
      'p3'
    )

    if (oklchRenderMode === 'triangle') {
      // const finalPosition = (sRGBMaxChroma.c * MAX_CHROMA_P3) / p3MaxChroma.c
      // xPosition = sRGBMaxChroma.c
      // const startPosition = lerp(sRGBMaxChroma.c, 0, p3MaxChroma.c, 0, MAX_CHROMA_P3)
      const startPosition = getLinearMappedValue({
        valueToMap: sRGBMaxChroma.c,
        originalRange: { min: 0, max: p3MaxChroma.c },
        targetRange: { min: 0, max: MAX_CHROMA_P3 }
      })

      // xPosition = lerp(position, 100, 0, startPosition, sRGBMaxChroma.c)
      xPosition = getLinearMappedValue({
        valueToMap: position,
        originalRange: { min: 100, max: 0 },
        targetRange: { min: startPosition, max: sRGBMaxChroma.c }
      })

      // const temp = 100 / position
      // const max = (MAX_CHROMA_P3 - xPosition) / temp

      // if (position > 0) {
      // xPosition += max
      // }
    } else {
      // const finalPosition = lerp(sRGBMaxChroma.c, 0, p3MaxChroma.c, 0, MAX_CHROMA_P3)
      const finalPosition = getLinearMappedValue({
        valueToMap: sRGBMaxChroma.c,
        originalRange: { min: 0, max: p3MaxChroma.c },
        targetRange: { min: 0, max: MAX_CHROMA_P3 }
      })

      // xPosition = lerp(position, 0, 100, sRGBMaxChroma.c, finalPosition)
      xPosition = getLinearMappedValue({
        valueToMap: position,
        originalRange: { min: 0, max: 100 },
        targetRange: { min: sRGBMaxChroma.c, max: finalPosition }
      })
    }

    d += `L${(xPosition * PICKER_SIZE * OKLCH_CHROMA_SCALE).toFixed(2)} ${l} `
  }

  return d
}
