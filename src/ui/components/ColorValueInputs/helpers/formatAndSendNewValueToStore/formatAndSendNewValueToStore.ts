import { HxyaLabels } from '../../../../../types'
import { setColorHxyaWithSideEffects } from '../../../../stores/colors/colorHxya/colorHxya'
import { $currentColorModel } from '../../../../stores/colors/currentColorModel/currentColorModel'

export default function formatAndSendNewValueToStore(eventId: keyof typeof HxyaLabels, newValue: number) {
  let newValueFormated = newValue
  if (($currentColorModel.get() === 'oklch' && eventId === 'x') || eventId === 'a') newValueFormated /= 100

  setColorHxyaWithSideEffects({ newColorHxya: { [eventId]: newValueFormated } })
}
