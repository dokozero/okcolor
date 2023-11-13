import { action, map } from 'nanostores'
import { logger } from '@nanostores/logger'
import { consoleLogInfos } from '../../../../constants'
import { OklchInputOrderList, UserSettings } from '../../../../types'

export const $userSettings = map<UserSettings>({
  simplifiedChroma: false,
  oklchInputOrder: 'lch',
  useHardwareAcceleration: true
})

export const setUserSettings = action($userSettings, 'setUserSettings', (userSettings, newUserSettings: UserSettings) => {
  userSettings.set(newUserSettings)
})

export const setUserSettingsKey = action(
  $userSettings,
  'setUserSettingsKey',
  (userSettings, key: keyof UserSettings, newValue: boolean | keyof typeof OklchInputOrderList) => {
    userSettings.setKey(key, newValue)
  }
)

if (consoleLogInfos.includes('Store updates')) {
  logger({
    userSettings: $userSettings
  })
}
