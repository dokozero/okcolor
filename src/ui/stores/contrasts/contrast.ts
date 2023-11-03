import { action, atom } from 'nanostores'
import { logger } from '@nanostores/logger'
import { ApcaContrast, WcagContrast } from '../../../types'
import { consoleLogInfos } from '../../../constants'
import { $colorHxya, setColorHxyaWithSideEffects } from '../colors/colorHxya'
import { $colorsRgba } from '../colors/colorsRgba'
import getContrastFromBgandFgRgba from '../../helpers/contrasts/getContrastFromBgandFgRgba'
import getNewXandYFromContrast from '../../helpers/contrasts/getNewXandYFromContrast'

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

  contrast.set(newContrast)

  if (syncColorHxya) {
    const newXy = getNewXandYFromContrast({
      currentH: $colorHxya.get().h,
      currentX: $colorHxya.get().x,
      targetContrast: newContrast
    })
    setColorHxyaWithSideEffects({ newColorHxya: newXy, bypassLockContrastFilter: true, syncContrast: false })
  }

  // In case we get a value that is bigger than what is possible, for example if user wants a contrast of 40 but with the current bg abd fg color the maximum is 30, we need to do this test, otherwize the value 40 will be kept in the contrast input.
  const newContrastClamped: ApcaContrast | WcagContrast = getContrastFromBgandFgRgba($colorsRgba.get().fill!, $colorsRgba.get().parentFill!)
  if (newContrast !== newContrastClamped) setContrast(newContrastClamped)
})

if (consoleLogInfos.includes('Store updates')) {
  logger({
    contrast: $contrast
  })
}
