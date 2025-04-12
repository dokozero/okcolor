import { $currentColorModel } from '../../../../stores/colors/currentColorModel/currentColorModel'
import { $currentKeysPressed } from '../../../../stores/currentKeysPressed/currentKeysPressed'
import { $userSettings } from '../../../../stores/settings/userSettings/userSettings'

export default function getStepUpdateValue(eventId: string): number {
  const shiftPressed = $currentKeysPressed.get().includes('shift')

  if (eventId === 'x' && $currentColorModel.get() === 'oklch') {
    if ($userSettings.get().useSimplifiedChroma) return shiftPressed ? 0.5 : 0.1
    else return shiftPressed ? 0.005 : 0.001
  }

  return shiftPressed ? 5 : 1
}
