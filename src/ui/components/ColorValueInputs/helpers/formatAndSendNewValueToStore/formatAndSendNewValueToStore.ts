import { HxyaLabels } from '../../../../../types'
import { setColorHxyaWithSideEffects } from '../../../../stores/colors/colorHxya/colorHxya'
import { $currentColorModel } from '../../../../stores/colors/currentColorModel/currentColorModel'
import { $userSettings } from '../../../../stores/settings/userSettings/userSettings'

export default function formatAndSendNewValueToStore(eventId: keyof typeof HxyaLabels, newValue: number) {
  let newValueFormated = newValue
  if (($currentColorModel.get() === 'oklch' && $userSettings.get().useSimplifiedChroma && eventId === 'x') || eventId === 'a') newValueFormated /= 100

  setColorHxyaWithSideEffects({ newColorHxya: { [eventId]: newValueFormated } })
}
