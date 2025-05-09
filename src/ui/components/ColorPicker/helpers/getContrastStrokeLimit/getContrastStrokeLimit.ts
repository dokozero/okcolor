import { PICKER_SIZE, OKLCH_CHROMA_SCALE, MAX_CHROMA_P3 } from '../../../../../constants'
import { ApcaContrast, ColorHxya, SvgPath, WcagContrast } from '../../../../../types'
import getClampedChroma from '../../../../helpers/colors/getClampedChroma/getClampedChroma'
import getNewXandYFromContrast from '../../../../helpers/contrasts/getNewXandYFromContrast/getNewXandYFromContrast'
import getLinearMappedValue from '../../../../helpers/getLinearMappedValue/getLinearMappedValue'
import { $colorHxya } from '../../../../stores/colors/colorHxya/colorHxya'
import { $contrast } from '../../../../stores/contrasts/contrast/contrast'

type Props = {
  colorHxya?: ColorHxya
  contrast?: ApcaContrast | WcagContrast
  position: number
}

export default function getContrastStrokeLimit(props: Props): SvgPath {
  const { colorHxya = $colorHxya.get(), contrast = $contrast.get(), position } = props

  let clampedChroma = getClampedChroma({
    h: colorHxya.h,
    x: MAX_CHROMA_P3,
    y: colorHxya.y
  })

  let path = ''

  const startXy = getNewXandYFromContrast({
    h: colorHxya.h,
    x: 0,
    targetContrast: contrast,
    lockRelativeChroma: false
  })

  const endXy = getNewXandYFromContrast({
    h: colorHxya.h,
    x: clampedChroma,
    targetContrast: contrast,
    lockRelativeChroma: false
  })

  clampedChroma = getClampedChroma({
    h: colorHxya.h,
    x: MAX_CHROMA_P3,
    y: endXy.y
  })

  const distanceFromEndXToMaxP3 = MAX_CHROMA_P3 - clampedChroma

  const endXShiftValue = getLinearMappedValue({
    valueToMap: position,
    originalRange: { min: 0, max: 100 },
    targetRange: { min: 0, max: distanceFromEndXToMaxP3 }
  })

  endXy.x = clampedChroma + endXShiftValue

  path = `M0 ${PICKER_SIZE - (startXy.y * PICKER_SIZE) / 100} `

  let i = 0
  let loopCountLimit = 0
  let previousY = startXy.y

  let newX: number
  let newY: number

  while (i < endXy.x && loopCountLimit < 100) {
    if (endXy.x - i > 0.01) {
      i += 0.01
    } else {
      i += 0.001
    }

    loopCountLimit++

    newX = getLinearMappedValue({
      valueToMap: i,
      originalRange: { min: 0, max: endXy.x },
      targetRange: { min: 0, max: clampedChroma }
    })

    newY = getNewXandYFromContrast({
      h: colorHxya.h,
      x: newX,
      targetContrast: contrast,
      lockRelativeChroma: false
    }).y

    if (newY !== previousY) {
      path += `L${i * PICKER_SIZE * OKLCH_CHROMA_SCALE} ${PICKER_SIZE - (newY * PICKER_SIZE) / 100 - 0.5} `
      previousY = newY
    }
  }

  path += `L${endXy.x * PICKER_SIZE * OKLCH_CHROMA_SCALE} ${PICKER_SIZE - (endXy.y * PICKER_SIZE) / 100}`

  return path
}
