import clamp from 'lodash/clamp'
import { $relativeChroma, setRelativeChromaWithSideEffects } from '../../../../../stores/colors/relativeChroma/relativeChroma'
import { $isMouseInsideDocument } from '../../../../../stores/isMouseInsideDocument/isMouseInsideDocument'
import parseInputString from '../../../../../helpers/inputs/parseInputString/parseInputString'
import round from 'lodash/round'

export default function handleInputOnBlur(event: React.FocusEvent<HTMLInputElement>, lastKeyPressed: React.MutableRefObject<string>) {
  const eventTarget = event.target

  const resetToOldValue = () => {
    eventTarget.value = $relativeChroma.get().toString()
    lastKeyPressed.current = ''
    return
  }

  const rawValue = parseInputString(eventTarget.value)

  if (rawValue === null) {
    return resetToOldValue()
  }

  const newValue = round(rawValue)

  const clampedNewRelativeChroma = clamp(newValue, 0, 100)

  if (
    clampedNewRelativeChroma === $relativeChroma.get() ||
    lastKeyPressed.current === 'Escape' ||
    (!$isMouseInsideDocument.get() && !['Enter', 'Tab'].includes(lastKeyPressed.current))
  ) {
    return resetToOldValue()
  }

  lastKeyPressed.current = ''
  setRelativeChromaWithSideEffects({ newRelativeChroma: clampedNewRelativeChroma })
}
