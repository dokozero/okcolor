import clamp from 'lodash/clamp'
import { ApcaContrast, WcagContrast } from '../../../../../../types'
import getContrastRange from '../../../../../helpers/contrasts/getContrastRange/getContrastRange'
import { $contrast, setContrastWithSideEffects } from '../../../../../stores/contrasts/contrast/contrast'
import { $currentContrastMethod } from '../../../../../stores/contrasts/currentContrastMethod/currentContrastMethod'
import { $isMouseInsideDocument } from '../../../../../stores/isMouseInsideDocument/isMouseInsideDocument'
import parseInputString from '../../../../../helpers/inputs/parseInputString/parseInputString'
import round from 'lodash/round'

export default function handleInputOnBlur(event: React.FocusEvent<HTMLInputElement>, lastKeyPressed: React.MutableRefObject<string>) {
  const eventTarget = event.target

  const resetToOldValue = () => {
    eventTarget.value = String($contrast.get())
    lastKeyPressed.current = ''
    return
  }

  const rawValue = parseInputString(eventTarget.value)

  if (rawValue === null) {
    return resetToOldValue()
  }

  const newValue: ApcaContrast | WcagContrast = $currentContrastMethod.get() === 'apca' ? round(rawValue) : rawValue

  const clampedNewContrast = clamp(newValue, getContrastRange().negative.max, getContrastRange().positive.max)

  if (
    clampedNewContrast === $contrast.get() ||
    lastKeyPressed.current === 'Escape' ||
    (!$isMouseInsideDocument.get() && !['Enter', 'Tab'].includes(lastKeyPressed.current))
  ) {
    return resetToOldValue()
  }

  lastKeyPressed.current = ''
  setContrastWithSideEffects({ newContrast: clampedNewContrast })
}
