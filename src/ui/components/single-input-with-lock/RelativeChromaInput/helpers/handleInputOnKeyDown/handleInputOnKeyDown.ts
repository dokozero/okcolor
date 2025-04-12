import clamp from 'lodash/clamp'
import { setRelativeChromaWithSideEffects } from '../../../../../stores/colors/relativeChroma/relativeChroma'
import { $currentKeysPressed } from '../../../../../stores/currentKeysPressed/currentKeysPressed'

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
    let newValue = parseInt(eventTarget.value)

    event.preventDefault()
    keepInputSelected.current = true

    const stepUpdateValue = $currentKeysPressed.get().includes('shift') ? 5 : 1

    if (eventKey === 'ArrowUp') newValue += stepUpdateValue
    else if (eventKey === 'ArrowDown') newValue -= stepUpdateValue

    const clampedNewRelativeChroma = clamp(newValue, 0, 100)
    setRelativeChromaWithSideEffects({ newRelativeChroma: clampedNewRelativeChroma })
  }
}
