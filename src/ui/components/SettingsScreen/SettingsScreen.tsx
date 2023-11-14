import { useStore } from '@nanostores/react'
import { consoleLogInfos } from '../../../constants'
import { $isSettingsScreenOpen, setIsSettingsScreenOpen } from '../../stores/settings/isSetttingsScreenOpen/isSetttingsScreenOpen'
import Toggle from '../Toggle/Toggle'
import { $userSettings, setUserSettingsKeyWithSideEffects } from '../../stores/settings/userSettings/userSettings'
import { OklchHlDecimalPrecisionRange, OklchInputOrderList, SyncUserSettingsData, UserSettings } from '../../../types'
import InfoHoverTooltip from '../InfoHoverTooltip/InfoHoverTooltip'
import { useState } from 'react'
import sendMessageToBackend from '../../helpers/sendMessageToBackend/sendMessageToBackend'

const handleIsSettingsScreenOpen = (event: React.MouseEvent<HTMLDivElement>) => {
  if (event.target !== event.currentTarget) return
  setIsSettingsScreenOpen(!$isSettingsScreenOpen.get())
}

export default function SettingsScreen() {
  if (consoleLogInfos.includes('Component renders')) {
    console.log('Component render — SettingsScreen')
  }

  const isSettingsScreenOpen = useStore($isSettingsScreenOpen)
  const userSettings = useStore($userSettings)

  const [showRestartMessage, setShowRestartMessage] = useState(false)

  // We use a local state for useHardwareAcceleration because the user needs to restart the plugin if he changes it. Using the value from $userSettings would not work as we don't update the store but only the backend's localStorage.
  const [localUseHardwareAcceleration, setLocalUseHardwareAcceleration] = useState($userSettings.get().useHardwareAcceleration)

  const handleUseHardwareAcceleration = () => {
    sendMessageToBackend<SyncUserSettingsData>({
      type: 'SyncUserSettings',
      data: {
        newUserSettings: { ...$userSettings.get(), useHardwareAcceleration: !localUseHardwareAcceleration }
      }
    })

    setLocalUseHardwareAcceleration(!localUseHardwareAcceleration)

    setShowRestartMessage(!showRestartMessage)
  }

  return (
    <>
      {isSettingsScreenOpen && (
        <div onClick={handleIsSettingsScreenOpen} className="c-settings-screen">
          <div className="c-settings-screen__wrapper">
            <div className="c-settings-screen__items-group">
              <div className="c-settings-screen__item">
                OkLCH H/L decimal precision{' '}
                <div className="select-wrapper c-settings-screen__item-oklch-hl-decimal-precision-wrapper">
                  <select
                    onChange={(e) => {
                      setUserSettingsKeyWithSideEffects({
                        key: 'oklchHlDecimalPrecision',
                        newValue: parseInt(e.target.value) as OklchHlDecimalPrecisionRange
                      })
                    }}
                    name="oklch_input_order"
                    id="oklch_input_order"
                  >
                    <option value="1" selected={userSettings.oklchHlDecimalPrecision === 1 ? true : false}>
                      1
                    </option>
                    <option value="2" selected={userSettings.oklchHlDecimalPrecision === 2 ? true : false}>
                      2
                    </option>
                  </select>
                </div>
              </div>
              <div
                className="c-settings-screen__item c-settings-screen__item--with-toggle"
                onClick={() => {
                  setUserSettingsKeyWithSideEffects({ key: 'useSimplifiedChroma', newValue: !$userSettings.get().useSimplifiedChroma })
                }}
              >
                <div className="u-flex u-items-center">
                  Use simplified chroma{' '}
                  <InfoHoverTooltip text="(For OkLCH) use a chroma format like 12.3 instead of 0.123" position="center" width={180} />
                </div>
                <Toggle value={userSettings.useSimplifiedChroma} />
              </div>
              <div className="c-settings-screen__item">
                OkLCH inputs order{' '}
                <div className="select-wrapper c-settings-screen__item-oklch-input-order-wrapper">
                  <select
                    onChange={(e) => {
                      setUserSettingsKeyWithSideEffects({ key: 'oklchInputOrder', newValue: e.target.value as keyof typeof OklchInputOrderList })
                    }}
                    name="oklch_input_order"
                    id="oklch_input_order"
                  >
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
              <div className="c-settings-screen__item c-settings-screen__item--with-toggle" onClick={handleUseHardwareAcceleration}>
                <div className="u-flex u-items-center">
                  Use hardware acceleration{' '}
                  <InfoHoverTooltip
                    text="(Recommended) use WebGL to render the color picker instead of imageData. Deactivate if you have render issues."
                    position="right"
                    width={186}
                  />
                </div>
                <Toggle value={localUseHardwareAcceleration} />
              </div>

              {showRestartMessage && <div className="c-settings-screen__item c-settings-screen__item--restart-message">(Plugin restart needed)</div>}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
