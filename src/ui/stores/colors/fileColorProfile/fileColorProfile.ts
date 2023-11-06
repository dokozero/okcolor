import { action, atom } from 'nanostores'
import { logger } from '@nanostores/logger'
import { consoleLogInfos } from '../../../../constants'
import { FileColorProfile, SyncFileColorProfileData } from '../../../../types'
import convertRgbToHxy from '../../../helpers/colors/convertRgbToHxy/convertRgbToHxy'
import sendMessageToBackend from '../../../helpers/sendMessageToBackend/sendMessageToBackend'
import { $currentFillOrStroke } from '../../currentFillOrStroke/currentFillOrStroke'
import { setColorHxyaWithSideEffects, $colorHxya } from '../colorHxya/colorHxya'
import { $colorsRgba } from '../colorsRgba/colorsRgba'

export const $fileColorProfile = atom<FileColorProfile>('rgb')

export const setFileColorProfile = action($fileColorProfile, 'setFileColorProfile', (fileColorProfile, newFileColorProfile: FileColorProfile) => {
  fileColorProfile.set(newFileColorProfile)
})

type Props = {
  newFileColorProfile: FileColorProfile
  syncColorHxya?: boolean
  syncFileColorProfileWithBackend?: boolean
}

/**
 * Side effects (true by default): syncColorHxya, syncFileColorProfileWithBackend.
 */
export const setFileColorProfileWithSideEffects = action(
  $fileColorProfile,
  'setFileColorProfileWithSideEffects',
  (fileColorProfile, props: Props) => {
    const { newFileColorProfile, syncColorHxya = true, syncFileColorProfileWithBackend = true } = props

    fileColorProfile.set(newFileColorProfile)

    const currentColorRgba = $colorsRgba.get()[`${$currentFillOrStroke.get()}`]

    if (syncColorHxya) {
      const newColorHxy = convertRgbToHxy({
        colorRgb: currentColorRgba!,
        colorSpace: newFileColorProfile
      })

      setColorHxyaWithSideEffects({
        newColorHxya: { ...newColorHxy, a: $colorHxya.get().a },
        syncColorsRgba: false,
        syncColorRgbWithBackend: false
      })
    }

    if (syncFileColorProfileWithBackend) {
      sendMessageToBackend<SyncFileColorProfileData>({
        type: 'syncFileColorProfile',
        data: {
          fileColorProfile: newFileColorProfile
        }
      })
    }
  }
)

if (consoleLogInfos.includes('Store updates')) {
  logger({
    fileColorProfile: $fileColorProfile
  })
}
