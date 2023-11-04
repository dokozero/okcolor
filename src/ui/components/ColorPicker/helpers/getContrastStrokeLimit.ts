import { PICKER_SIZE, OKLCH_CHROMA_SCALE } from '../../../../constants'
import getClampedChroma from '../../../helpers/colors/getClampedChroma'
import { SvgPath } from '../../../../types'
import { $colorHxya } from '../../../stores/colors/colorHxya'
import { $contrast } from '../../../stores/contrasts/contrast'
import getNewXandYFromContrast from '../../../helpers/contrasts/getNewXandYFromContrast'

export default function getContrastStrokeLimit(): SvgPath {
  let clampedChroma = getClampedChroma({
    h: $colorHxya.get().h,
    x: 0.37,
    y: $colorHxya.get().y
  })

  let path = ''

  const startXy = getNewXandYFromContrast({
    currentH: $colorHxya.get().h,
    currentX: 0,
    targetContrast: $contrast.get(),
    lockRelativeChroma: false
  })
  const endXy = getNewXandYFromContrast({
    currentH: $colorHxya.get().h,
    currentX: clampedChroma,
    targetContrast: $contrast.get(),
    lockRelativeChroma: false
  })

  clampedChroma = getClampedChroma({
    h: $colorHxya.get().h,
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

    const xy = getNewXandYFromContrast({
      currentH: $colorHxya.get().h,
      currentX: i,
      targetContrast: $contrast.get(),
      lockRelativeChroma: false
    })

    if (xy.y !== previousY) {
      path += `L${i * PICKER_SIZE * OKLCH_CHROMA_SCALE} ${PICKER_SIZE - (xy.y * PICKER_SIZE) / 100} `
      previousY = xy.y
    }
  }

  path += `L${clampedChroma * PICKER_SIZE * OKLCH_CHROMA_SCALE} ${PICKER_SIZE - (endXy.y * PICKER_SIZE) / 100}`

  return path
}
