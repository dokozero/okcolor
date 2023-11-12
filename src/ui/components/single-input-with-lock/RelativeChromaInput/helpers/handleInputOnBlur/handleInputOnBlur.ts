import clamp from 'lodash/clamp'
import { $relativeChroma, setRelativeChromaWithSideEffects } from '../../../../../stores/colors/relativeChroma/relativeChroma'
import { $isMouseInsideDocument } from '../../../../../stores/isMouseInsideDocument/isMouseInsideDocument'

export default function handleInputOnBlur(event: React.FocusEvent<HTMLInputElement>, lastKeyPressed: React.MutableRefObject<string>) {
  const eventTarget = event.target
  const newValue = parseInt(eventTarget.value)

  if (isNaN(newValue)) {
    eventTarget.value = $relativeChroma.get() + '%'
    return
  }

  const clampedNewRelativeChroma = clamp(newValue, 0, 100)

  if (
    clampedNewRelativeChroma === $relativeChroma.get() ||
    lastKeyPressed.current === 'Escape' ||
    (!$isMouseInsideDocument.get() && !['Enter', 'Tab'].includes(lastKeyPressed.current))
  ) {
    eventTarget.value = $relativeChroma.get() + '%'
    return
  } else {
    lastKeyPressed.current = ''
  }

  setRelativeChromaWithSideEffects({ newRelativeChroma: clampedNewRelativeChroma })
}
