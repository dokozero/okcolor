import { PICKER_SIZE, OKLCH_CHROMA_SCALE } from '../../../../constants'
import getClampedChroma from '../../../helpers/colors/getClampedChroma'
import convertContrastToLightness from '../../../helpers/contrasts/convertContrastToLightness'
import { Lightness, SvgPath } from '../../../../types'
import { $colorHxya } from '../../../stores/colors/colorHxya'
import { $contrast } from '../../../stores/contrasts/contrast'
import { $currentContrastMethod } from '../../../stores/contrasts/currentContrastMethod'
import roundWithDecimal from '../../../helpers/numbers/roundWithDecimal'

export default function getContrastStrokeLimit(): SvgPath {
  let startY: Lightness
  let endY: Lightness

  let clampedChroma = getClampedChroma({
    h: $colorHxya.get().h,
    x: 0.37,
    y: $colorHxya.get().y
  })

  const currentHxyFromContrast = convertContrastToLightness(
    {
      h: $colorHxya.get().h,
      x: $colorHxya.get().x,
      y: $colorHxya.get().y,
      a: $colorHxya.get().a
    },
    $contrast.get()
  )

  let adjustement = 0

  if (
    ($currentContrastMethod.get() === 'apca' && $contrast.get() === 0) ||
    ($currentContrastMethod.get() === 'wcag' && $contrast.get() > -1.2 && $contrast.get() < 1.2)
  ) {
    startY = $colorHxya.get().y
    endY = $colorHxya.get().y
  } else {
    adjustement = roundWithDecimal($colorHxya.get().y - currentHxyFromContrast.y, 1)

    const startHxy = convertContrastToLightness(
      {
        h: $colorHxya.get().h,
        x: 0,
        y: $colorHxya.get().y,
        a: $colorHxya.get().a
      },
      $contrast.get()
    )

    const endHxy = convertContrastToLightness(
      {
        h: $colorHxya.get().h,
        x: clampedChroma,
        y: $colorHxya.get().y,
        a: $colorHxya.get().a
      },
      $contrast.get()
    )
    startY = startHxy.y
    endY = endHxy.y
  }

  clampedChroma = getClampedChroma({
    h: $colorHxya.get().h,
    x: 0.37,
    y: endY + adjustement
  })

  startY += adjustement
  endY += adjustement

  const pointA = `0 ${PICKER_SIZE - (startY * PICKER_SIZE) / 100}`
  const pointB = `${clampedChroma * PICKER_SIZE * OKLCH_CHROMA_SCALE} ${PICKER_SIZE - (endY * PICKER_SIZE) / 100}`

  // TODO - delete
  // $lockContrastStartY.set(startY)
  // $lockContrastEndY.set(endY)

  return `M${pointA} L${pointB}`
}
