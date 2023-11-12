import clamp from 'lodash/clamp'
import { ApcaContrast, WcagContrast } from '../../../../../../types'
import getContrastRange from '../../../../../helpers/contrasts/getContrastRange/getContrastRange'
import { $contrast, setContrastWithSideEffects } from '../../../../../stores/contrasts/contrast/contrast'
import { $currentContrastMethod } from '../../../../../stores/contrasts/currentContrastMethod/currentContrastMethod'
import { $isMouseInsideDocument } from '../../../../../stores/isMouseInsideDocument/isMouseInsideDocument'

export default function handleInputOnBlur(event: React.FocusEvent<HTMLInputElement>, lastKeyPressed: React.MutableRefObject<string>) {
  const eventTarget = event.target

  const newValue: ApcaContrast | WcagContrast = $currentContrastMethod.get() === 'apca' ? parseInt(eventTarget.value) : parseFloat(eventTarget.value)

  if (isNaN(newValue)) {
    eventTarget.value = String($contrast.get())
    return
  }

  const clampedNewContrast = clamp(newValue, getContrastRange().negative.max, getContrastRange().positive.max)

  if (
    clampedNewContrast === $contrast.get() ||
    lastKeyPressed.current === 'Escape' ||
    (!$isMouseInsideDocument.get() && !['Enter', 'Tab'].includes(lastKeyPressed.current))
  ) {
    eventTarget.value = String($contrast.get())
    return
  } else {
    lastKeyPressed.current = ''
  }

  setContrastWithSideEffects({ newContrast: clampedNewContrast })
}
