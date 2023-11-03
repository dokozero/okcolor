import { PICKER_SIZE, OKLCH_CHROMA_SCALE } from '../../../../constants'
import getClampedChroma from '../../../helpers/colors/getClampedChroma'
import { Lightness, SvgPath } from '../../../../types'
import { $colorHxya } from '../../../stores/colors/colorHxya'
import { $contrast } from '../../../stores/contrasts/contrast'
// import { $currentContrastMethod } from '../../../stores/contrasts/currentContrastMethod'
// import roundWithDecimal from '../../../helpers/numbers/roundWithDecimal'
import getNewXandYFromContrast from '../../../helpers/contrasts/getNewXandYFromContrast'

export default function getContrastStrokeLimit(): SvgPath {
  let startY: Lightness
  let endY: Lightness

  let clampedChroma = getClampedChroma({
    h: $colorHxya.get().h,
    x: 0.37,
    y: $colorHxya.get().y
  })

  // const currentXyFromContrast = getNewXandYFromContrast({
  //   currentH: $colorHxya.get().h,
  //   currentX: $colorHxya.get().x,
  //   targetContrast: $contrast.get()
  // })

  let adjustement = 0

  let path = ''

  // if (
  //   ($currentContrastMethod.get() === 'apca' && $contrast.get() === 0) ||
  //   ($currentContrastMethod.get() === 'wcag' && $contrast.get() > -1.2 && $contrast.get() < 1.2)
  // ) {
  //   startY = $colorHxya.get().y
  //   endY = $colorHxya.get().y

  //   const pointA = `0 ${PICKER_SIZE - (startY * PICKER_SIZE) / 100}`
  //   const pointB = `${clampedChroma * PICKER_SIZE * OKLCH_CHROMA_SCALE} ${PICKER_SIZE - (endY * PICKER_SIZE) / 100}`

  //   path = `M${pointA} L${pointB}`
  // } else {

  // TODO - delete?
  // adjustement = roundWithDecimal($colorHxya.get().y - currentXyFromContrast.y, 1)
  adjustement = 0

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
  startY = startXy.y
  endY = endXy.y

  clampedChroma = getClampedChroma({
    h: $colorHxya.get().h,
    x: 0.37,
    y: endY + adjustement
  })

  startY += adjustement
  endY += adjustement

  path = `M0 ${PICKER_SIZE - (startY * PICKER_SIZE) / 100} `

  let i = 0
  let loopCountLimit = 0
  let previousY = startY

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
      // console.log('line')
      path += `L${i * PICKER_SIZE * OKLCH_CHROMA_SCALE} ${PICKER_SIZE - (xy.y * PICKER_SIZE) / 100} `
      previousY = xy.y
    }
  }
  path += `L${clampedChroma * PICKER_SIZE * OKLCH_CHROMA_SCALE} ${PICKER_SIZE - (endY * PICKER_SIZE) / 100}`
  // }

  return path
}
