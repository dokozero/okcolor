import clamp from 'lodash/clamp'
import { ApcaContrast, WcagContrast } from '../../../../../../types'
import getContrastRange from '../../../../../helpers/contrasts/getContrastRange/getContrastRange'
import { setContrastWithSideEffects } from '../../../../../stores/contrasts/contrast/contrast'
import { $currentContrastMethod } from '../../../../../stores/contrasts/currentContrastMethod/currentContrastMethod'
import getNewContrastValueFromArrowKey from '../getNewContrastValueFromArrowKey/getNewContrastValueFromArrowKey'

export default function handleInputOnKeyDown(
  event: React.KeyboardEvent<HTMLInputElement>,
  lastKeyPressed: React.MutableRefObject<string>,
  keepInputSelected: React.MutableRefObject<boolean>
) {
  const eventKey = event.key
  const eventTarget = event.target as HTMLInputElement

  if (['Enter', 'Tab', 'Escape'].includes(eventKey)) {
    lastKeyPressed.current = eventKey
    ;(event.target as HTMLInputElement).blur()
  } else if (['ArrowUp', 'ArrowDown'].includes(eventKey)) {
    const currentValue: ApcaContrast | WcagContrast =
      $currentContrastMethod.get() === 'apca' ? parseInt(eventTarget.value) : parseFloat(eventTarget.value)

    event.preventDefault()
    keepInputSelected.current = true

    const newValue = getNewContrastValueFromArrowKey(eventKey as 'ArrowDown' | 'ArrowUp', currentValue)
    const clampedNewContrast = clamp(newValue, getContrastRange().negative.max, getContrastRange().positive.max)
    setContrastWithSideEffects({ newContrast: clampedNewContrast })
  }
}
