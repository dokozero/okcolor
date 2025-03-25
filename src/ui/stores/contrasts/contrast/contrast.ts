/* eslint-disable @typescript-eslint/ban-ts-comment */

import { action, atom } from 'nanostores'
import { logger } from '@nanostores/logger'
import { consoleLogInfos } from '../../../../constants'
import { ApcaContrast, WcagContrast } from '../../../../types'
import getContrastFromBgandFgRgba from '../../../helpers/contrasts/getContrastFromBgandFgRgba/getContrastFromBgandFgRgba'
import getNewXandYFromContrast from '../../../helpers/contrasts/getNewXandYFromContrast/getNewXandYFromContrast'
import { $colorHxya, setColorHxyaWithSideEffects } from '../../colors/colorHxya/colorHxya'
import { $colorsRgba } from '../../colors/colorsRgba/colorsRgba'
import filterNewContrast from '../../../helpers/contrasts/filterNewContrast/filterNewContrast'
import merge from 'lodash/merge'
import { $lockRelativeChroma } from '../../colors/lockRelativeChroma/lockRelativeChroma'
import { $oklchRenderMode } from '../../oklchRenderMode/oklchRenderMode'

export const $contrast = atom<ApcaContrast | WcagContrast>(0)

export const setContrast = action($contrast, 'setContrast', (contrast, newContrast: ApcaContrast | WcagContrast) => {
  contrast.set(newContrast)
})

type SideEffects = {
  syncColorHxya: boolean
}

type Props = {
  newContrast: ApcaContrast | WcagContrast
  sideEffects?: Partial<SideEffects>
}

const defaultSideEffects: SideEffects = {
  syncColorHxya: true
}

export const setContrastWithSideEffects = action($contrast, 'setContrastWithSideEffects', (contrast, props: Props) => {
  const { newContrast, sideEffects: partialSideEffects } = props

  const sideEffects = JSON.parse(JSON.stringify(defaultSideEffects))
  merge(sideEffects, partialSideEffects)

  const filteredNewContrast = filterNewContrast(newContrast)

  if (sideEffects.syncColorHxya) {
    let localLockRelativeChroma = $lockRelativeChroma.get()

    // We lock the relative chroma locally because when in square OkLCH mode, we want to keep relative chroma fixed when updating the contrast.
    if ($oklchRenderMode.get() === 'square') {
      localLockRelativeChroma = true
    }

    const newXy = getNewXandYFromContrast({
      h: $colorHxya.get().h,
      x: $colorHxya.get().x,
      targetContrast: filteredNewContrast,
      lockRelativeChroma: localLockRelativeChroma
    })

    setColorHxyaWithSideEffects({
      newColorHxya: newXy,
      lockRelativeChroma: localLockRelativeChroma,
      sideEffects: {
        colorsRgba: {
          syncContrast: false
        }
      },
      lockContrast: false
    })
  }

  // In case we get a value that is bigger than what is possible, for example if user wants a contrast of 40 but with the current bg abd fg color the maximum is 30, we need to do this test, otherwize the value 40 will be kept in the contrast input.
  const newContrastClamped: ApcaContrast | WcagContrast = getContrastFromBgandFgRgba({
    fg: $colorsRgba.get().fill!,
    bg: $colorsRgba.get().parentFill!
  })

  if (newContrastClamped !== 0 && Math.abs(filteredNewContrast) > Math.abs(newContrastClamped)) contrast.set(newContrastClamped)
  // In APCA, if we are on a pure black bg with a pure white fg or the opposite, without this condition it would be possible to use arrow to go up to the limit.
  else if (newContrastClamped === 0 && ($colorHxya.get().y === 0 || $colorHxya.get().y === 100)) contrast.set(newContrastClamped)
  // In WCAG, if we are on a pure black bg with a pure white fg or the opposite, if the user is updating the contrast with arrow keys, when at 1 or -1, it will go back and forth to 1 and -1, because in ContrastInput(), we don't know when we are in that case, hence this XOR condition with ^ that is the same to say: "if filteredNewContrast = -1 and newContrastClamped = 1 or if filteredNewContrast = 1 and newContrastClamped = -1, then run contrast.set(newContrastClamped)".
  // @ts-ignore
  else if ((filteredNewContrast === -1) ^ (newContrastClamped === -1)) contrast.set(newContrastClamped)
  else contrast.set(filteredNewContrast)
})

if (consoleLogInfos.includes('Store updates')) {
  logger({
    contrast: $contrast
  })
}
