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
import { $fileColorProfile, setFileColorProfileWithSideEffects } from '../fileColorProfile/fileColorProfile'
import { $lockRelativeChroma, setLockRelativeChromaWithSideEffects } from '../lockRelativeChroma/lockRelativeChroma'

export const $currentColorModel = atom<CurrentColorModel>('oklchCss')

export const setCurrentColorModel = action(
  $currentColorModel,
  'setCurrentColorModel',
  (currentColorModel, newCurrentColorModel: CurrentColorModel) => {
    currentColorModel.set(newCurrentColorModel)
  }
)

type Props = {
  newCurrentColorModel: CurrentColorModel
  syncCurrentBgOrFg?: boolean
  syncCurrentColorModelWithBackend?: boolean
  syncColorHxya?: boolean
  syncLockRelativeChroma?: boolean
  syncLockContrast?: boolean
  syncFileColorProfileWithSideEffects?: boolean
  syncContrast?: boolean
}

/**
 * Side effect: syncCurrentBgOrFg, syncCurrentColorModelWithBackend, syncColorHxya, syncLockRelativeChroma, syncLockContrast, syncFileColorProfileWithSideEffects, syncContrast
 */
export const setCurrentColorModelWithSideEffects = action(
  $currentColorModel,
  'setCurrentColorModelWithSideEffects',
  (currentColorModel, props: Props) => {
    const {
      newCurrentColorModel,
      syncCurrentBgOrFg = true,
      syncCurrentColorModelWithBackend = true,
      syncColorHxya = true,
      syncLockRelativeChroma = true,
      syncLockContrast = true,
      syncFileColorProfileWithSideEffects = true,
      syncContrast = true
    } = props

    currentColorModel.set(newCurrentColorModel)

    if (syncCurrentBgOrFg) {
      if ($currentBgOrFg.get() === 'bg') setCurrentBgOrFg('fg')
    }

    if (syncCurrentColorModelWithBackend) {
      sendMessageToBackend<SyncCurrentColorModelData>({
        type: 'syncCurrentColorModel',
        data: {
          currentColorModel: newCurrentColorModel
        }
      })
    }

    if (syncColorHxya) {
      const currentColorRgba = $colorsRgba.get()[`${$currentFillOrStroke.get()}`]

      const newColorHxy = convertRgbToHxy({
        colorRgb: {
          r: currentColorRgba!.r,
          g: currentColorRgba!.g,
          b: currentColorRgba!.b
        },
        targetColorModel: newCurrentColorModel,
        colorSpace: $fileColorProfile.get()
      })

      setColorHxya({ ...newColorHxy, a: $colorHxya.get().a })
    }

    if (['okhsv', 'okhsl'].includes(newCurrentColorModel)) {
      // If one of these values are true, we need to set them to false as relativeChroma and contrast are hidden in OkHSV or OkHSL
      if (syncLockRelativeChroma && $lockRelativeChroma.get()) setLockRelativeChromaWithSideEffects({ newLockRelativeChroma: false })
      if (syncLockContrast && $lockContrast.get()) setLockContrastWithSideEffects({ newLockContrast: false })

      if (syncFileColorProfileWithSideEffects) {
        // We constrain to sRGB profile with these models to avoid confusion for users as they are not intended to be used in P3's space.
        setFileColorProfileWithSideEffects({ newFileColorProfile: 'rgb', syncColorHxya: false })
      }
    } else {
      if (syncContrast) {
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
