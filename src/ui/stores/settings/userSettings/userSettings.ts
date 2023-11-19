import { action, map } from 'nanostores'
import { logger } from '@nanostores/logger'
import { consoleLogInfos } from '../../../../constants'
import { OklchHlDecimalPrecisionRange, OklchInputOrderList, SyncUserSettingsData, UserSettings } from '../../../../types'
import merge from 'lodash/merge'
import sendMessageToBackend from '../../../helpers/sendMessageToBackend/sendMessageToBackend'
import { $colorHxya, setColorHxyaWithSideEffects } from '../../colors/colorHxya/colorHxya'
import { $currentColorModel } from '../../colors/currentColorModel/currentColorModel'
import getColorHxyDecimals from '../../../helpers/colors/getColorHxyDecimals/getColorHxyDecimals'
import round from 'lodash/round'
import { $uiMessage } from '../../uiMessage/uiMessage'

export const $userSettings = map<UserSettings>({
  oklchHlDecimalPrecision: 1,
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
  (userSettings, key: keyof UserSettings, newValue: OklchHlDecimalPrecisionRange | boolean | keyof typeof OklchInputOrderList) => {
    userSettings.setKey(key, newValue)
  }
)

type SideEffects = {
  syncUserSettingsWithBackend: boolean
}

type Props = {
  key: keyof UserSettings
  newValue: OklchHlDecimalPrecisionRange | boolean | keyof typeof OklchInputOrderList
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

  // We need to update colorHxya if decimal precision changes.
  if (key === 'oklchHlDecimalPrecision') {
    if ($currentColorModel.get() !== 'oklch' || $uiMessage.get().show) return
    setColorHxyaWithSideEffects({
      newColorHxya: {
        h: round($colorHxya.get().h, getColorHxyDecimals().h),
        x: round($colorHxya.get().x, getColorHxyDecimals().x),
        y: round($colorHxya.get().y, getColorHxyDecimals().y)
      }
    })
  }
})

if (consoleLogInfos.includes('Store updates')) {
  logger({
    userSettings: $userSettings
  })
}
