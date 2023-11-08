import { PICKER_SIZE, OKLCH_CHROMA_SCALE } from '../../../../../constants'
import { ApcaContrast, ColorHxya, SvgPath, WcagContrast } from '../../../../../types'
import getClampedChroma from '../../../../helpers/colors/getClampedChroma/getClampedChroma'
import getNewXandYFromContrast from '../../../../helpers/contrasts/getNewXandYFromContrast/getNewXandYFromContrast'
import { $colorHxya } from '../../../../stores/colors/colorHxya/colorHxya'
import { $contrast } from '../../../../stores/contrasts/contrast/contrast'

type Props = {
  colorHxya?: ColorHxya
  contrast?: ApcaContrast | WcagContrast
}

export default function getContrastStrokeLimit(props: Props = {}): SvgPath {
  const { colorHxya = $colorHxya.get(), contrast = $contrast.get() } = props

  let clampedChroma = getClampedChroma({
    h: colorHxya.h,
    x: 0.37,
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
    x: 0.37,
    y: endXy.y
  })

  path = `M0 ${PICKER_SIZE - (startXy.y * PICKER_SIZE) / 100} `

  let i = 0
  let loopCountLimit = 0
  let previousY = startXy.y

  while (i < clampedChroma && loopCountLimit < 100) {
    if (clampedChroma - i > 0.01) i += 0.01
    else i += 0.001

    loopCountLimit++

    const { y } = getNewXandYFromContrast({
      h: colorHxya.h,
      x: i,
      targetContrast: contrast,
      lockRelativeChroma: false
    })

    if (y !== previousY) {
      path += `L${i * PICKER_SIZE * OKLCH_CHROMA_SCALE} ${PICKER_SIZE - (y * PICKER_SIZE) / 100} `
      previousY = y
    }
  }

  path += `L${clampedChroma * PICKER_SIZE * OKLCH_CHROMA_SCALE} ${PICKER_SIZE - (endXy.y * PICKER_SIZE) / 100}`

  return path
}
