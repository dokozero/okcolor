import round from 'lodash/round'
import { HxyaLabels } from '../../../../../types'
import getColorHxyDecimals from '../../../../helpers/colors/getColorHxyDecimals/getColorHxyDecimals'
import { $isMouseInsideDocument } from '../../../../stores/isMouseInsideDocument/isMouseInsideDocument'
import clampColorHxyaValueInInputFormat from '../clampColorHxyaValueInInputFormat/clampColorHxyaValueInInputFormat'
import formatAndSendNewValueToStore from '../formatAndSendNewValueToStore/formatAndSendNewValueToStore'
import getColorHxyaValueFormatedForInput from '../getColorHxyaValueFormatedForInput/getColorHxyaValueFormatedForInput'

export default function handleInputOnBlur(event: React.FocusEvent<HTMLInputElement>, lastKeyPressed: React.MutableRefObject<string>) {
  const eventTarget = event.target as HTMLInputElement

  const eventId = eventTarget.id as HxyaLabels

  const oldValue = getColorHxyaValueFormatedForInput(eventId)
  const newValue = round(parseFloat(eventTarget.value), getColorHxyDecimals({ forInputs: true })[`${eventId}`])

  if (isNaN(newValue)) {
    eventTarget.value = oldValue.toString() + (eventId === 'a' ? '%' : '')
    return
  }

  const clampedNewValue = clampColorHxyaValueInInputFormat(eventId, newValue)

  if (
    clampedNewValue === oldValue ||
    lastKeyPressed.current === 'Escape' ||
    (!$isMouseInsideDocument.get() && !['Enter', 'Tab'].includes(lastKeyPressed.current))
  ) {
    eventTarget.value = oldValue.toString() + (eventId === 'a' ? '%' : '')
    return
  } else {
    lastKeyPressed.current = ''
  }

  formatAndSendNewValueToStore(eventId, clampedNewValue)
}
