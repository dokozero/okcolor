import clamp from 'lodash/clamp'
import round from 'lodash/round'
import { HxyaLabels } from '../../../../../types'
import getColorHxyDecimals from '../../../../helpers/colors/getColorHxyDecimals/getColorHxyDecimals'
import getHxyaInputRange from '../../../../helpers/colors/getHxyaInputRange/getHxyaInputRange'
import formatAndSendNewValueToStore from '../formatAndSendNewValueToStore/formatAndSendNewValueToStore'
import getStepUpdateValue from '../getStepUpdateValue/getStepUpdateValue'
import { KeepInputSelected } from '../../ColorValueInputs'

export default function handleInputOnKeyDown(
  event: React.KeyboardEvent<HTMLInputElement>,
  lastKeyPressed: React.MutableRefObject<string>,
  keepInputSelected: React.MutableRefObject<KeepInputSelected>
) {
  const eventKey = event.key

  if (['Enter', 'Tab', 'Escape'].includes(eventKey)) {
    lastKeyPressed.current = eventKey
    ;(event.target as HTMLInputElement).blur()
  } else if (['ArrowUp', 'ArrowDown'].includes(eventKey)) {
    if (['ArrowUp', 'ArrowDown'].includes(eventKey)) {
      const eventTarget = event.target as HTMLInputElement
      const eventId = eventTarget.id as HxyaLabels

      let newValue = parseFloat(eventTarget.value)

      event.preventDefault()
      keepInputSelected.current.state = true
      keepInputSelected.current.inputId = eventId

      const stepUpdateValue = getStepUpdateValue(eventId)
      if (eventKey === 'ArrowUp') newValue += stepUpdateValue
      else if (eventKey === 'ArrowDown') newValue -= stepUpdateValue

      // We need to round the value because sometimes we can get results like 55.8999999.
      newValue = round(newValue, getColorHxyDecimals({ forInputs: true })[`${eventId}`])

      const clampedNewValue = clamp(newValue, getHxyaInputRange(eventId).min, getHxyaInputRange(eventId).max)
      formatAndSendNewValueToStore(eventId, clampedNewValue)
    }
  }
}
