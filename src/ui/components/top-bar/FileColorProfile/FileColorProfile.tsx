import { useStore } from '@nanostores/react'
import { consoleLogInfos } from '../../../../constants'
import { $currentFileColorProfile } from '../../../stores/colors/currentFileColorProfile/currentFileColorProfile'
import InfoHoverTooltip from '../../InfoHoverTooltip/InfoHoverTooltip'
import { $figmaEditorType } from '../../../stores/figmaEditorType/figmaEditorType'

export default function FileColorProfile() {
  if (consoleLogInfos.includes('Component renders')) {
    console.log('Component render — FileColorProfile')
  }

  const currentFileColorProfile = useStore($currentFileColorProfile)

  let tooltipText = ''

  switch ($figmaEditorType.get()) {
    case 'figma':
      tooltipText = 'File color profile, automatically set from file settings.'
      break
    case 'figjam':
      tooltipText = 'File color profile, FigJam files only support sRGB.'
      break
    default:
      tooltipText = 'File color profile, automatically set from file settings.'
      break
  }

  return (
    <div className="c-file-color-profile">
      {currentFileColorProfile === 'rgb' ? 'sRGB' : 'Display P3'}
      <InfoHoverTooltip text={tooltipText} position="right" width={150} />
    </div>
  )
}
