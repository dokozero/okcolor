import { clampChromaInGamut } from '../../../../helpers/colors/culori.mjs'
import { PICKER_SIZE, OKLCH_CHROMA_SCALE, MAX_CHROMA_P3 } from '../../../../../constants'
import { ColorHxya, CurrentFileColorProfile, OklchRenderMode, RelativeChroma, SvgPath } from '../../../../../types'
import { $colorHxya } from '../../../../stores/colors/colorHxya/colorHxya'
import { $currentFileColorProfile } from '../../../../stores/colors/currentFileColorProfile/currentFileColorProfile'
import { $relativeChroma } from '../../../../stores/colors/relativeChroma/relativeChroma'
import { $oklchRenderMode } from '../../../../stores/oklchRenderMode/oklchRenderMode'
import getLinearMappedValue from '../../../../helpers/getLinearMappedValue/getLinearMappedValue'

type Props = {
  colorHxya?: ColorHxya
  currentFileColorProfile?: CurrentFileColorProfile
  relativeChroma?: RelativeChroma
  oklchRenderMode?: OklchRenderMode
  position: number
}

export default function getRelativeChromaStrokeLimit(props: Props): SvgPath {
  const {
    colorHxya = $colorHxya.get(),
    currentFileColorProfile = $currentFileColorProfile.get(),
    relativeChroma = $relativeChroma.get(),
    oklchRenderMode = $oklchRenderMode.get(),
    position
  } = props

  let d = 'M0 0 '

  const precision = 0.5

  for (let l = 0; l < PICKER_SIZE; l += 1 / precision) {
    if (oklchRenderMode === 'triangle') {
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

      const finalPosition = maxChromaCurrentProfil.c * (relativeChroma / 100) * PICKER_SIZE * OKLCH_CHROMA_SCALE

      // const finalPosition = lerp(sRGBMaxChroma.c, 0, p3MaxChroma.c, 0, MAX_CHROMA_P3)
      // const finalPosition = lerp(relativeChroma, 0, 100, 0, MAX_CHROMA_P3) * PICKER_SIZE * OKLCH_CHROMA_SCALE
      const startPosition = (relativeChroma * PICKER_SIZE) / 100

      // const xPosition = lerp(position, 100, 0, startPosition, finalPosition)
      const xPosition = getLinearMappedValue({
        valueToMap: position,
        originalRange: { min: 100, max: 0 },
        targetRange: { min: startPosition, max: finalPosition }
      })

      d += `L${xPosition.toFixed(2)} ${l} `

      // d += `L${((relativeChroma * PICKER_SIZE) / 100).toFixed(2)} ${l} `
      // d += `L${(maxChromaCurrentProfil.c * (relativeChroma / 100) * PICKER_SIZE * OKLCH_CHROMA_SCALE).toFixed(2)} ${l} `
    } else {
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

      const startPosition = maxChromaCurrentProfil.c * (relativeChroma / 100) * PICKER_SIZE * OKLCH_CHROMA_SCALE

      // const finalPosition = lerp(sRGBMaxChroma.c, 0, p3MaxChroma.c, 0, MAX_CHROMA_P3)
      // const finalPosition = lerp(relativeChroma, 0, 100, 0, MAX_CHROMA_P3) * PICKER_SIZE * OKLCH_CHROMA_SCALE
      const finalPosition = (relativeChroma * PICKER_SIZE) / 100

      // const xPosition = lerp(position, 0, 100, startPosition, finalPosition)
      const xPosition = getLinearMappedValue({
        valueToMap: position,
        originalRange: { min: 0, max: 100 },
        targetRange: { min: startPosition, max: finalPosition }
      })

      d += `L${xPosition.toFixed(2)} ${l} `
    }
  }

  return d
}
