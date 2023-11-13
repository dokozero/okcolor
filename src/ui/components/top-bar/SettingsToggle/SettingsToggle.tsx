import { useStore } from '@nanostores/react'
import { consoleLogInfos } from '../../../../constants'
import { $isSettingsScreenOpen, setIsSettingsScreenOpen } from '../../../stores/settings/isSetttingsScreenOpen/isSetttingsScreenOpen'
import ThreeDotsIcon from '../../icons/ThreeDotsIcon/ThreeDotsIcon'

const handleIsSettingsScreenOpen = () => {
  setIsSettingsScreenOpen(!$isSettingsScreenOpen.get())
}

export default function SettingsToggle() {
  if (consoleLogInfos.includes('Component renders')) {
    console.log('Component render — SettingsToggle')
  }

  const isSettingsScreenOpen = useStore($isSettingsScreenOpen)

  return (
    <div className={'c-settings-toggle' + (isSettingsScreenOpen ? ' c-settings-toggle--active' : '')} onClick={handleIsSettingsScreenOpen}>
      <ThreeDotsIcon />
    </div>
  )
}
