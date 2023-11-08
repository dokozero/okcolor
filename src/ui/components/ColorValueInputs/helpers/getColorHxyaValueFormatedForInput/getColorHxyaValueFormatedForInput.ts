import { round } from 'lodash'
import { HxyaLabels, HxyaInputTypes } from '../../../../../types'
import { $colorHxya } from '../../../../stores/colors/colorHxya/colorHxya'
import { $currentColorModel } from '../../../../stores/colors/currentColorModel/currentColorModel'

export default function getColorHxyaValueFormatedForInput(value: keyof typeof HxyaLabels): HxyaInputTypes {
  switch (value) {
    case 'h':
      return $colorHxya.get().h
    case 'x':
      return $currentColorModel.get() === 'oklch' ? round($colorHxya.get().x * 100, 1) : $colorHxya.get().x
    case 'y':
      return $colorHxya.get().y
    case 'a':
      return round($colorHxya.get().a * 100, 0)
  }
}
