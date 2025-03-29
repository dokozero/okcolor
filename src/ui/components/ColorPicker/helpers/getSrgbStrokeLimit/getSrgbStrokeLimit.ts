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

export default function getSrgbStrokeLimit(props: Props): SvgPath {
  const { colorHxya = $colorHxya.get(), oklchRenderMode = $oklchRenderMode.get(), position } = props

  let d = 'M0 0 '

  const precision = 0.5

  let sRGBMaxChroma: any
  let p3MaxChroma: any

  let xPosition: number
  let yPosition: number
  let sRGBMaxChromaMappedToMaxChromaP3: number

  for (let l = 0; l <= PICKER_SIZE; l += 1 / precision) {
    yPosition = getLinearMappedValue({
      valueToMap: l,
      originalRange: { min: 0, max: PICKER_SIZE },
      targetRange: { min: 100, max: 0.5 }
    })

    // We do this to get a straight line near the bottom and avoid a zig-zag.
    if (oklchRenderMode === 'square' && position === 100 && yPosition < 10) {
      yPosition = 10
    }

    sRGBMaxChroma = clampChromaInGamut(
      {
        mode: 'oklch',
        l: yPosition / 100,
        c: MAX_CHROMA_P3,
        h: colorHxya.h
      },
      'oklch',
      'rgb'
    )

    p3MaxChroma = clampChromaInGamut(
      {
        mode: 'oklch',
        l: yPosition / 100,
        c: MAX_CHROMA_P3,
        h: colorHxya.h
      },
      'oklch',
      'p3'
    )

    sRGBMaxChromaMappedToMaxChromaP3 = getLinearMappedValue({
      valueToMap: sRGBMaxChroma.c,
      originalRange: { min: 0, max: p3MaxChroma.c },
      targetRange: { min: 0, max: MAX_CHROMA_P3 }
    })

    xPosition = getLinearMappedValue({
      valueToMap: position,
      originalRange: {
        min: 0,
        max: 100
      },
      targetRange: {
        min: sRGBMaxChroma.c,
        max: sRGBMaxChromaMappedToMaxChromaP3
      }
    })

    d += `L${(xPosition * PICKER_SIZE * OKLCH_CHROMA_SCALE).toFixed(2)} ${l} `
  }

  return d
}
