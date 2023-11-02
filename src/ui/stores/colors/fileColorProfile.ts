import { action, atom } from 'nanostores'
import { logger } from '@nanostores/logger'
import { FileColorProfile, SyncFileColorProfileData } from '../../../types'
import { consoleLogInfos } from '../../../constants'
import sendMessageToBackend from '../../helpers/sendMessageToBackend'
import { $currentFillOrStroke } from '../currentFillOrStroke'
import { setColorHxyaWithSideEffects, $colorHxya } from './colorHxya'
import { $colorsRgba } from './colorsRgba'
import { $currentColorModel } from './currentColorModel'
import convertRgbToHxy from '../../helpers/colors/convertRgbToHxy'

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
        colorRgb: {
          r: currentColorRgba!.r,
          g: currentColorRgba!.g,
          b: currentColorRgba!.b
        },
        targetColorModel: $currentColorModel.get(),
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
