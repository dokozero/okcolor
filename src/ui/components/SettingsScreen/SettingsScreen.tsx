import { useStore } from '@nanostores/react'
import { consoleLogInfos } from '../../../constants'
import { $isSettingsScreenOpen } from '../../stores/settings/isSetttingsScreenOpen/isSetttingsScreenOpen'
import Toggle from '../Toggle/Toggle'
import {
  $userSettings,
  setUserSettings,
  setUserSettingsKey,
  setUserSettingsSimplifiedChroma,
  setUserSettingsUseHardwareAcceleration
} from '../../stores/settings/userSettings/userSettings'
import { OklchInputOrderList } from '../../../types'
import InfoHoverTooltip from '../InfoHoverTooltip/InfoHoverTooltip'

const handleOklchInputOrder = (event: { target: HTMLSelectElement }) => {
  setUserSettings({ ...$userSettings.get(), oklchInputOrder: event.target.value as keyof typeof OklchInputOrderList })
}

export default function SettingsScreen() {
  if (consoleLogInfos.includes('Component renders')) {
    console.log('Component render — SettingsScreen')
  }

  const isSettingsScreenOpen = useStore($isSettingsScreenOpen)
  const userSettings = useStore($userSettings)

  return (
    <>
      {isSettingsScreenOpen && (
        <div className="c-settings-screen">
          <div className="c-settings-screen__wrapper">
            <div className="c-settings-screen__items-group">
              <div
                className="c-settings-screen__item c-settings-screen__item--with-toggle"
                onClick={() => {
                  setUserSettingsKey('simplifiedChroma', !$userSettings.get().simplifiedChroma)
                }}
              >
                <div className="u-flex u-items-center">
                  Use simplified chroma{' '}
                  <InfoHoverTooltip text="(For OkLCH) use a chroma format like 12.3 instead of 0.123" position="center" width={180} />
                </div>
                <Toggle value={userSettings.simplifiedChroma} />
              </div>
              <div className="c-settings-screen__item">
                OkLCH input order{' '}
                <div className="select-wrapper">
                  <select onChange={handleOklchInputOrder} name="oklch_input_order" id="oklch_input_order">
                    <option value="lch" selected={userSettings.oklchInputOrder === 'lch' ? true : false}>
                      L/C/H
                    </option>
                    <option value="hcl" selected={userSettings.oklchInputOrder === 'hcl' ? true : false}>
                      H/C/L
                    </option>
                  </select>
                </div>
              </div>
            </div>

            <div className="c-settings-screen__items-group">
              <div
                className="c-settings-screen__item c-settings-screen__item--with-toggle"
                onClick={() => {
                  setUserSettingsKey('useHardwareAcceleration', !$userSettings.get().useHardwareAcceleration)
                }}
              >
                <div className="u-flex u-items-center">
                  Use hardware acceleration{' '}
                  <InfoHoverTooltip
                    text="(Recommended) use WebGL for the color picker rendering instead of imageData. Deactivate if you have render issues."
                    position="right"
                    width={186}
                  />
                </div>
                <Toggle value={userSettings.useHardwareAcceleration} />
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
