import { action, atom } from 'nanostores'
import { logger } from '@nanostores/logger'
import { consoleLogInfos } from '../../../../constants'
import { CurrentFileColorProfile, SyncCurrentFileColorProfileData } from '../../../../types'
import convertRgbToHxy from '../../../helpers/colors/convertRgbToHxy/convertRgbToHxy'
import sendMessageToBackend from '../../../helpers/sendMessageToBackend/sendMessageToBackend'
import { $currentFillOrStroke } from '../../currentFillOrStroke/currentFillOrStroke'
import { setColorHxyaWithSideEffects, $colorHxya } from '../colorHxya/colorHxya'
import { $colorsRgba } from '../colorsRgba/colorsRgba'
import merge from 'lodash/merge'

export const $currentFileColorProfile = atom<CurrentFileColorProfile>('rgb')

export const setCurrentFileColorProfile = action(
  $currentFileColorProfile,
  'setCurrentFileColorProfile',
  (currentFileColorProfile, newCurrentFileColorProfile: CurrentFileColorProfile) => {
    currentFileColorProfile.set(newCurrentFileColorProfile)
  }
)

type SideEffects = {
  syncColorHxya: boolean
  syncCurrentFileColorProfileWithBackend: boolean
}

type Props = {
  newCurrentFileColorProfile: CurrentFileColorProfile
  sideEffects?: Partial<SideEffects>
}

const defaultSideEffects: SideEffects = {
  syncColorHxya: true,
  syncCurrentFileColorProfileWithBackend: true
}

export const setCurrentFileColorProfileWithSideEffects = action(
  $currentFileColorProfile,
  'setCurrentFileColorProfileWithSideEffects',
  (currentFileColorProfile, props: Props) => {
    const { newCurrentFileColorProfile, sideEffects: partialSideEffects } = props

    const sideEffects = JSON.parse(JSON.stringify(defaultSideEffects))
    merge(sideEffects, partialSideEffects)

    currentFileColorProfile.set(newCurrentFileColorProfile)

    const currentColorRgba = $colorsRgba.get()[`${$currentFillOrStroke.get()}`]

    if (sideEffects.syncColorHxya) {
      const newColorHxy = convertRgbToHxy({
        colorRgb: currentColorRgba!,
        colorSpace: newCurrentFileColorProfile
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

    if (sideEffects.syncCurrentFileColorProfileWithBackend) {
      sendMessageToBackend<SyncCurrentFileColorProfileData>({
        type: 'syncCurrentFileColorProfile',
        data: {
          newCurrentFileColorProfile: newCurrentFileColorProfile
        }
      })
    }
  }
)

if (consoleLogInfos.includes('Store updates')) {
  logger({
    currentFileColorProfile: $currentFileColorProfile
  })
}
