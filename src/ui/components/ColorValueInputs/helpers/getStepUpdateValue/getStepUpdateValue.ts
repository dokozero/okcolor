import { $currentColorModel } from '../../../../stores/colors/currentColorModel/currentColorModel'
import { $currentKeysPressed } from '../../../../stores/currentKeysPressed/currentKeysPressed'

export default function getStepUpdateValue(eventId: string): number {
  const shiftPressed = $currentKeysPressed.get().includes('shift')

  if (eventId === 'x') {
    if ($currentColorModel.get() === 'oklchCss') return shiftPressed ? 0.01 : 0.001
    if ($currentColorModel.get() === 'oklch') return shiftPressed ? 1 : 0.1
  }
  return shiftPressed ? 10 : 1
}
