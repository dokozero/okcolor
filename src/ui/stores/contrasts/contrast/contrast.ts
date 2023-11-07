import { action, atom } from 'nanostores'
import { logger } from '@nanostores/logger'
import { consoleLogInfos } from '../../../../constants'
import { ApcaContrast, WcagContrast } from '../../../../types'
import getContrastFromBgandFgRgba from '../../../helpers/contrasts/getContrastFromBgandFgRgba/getContrastFromBgandFgRgba'
import getNewXandYFromContrast from '../../../helpers/contrasts/getNewXandYFromContrast/getNewXandYFromContrast'
import { $colorHxya, setColorHxyaWithSideEffects } from '../../colors/colorHxya/colorHxya'
import { $colorsRgba } from '../../colors/colorsRgba/colorsRgba'
import filterNewContrast from '../../../helpers/contrasts/filterNewContrast/filterNewContrast'

export const $contrast = atom<ApcaContrast | WcagContrast>(0)

export const setContrast = action($contrast, 'setContrast', (contrast, newContrast: ApcaContrast | WcagContrast) => {
  contrast.set(newContrast)
})

type Props = {
  newContrast: ApcaContrast | WcagContrast
  syncColorHxya?: boolean
}

/**
 * Side effects (default to true): syncColorHxya
 */
export const setContrastWithSideEffects = action($contrast, 'setContrastWithSideEffects', (contrast, props: Props) => {
  const { newContrast, syncColorHxya = true } = props

  const filteredNewContrast = filterNewContrast(newContrast)

  if (syncColorHxya) {
    const newXy = getNewXandYFromContrast({
      h: $colorHxya.get().h,
      x: $colorHxya.get().x,
      targetContrast: filteredNewContrast
    })
    setColorHxyaWithSideEffects({
      newColorHxya: newXy,
      sideEffects: {
        colorsRgba: {
          syncContrast: false
        }
      },
      lockContrast: false
    })
  }

  // In case we get a value that is bigger than what is possible, for example if user wants a contrast of 40 but with the current bg abd fg color the maximum is 30, we need to do this test, otherwize the value 40 will be kept in the contrast input.
  const newContrastClamped: ApcaContrast | WcagContrast = getContrastFromBgandFgRgba($colorsRgba.get().fill!, $colorsRgba.get().parentFill!)
  if (newContrastClamped !== 0 && Math.abs(filteredNewContrast) > Math.abs(newContrastClamped)) setContrast(newContrastClamped)
  else contrast.set(filteredNewContrast)
})

if (consoleLogInfos.includes('Store updates')) {
  logger({
    contrast: $contrast
  })
}
