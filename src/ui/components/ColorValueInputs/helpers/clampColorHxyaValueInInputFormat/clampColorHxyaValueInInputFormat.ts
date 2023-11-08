import clamp from 'lodash/clamp'
import { HxyaLabels, HxyaInputTypes, AbsoluteChroma } from '../../../../../types'
import getClampedChroma from '../../../../helpers/colors/getClampedChroma/getClampedChroma'
import getHxyaInputRange from '../../../../helpers/colors/getHxyaInputRange/getHxyaInputRange'
import { $colorHxya } from '../../../../stores/colors/colorHxya/colorHxya'
import { $currentColorModel } from '../../../../stores/colors/currentColorModel/currentColorModel'

export default function clampColorHxyaValueInInputFormat(eventId: keyof typeof HxyaLabels, newValue: HxyaInputTypes): HxyaInputTypes {
  let clampedNewValue: HxyaInputTypes

  if (eventId === 'x') {
    const formatedChroma: AbsoluteChroma = $currentColorModel.get() === 'oklch' ? newValue / 100 : newValue
    clampedNewValue = getClampedChroma({ h: $colorHxya.get().h, x: formatedChroma, y: $colorHxya.get().y })
    clampedNewValue = $currentColorModel.get() === 'oklch' ? clampedNewValue * 100 : clampedNewValue
  } else {
    clampedNewValue = clamp(newValue, getHxyaInputRange(eventId).min, getHxyaInputRange(eventId).max)
  }

  return clampedNewValue
}
