import { useStore } from '@nanostores/react'
import { consoleLogInfos } from '../../../../constants'
import { CurrentFileColorProfile } from '../../../../types'
import { $currentColorModel } from '../../../stores/colors/currentColorModel/currentColorModel'
import {
  $currentFileColorProfile,
  setCurrentFileColorProfileWithSideEffects
} from '../../../stores/colors/currentFileColorProfile/currentFileColorProfile'
import { $figmaEditorType } from '../../../stores/figmaEditorType/figmaEditorType'

export default function FileColorProfileSelect() {
  if (consoleLogInfos.includes('Component renders')) {
    console.log('Component render — FileColorProfileSelect')
  }

  const figmaEditorType = useStore($figmaEditorType)
  const currentColorModel = useStore($currentColorModel)
  const currentFileColorProfile = useStore($currentFileColorProfile)

  const handleFileColorProfile = (event: { target: HTMLSelectElement }) => {
    setCurrentFileColorProfileWithSideEffects({ newCurrentFileColorProfile: event.target.value as CurrentFileColorProfile })
  }

  return (
    <div
      className={
        'c-file-color-profile-select' +
        (figmaEditorType === 'figjam' || ['okhsv', 'okhsl'].includes(currentColorModel) ? ' c-file-color-profile-select--deactivated' : '')
      }
    >
      <div className="c-file-color-profile-select__label">File color profile</div>

      <div className="select-wrapper">
        <select onChange={handleFileColorProfile} name="file_color_profile" id="file_color_profile">
          <option value="rgb" selected={currentFileColorProfile === 'rgb' ? true : false}>
            sRGB
          </option>
          <option value="p3" selected={currentFileColorProfile === 'p3' ? true : false}>
            Display P3
          </option>
        </select>
      </div>
    </div>
  )
}
