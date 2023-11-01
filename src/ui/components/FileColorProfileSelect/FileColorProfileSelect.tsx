import { useStore } from '@nanostores/react'
import { consoleLogInfos } from '../../../constants'
import { FileColorProfile } from '../../../types'
import { $currentColorModel } from '../../stores/colors/currentColorModel'
import { $fileColorProfile, setFileColorProfileWithSideEffects } from '../../stores/colors/fileColorProfile'
import { $figmaEditorType } from '../../stores/figmaEditorType'

export default function FileColorProfileSelect() {
  if (consoleLogInfos.includes('Component renders')) {
    console.log('Component render — FileColorProfileSelect')
  }

  const figmaEditorType = useStore($figmaEditorType)
  const currentColorModel = useStore($currentColorModel)
  const fileColorProfile = useStore($fileColorProfile)

  const handleFileColorProfile = (event: { target: HTMLSelectElement }) => {
    setFileColorProfileWithSideEffects({ newFileColorProfile: event.target.value as FileColorProfile })
  }

  return (
    <div
      className={
        'c-file-color-profile-select' +
        (figmaEditorType === 'figjam' || currentColorModel === 'okhsv' || currentColorModel === 'okhsl'
          ? ' c-file-color-profile-select--deactivated'
          : '')
      }
    >
      <div className="c-file-color-profile-select__label">File color profile</div>

      <div className="select-wrapper">
        <select onChange={handleFileColorProfile} name="file_color_profile" id="file_color_profile">
          <option value="rgb" selected={fileColorProfile === 'rgb' ? true : false}>
            sRGB
          </option>
          <option value="p3" selected={fileColorProfile === 'p3' ? true : false}>
            Display P3
          </option>
        </select>
      </div>
    </div>
  )
}
