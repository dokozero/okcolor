import round from 'lodash/round'
import { HxyaLabels, HxyaInputTypes } from '../../../../../types'
import { $colorHxya } from '../../../../stores/colors/colorHxya/colorHxya'
import { $userSettings } from '../../../../stores/settings/userSettings/userSettings'
import { $currentColorModel } from '../../../../stores/colors/currentColorModel/currentColorModel'
import getColorHxyDecimals from '../../../../helpers/colors/getColorHxyDecimals/getColorHxyDecimals'

export default function getColorHxyaValueFormatedForInput(value: keyof typeof HxyaLabels): HxyaInputTypes {
  switch (value) {
    case 'h':
      return $colorHxya.get().h
    case 'x':
      if ($currentColorModel.get() === 'oklch' && $userSettings.get().useSimplifiedChroma) {
        return round($colorHxya.get().x * 100, 1)
      } else {
        return round($colorHxya.get().x, getColorHxyDecimals({ lockRelativeChroma: false }).x)
      }
    case 'y':
      return $colorHxya.get().y
    case 'a':
      return round($colorHxya.get().a * 100, 0)
  }
}
