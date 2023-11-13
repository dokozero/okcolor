import { action, map } from 'nanostores'
import { logger } from '@nanostores/logger'
import { consoleLogInfos } from '../../../../constants'
import { OklchInputOrderList, SyncUserSettingsData, UserSettings } from '../../../../types'
import merge from 'lodash/merge'
import sendMessageToBackend from '../../../helpers/sendMessageToBackend/sendMessageToBackend'

export const $userSettings = map<UserSettings>({
  useSimplifiedChroma: false,
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

type SideEffects = {
  syncUserSettingsWithBackend: boolean
}

type Props = {
  key: keyof UserSettings
  newValue: boolean | keyof typeof OklchInputOrderList
  sideEffects?: Partial<SideEffects>
}

const defaultSideEffects: SideEffects = {
  syncUserSettingsWithBackend: true
}

export const setUserSettingsKeyWithSideEffects = action($userSettings, 'setUserSettingsWithSideEffects', (userSettings, props: Props) => {
  const { key, newValue, sideEffects: partialSideEffects } = props

  const sideEffects = JSON.parse(JSON.stringify(defaultSideEffects))
  merge(sideEffects, partialSideEffects)

  userSettings.setKey(key, newValue)

  if (sideEffects.syncUserSettingsWithBackend) {
    sendMessageToBackend<SyncUserSettingsData>({
      type: 'SyncUserSettings',
      data: {
        newUserSettings: { ...$userSettings.get(), [key]: newValue }
      }
    })
  }
})

if (consoleLogInfos.includes('Store updates')) {
  logger({
    userSettings: $userSettings
  })
}
