import { action, atom } from 'nanostores'
import { logger } from '@nanostores/logger'
import { consoleLogInfos } from '../../../../constants'
import { CurrentColorModel, SyncCurrentColorModelData } from '../../../../types'
import convertRgbToHxy from '../../../helpers/colors/convertRgbToHxy/convertRgbToHxy'
import getContrastFromBgandFgRgba from '../../../helpers/contrasts/getContrastFromBgandFgRgba/getContrastFromBgandFgRgba'
import sendMessageToBackend from '../../../helpers/sendMessageToBackend/sendMessageToBackend'
import { setContrast } from '../../contrasts/contrast/contrast'
import { $currentBgOrFg, setCurrentBgOrFg } from '../../contrasts/currentBgOrFg/currentBgOrFg'
import { $lockContrast, setLockContrastWithSideEffects } from '../../contrasts/lockContrast/lockContrast'
import { $currentFillOrStroke } from '../../currentFillOrStroke/currentFillOrStroke'
import { setColorHxya, $colorHxya } from '../colorHxya/colorHxya'
import { $colorsRgba } from '../colorsRgba/colorsRgba'
import { setFileColorProfileWithSideEffects } from '../fileColorProfile/fileColorProfile'
import { $lockRelativeChroma, setLockRelativeChromaWithSideEffects } from '../lockRelativeChroma/lockRelativeChroma'
import merge from 'lodash/merge'

export const $currentColorModel = atom<CurrentColorModel>('oklchCss')

export const setCurrentColorModel = action(
  $currentColorModel,
  'setCurrentColorModel',
  (currentColorModel, newCurrentColorModel: CurrentColorModel) => {
    currentColorModel.set(newCurrentColorModel)
  }
)

type SideEffects = {
  syncCurrentBgOrFg: boolean
  syncCurrentColorModelWithBackend: boolean
  syncColorHxya: boolean
  syncLockRelativeChroma: boolean
  syncLockContrast: boolean
  syncFileColorProfile: boolean
  syncContrast: boolean
}

type Props = {
  newCurrentColorModel: CurrentColorModel
  sideEffects?: Partial<SideEffects>
}

const defaultSideEffects: SideEffects = {
  syncCurrentBgOrFg: true,
  syncCurrentColorModelWithBackend: true,
  syncColorHxya: true,
  syncLockRelativeChroma: true,
  syncLockContrast: true,
  syncFileColorProfile: true,
  syncContrast: true
}

export const setCurrentColorModelWithSideEffects = action(
  $currentColorModel,
  'setCurrentColorModelWithSideEffects',
  (currentColorModel, props: Props) => {
    const { newCurrentColorModel, sideEffects: partialSideEffects } = props

    const sideEffects = JSON.parse(JSON.stringify(defaultSideEffects))
    merge(sideEffects, partialSideEffects)

    currentColorModel.set(newCurrentColorModel)

    if (sideEffects.syncCurrentBgOrFg) {
      if ($currentBgOrFg.get() === 'bg') setCurrentBgOrFg('fg')
    }

    if (sideEffects.syncCurrentColorModelWithBackend) {
      sendMessageToBackend<SyncCurrentColorModelData>({
        type: 'syncCurrentColorModel',
        data: {
          currentColorModel: newCurrentColorModel
        }
      })
    }

    if (sideEffects.syncColorHxya) {
      const currentColorRgba = $colorsRgba.get()[`${$currentFillOrStroke.get()}`]

      const newColorHxy = convertRgbToHxy({
        colorRgb: currentColorRgba!,
        targetColorModel: newCurrentColorModel
      })

      setColorHxya({ ...newColorHxy, a: $colorHxya.get().a })
    }

    if (['okhsv', 'okhsl'].includes(newCurrentColorModel)) {
      // If one of these values are true, we need to set them to false as relativeChroma and contrast are hidden in OkHSV or OkHSL
      if (sideEffects.syncLockRelativeChroma && $lockRelativeChroma.get()) setLockRelativeChromaWithSideEffects({ newLockRelativeChroma: false })
      if (sideEffects.syncLockContrast && $lockContrast.get()) setLockContrastWithSideEffects({ newLockContrast: false })

      if (sideEffects.syncFileColorProfile) {
        // We constrain to sRGB profile with these models to avoid confusion for users as they are not intended to be used in P3's space.
        setFileColorProfileWithSideEffects({
          newFileColorProfile: 'rgb',
          sideEffects: {
            syncColorHxya: false
          }
        })
      }
    } else {
      if (sideEffects.syncContrast) {
        const newContrast = getContrastFromBgandFgRgba($colorsRgba.get().fill!, $colorsRgba.get().parentFill!)
        setContrast(newContrast)
      }
    }
  }
)

if (consoleLogInfos.includes('Store updates')) {
  logger({
    currentColorModel: $currentColorModel
  })
}
