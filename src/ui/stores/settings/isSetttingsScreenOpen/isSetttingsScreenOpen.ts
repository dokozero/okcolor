import { action, atom } from 'nanostores'
import { logger } from '@nanostores/logger'
import { consoleLogInfos } from '../../../../constants'

export const $isSettingsScreenOpen = atom(false)

export const setIsSettingsScreenOpen = action(
  $isSettingsScreenOpen,
  'setIsSettingsScreenOpen',
  (isSettingsScreenOpen, newIsSettingsScreenOpen: boolean) => {
    isSettingsScreenOpen.set(newIsSettingsScreenOpen)
  }
)

if (consoleLogInfos.includes('Store updates')) {
  logger({
    isSettingsScreenOpen: $isSettingsScreenOpen
  })
}
