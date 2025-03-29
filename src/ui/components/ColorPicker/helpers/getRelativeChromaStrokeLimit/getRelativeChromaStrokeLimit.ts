import { clampChromaInGamut } from '../../../../helpers/colors/culori.mjs'
import { PICKER_SIZE, OKLCH_CHROMA_SCALE, MAX_CHROMA_P3 } from '../../../../../constants'
import { ColorHxya, CurrentFileColorProfile, OklchRenderMode, RelativeChroma, SvgPath } from '../../../../../types'
import { $colorHxya } from '../../../../stores/colors/colorHxya/colorHxya'
import { $currentFileColorProfile } from '../../../../stores/colors/currentFileColorProfile/currentFileColorProfile'
import { $relativeChroma } from '../../../../stores/colors/relativeChroma/relativeChroma'
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
    position
  } = props

  let d = 'M0 0 '

  const precision = 0.5

  let relativeChromaMapped: number
  let maxChromaCurrentLineMapped: number

  let maxChromaCurrentLine: any

  let xPosition: number

  for (let l = 0; l < PICKER_SIZE; l += 1 / precision) {
    maxChromaCurrentLine = clampChromaInGamut(
      {
        mode: 'oklch',
        l: (PICKER_SIZE - l) / PICKER_SIZE,
        c: MAX_CHROMA_P3,
        h: colorHxya.h
      },
      'oklch',
      currentFileColorProfile
    )

    maxChromaCurrentLineMapped = maxChromaCurrentLine.c * (relativeChroma / 100) * PICKER_SIZE * OKLCH_CHROMA_SCALE

    relativeChromaMapped = getLinearMappedValue({
      valueToMap: relativeChroma,
      originalRange: { min: 0, max: 100 },
      targetRange: { min: 0, max: PICKER_SIZE }
    })

    xPosition = getLinearMappedValue({
      valueToMap: position,
      originalRange: {
        min: 0,
        max: 100
      },
      targetRange: {
        min: maxChromaCurrentLineMapped,
        max: relativeChromaMapped
      }
    })

    d += `L${xPosition.toFixed(2)} ${l} `
  }

  return d
}
