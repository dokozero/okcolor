import round from 'lodash/round'
import { ApcaContrast, WcagContrast } from '../../../../../../types'
import getContrastRange from '../../../../../helpers/contrasts/getContrastRange/getContrastRange'
import { $currentContrastMethod } from '../../../../../stores/contrasts/currentContrastMethod/currentContrastMethod'
import { $currentKeysPressed } from '../../../../../stores/currentKeysPressed/currentKeysPressed'

export default function getNewContrastValueFromArrowKey(
  eventKey: 'ArrowDown' | 'ArrowUp',
  currentValue: ApcaContrast | WcagContrast
): ApcaContrast | WcagContrast {
  let newValue: ApcaContrast | WcagContrast

  const isShiftPressed = $currentKeysPressed.get().includes('shift')
  const currentContrastMethod = $currentContrastMethod.get()

  let stepUpdateValue: number
  if (currentContrastMethod === 'apca') stepUpdateValue = isShiftPressed ? 10 : 1
  else stepUpdateValue = isShiftPressed ? 1 : 0.1

  const contrastRange = getContrastRange()

  if (eventKey === 'ArrowUp') {
    if (currentValue === contrastRange.negative.min) newValue = currentContrastMethod === 'apca' ? 0 : 1
    else newValue = currentValue + stepUpdateValue
  } else if (eventKey === 'ArrowDown') {
    if (currentValue === contrastRange.positive.min) newValue = currentContrastMethod === 'apca' ? 0 : -1
    else newValue = currentValue - stepUpdateValue
  }

  // We need to this because in some cases we can have values like 1.2999999999999998.
  return round(newValue!, 1)
}
