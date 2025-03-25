import { useStore } from '@nanostores/react'
import { consoleLogInfos } from '../../../../constants'
import { $currentColorModel } from '../../../stores/colors/currentColorModel/currentColorModel'
import { $currentFileColorProfile } from '../../../stores/colors/currentFileColorProfile/currentFileColorProfile'
import { $figmaEditorType } from '../../../stores/figmaEditorType/figmaEditorType'
import InfoHoverTooltip from '../../InfoHoverTooltip/InfoHoverTooltip'

export default function FileColorProfile() {
  if (consoleLogInfos.includes('Component renders')) {
    console.log('Component render — FileColorProfile')
  }
  const figmaEditorType = useStore($figmaEditorType)
  const currentColorModel = useStore($currentColorModel)
  const currentFileColorProfile = useStore($currentFileColorProfile)

  return (
    <div
      className={
        'c-file-color-profile' +
        (figmaEditorType === 'figjam' || ['okhsv', 'okhsl'].includes(currentColorModel) ? ' c-file-color-profile--deactivated' : '')
      }
    >
      {currentFileColorProfile === 'rgb' ? 'sRGB' : 'Display P3'}
      <InfoHoverTooltip text="File color profile, automatically set from file settings." position="right" width={150} />
    </div>
  )
}
