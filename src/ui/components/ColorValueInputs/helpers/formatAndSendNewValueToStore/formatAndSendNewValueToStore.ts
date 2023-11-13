import { HxyaLabels } from '../../../../../types'
import { setColorHxyaWithSideEffects } from '../../../../stores/colors/colorHxya/colorHxya'
import { $userSettings } from '../../../../stores/settings/userSettings/userSettings'

export default function formatAndSendNewValueToStore(eventId: keyof typeof HxyaLabels, newValue: number) {
  let newValueFormated = newValue
  if (($userSettings.get().useSimplifiedChroma && eventId === 'x') || eventId === 'a') newValueFormated /= 100

  setColorHxyaWithSideEffects({ newColorHxya: { [eventId]: newValueFormated } })
}
