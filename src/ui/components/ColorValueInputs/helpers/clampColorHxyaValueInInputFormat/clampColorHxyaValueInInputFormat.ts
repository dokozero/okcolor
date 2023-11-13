import clamp from 'lodash/clamp'
import { HxyaLabels, HxyaInputTypes, AbsoluteChroma } from '../../../../../types'
import getClampedChroma from '../../../../helpers/colors/getClampedChroma/getClampedChroma'
import getHxyaInputRange from '../../../../helpers/colors/getHxyaInputRange/getHxyaInputRange'
import { $colorHxya } from '../../../../stores/colors/colorHxya/colorHxya'
import { $userSettings } from '../../../../stores/settings/userSettings/userSettings'

export default function clampColorHxyaValueInInputFormat(eventId: keyof typeof HxyaLabels, newValue: HxyaInputTypes): HxyaInputTypes {
  let clampedNewValue: HxyaInputTypes

  if (eventId === 'x') {
    const formatedChroma: AbsoluteChroma = $userSettings.get().useSimplifiedChroma ? newValue / 100 : newValue
    clampedNewValue = getClampedChroma({ h: $colorHxya.get().h, x: formatedChroma, y: $colorHxya.get().y })
    clampedNewValue = $userSettings.get().useSimplifiedChroma ? clampedNewValue * 100 : clampedNewValue
  } else {
    clampedNewValue = clamp(newValue, getHxyaInputRange(eventId).min, getHxyaInputRange(eventId).max)
  }

  return clampedNewValue
}
