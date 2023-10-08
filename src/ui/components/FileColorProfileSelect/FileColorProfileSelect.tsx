import { useStore } from '@nanostores/react'
import {
  $fileColorProfile,
  $currentColorModel,
  $colorHxya,
  $colorsRgba,
  $currentFillOrStroke,
  $figmaEditorType,
  updateColorHxyaAndSyncColorsRgbaAndPlugin
} from '../../store'
import { consoleLogInfos } from '../../../constants'
import { FileColorProfile } from '../../../types'
import convertRgbToHxy from '../../helpers/convertRgbToHxy'

export default function FileColorProfileSelect() {
  if (consoleLogInfos.includes('Component renders')) {
    console.log('Component render — FileColorProfileSelect')
  }

  const figmaEditorType = useStore($figmaEditorType)
  const currentColorModel = useStore($currentColorModel)
  const fileColorProfile = useStore($fileColorProfile)

  const handleFileColorProfile = (event: { target: HTMLSelectElement }) => {
    const newFileColorProfile = event.target.value as FileColorProfile

    $fileColorProfile.set(newFileColorProfile)

    const currentColorRgba = $colorsRgba.get()[`${$currentFillOrStroke.get()}`]!

    const newColorHxy = convertRgbToHxy({
      colorRgb: {
        r: currentColorRgba.r,
        g: currentColorRgba.g,
        b: currentColorRgba.b
      },
      targetColorModel: $currentColorModel.get()!,
      fileColorProfile: newFileColorProfile
    })

    updateColorHxyaAndSyncColorsRgbaAndPlugin({ ...newColorHxy, a: $colorHxya.get().a }, false, false)

    parent.postMessage(
      {
        pluginMessage: {
          message: 'syncFileColorProfile',
          fileColorProfile: newFileColorProfile
        }
      },
      '*'
    )
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
      <p>File color profile</p>

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
