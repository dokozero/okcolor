import round from 'lodash/round'
import { HxyaLabels } from '../../../../../types'
import getColorHxyDecimals from '../../../../helpers/colors/getColorHxyDecimals/getColorHxyDecimals'
import { $isMouseInsideDocument } from '../../../../stores/isMouseInsideDocument/isMouseInsideDocument'
import clampColorHxyaValueInInputFormat from '../clampColorHxyaValueInInputFormat/clampColorHxyaValueInInputFormat'
import formatAndSendNewValueToStore from '../formatAndSendNewValueToStore/formatAndSendNewValueToStore'
import getColorHxyaValueFormatedForInput from '../getColorHxyaValueFormatedForInput/getColorHxyaValueFormatedForInput'
import parseInputString from '../../../../helpers/inputs/parseInputString/parseInputString'

export default function handleInputOnBlur(event: React.FocusEvent<HTMLInputElement>, lastKeyPressed: React.MutableRefObject<string>) {
  const eventTarget = event.target as HTMLInputElement
  const eventId = eventTarget.id as HxyaLabels
  const oldValue = getColorHxyaValueFormatedForInput(eventId)

  const resetToOldValue = () => {
    eventTarget.value = oldValue.toString() + (eventId === 'a' ? '%' : '')
    lastKeyPressed.current = ''
    return
  }

  const rawValue = parseInputString(eventTarget.value)

  if (rawValue === null) {
    return resetToOldValue()
  }

  const newValue = round(rawValue, getColorHxyDecimals({ forInputs: true })[`${eventId}`])

  const clampedNewValue = clampColorHxyaValueInInputFormat(eventId, newValue)
  if (
    clampedNewValue === oldValue ||
    lastKeyPressed.current === 'Escape' ||
    (!$isMouseInsideDocument.get() && !['Enter', 'Tab'].includes(lastKeyPressed.current))
  ) {
    return resetToOldValue()
  }

  lastKeyPressed.current = ''
  formatAndSendNewValueToStore(eventId, clampedNewValue)
}
