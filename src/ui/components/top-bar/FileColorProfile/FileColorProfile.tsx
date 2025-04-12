import { useStore } from '@nanostores/react'
import { consoleLogInfos } from '../../../../constants'
import { $currentFileColorProfile } from '../../../stores/colors/currentFileColorProfile/currentFileColorProfile'
import InfoHoverTooltip from '../../InfoHoverTooltip/InfoHoverTooltip'

export default function FileColorProfile() {
  if (consoleLogInfos.includes('Component renders')) {
    console.log('Component render — FileColorProfile')
  }
  const currentFileColorProfile = useStore($currentFileColorProfile)

  return (
    <div className="c-file-color-profile">
      {currentFileColorProfile === 'rgb' ? 'sRGB' : 'Display P3'}
      <InfoHoverTooltip text="File color profile, automatically set from file settings." position="right" width={150} />
    </div>
  )
}
