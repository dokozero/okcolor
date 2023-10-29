import { PICKER_SIZE, OKLCH_CHROMA_SCALE } from '../../../../constants'
import { $colorHxya, $contrast } from '../../../store'
import getClampedChroma from '../../../helpers/getClampedChroma'
import convertContrastToLightness from '../../../helpers/convertContrastToLightness'
import { roundWithDecimal } from '../../../helpers/others'
import { Lightness, SvgPath } from '../../../../types'

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

  if ($contrast.get() !== 0) {
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
  } else {
    startY = $colorHxya.get().y
    endY = $colorHxya.get().y
  }

  clampedChroma = getClampedChroma({
    h: $colorHxya.get().h,
    x: 0.37,
    y: endY + adjustement
  })

  const pointA = `0 ${PICKER_SIZE - ((startY + adjustement) * PICKER_SIZE) / 100}`
  const pointB = `${clampedChroma * PICKER_SIZE * OKLCH_CHROMA_SCALE} ${PICKER_SIZE - ((endY + adjustement) * PICKER_SIZE) / 100}`

  return `M${pointA} L${pointB}`
}
