import { action, atom } from 'nanostores'
import { logger } from '@nanostores/logger'
import { consoleLogInfos } from '../../../../constants'
import { FileColorProfile, SyncFileColorProfileData } from '../../../../types'
import convertRgbToHxy from '../../../helpers/colors/convertRgbToHxy/convertRgbToHxy'
import sendMessageToBackend from '../../../helpers/sendMessageToBackend/sendMessageToBackend'
import { $currentFillOrStroke } from '../../currentFillOrStroke/currentFillOrStroke'
import { setColorHxyaWithSideEffects, $colorHxya } from '../colorHxya/colorHxya'
import { $colorsRgba } from '../colorsRgba/colorsRgba'
import merge from 'lodash/merge'

export const $fileColorProfile = atom<FileColorProfile>('rgb')

export const setFileColorProfile = action($fileColorProfile, 'setFileColorProfile', (fileColorProfile, newFileColorProfile: FileColorProfile) => {
  fileColorProfile.set(newFileColorProfile)
})

type SideEffects = {
  syncColorHxya: boolean
  syncFileColorProfileWithBackend: boolean
}

type Props = {
  newFileColorProfile: FileColorProfile
  sideEffects?: Partial<SideEffects>
}

const defaultSideEffects: SideEffects = {
  syncColorHxya: true,
  syncFileColorProfileWithBackend: true
}

export const setFileColorProfileWithSideEffects = action(
  $fileColorProfile,
  'setFileColorProfileWithSideEffects',
  (fileColorProfile, props: Props) => {
    const { newFileColorProfile, sideEffects: partialSideEffects } = props

    const sideEffects = JSON.parse(JSON.stringify(defaultSideEffects))
    merge(sideEffects, partialSideEffects)

    fileColorProfile.set(newFileColorProfile)

    const currentColorRgba = $colorsRgba.get()[`${$currentFillOrStroke.get()}`]

    if (sideEffects.syncColorHxya) {
      const newColorHxy = convertRgbToHxy({
        colorRgb: currentColorRgba!,
        colorSpace: newFileColorProfile
      })

      setColorHxyaWithSideEffects({
        newColorHxya: { ...newColorHxy, a: $colorHxya.get().a },
        sideEffects: {
          colorsRgba: {
            syncColorsRgba: false
          }
        }
      })
    }

    if (sideEffects.syncFileColorProfileWithBackend) {
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
