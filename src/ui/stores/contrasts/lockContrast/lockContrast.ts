import { action, atom } from 'nanostores'
import { logger } from '@nanostores/logger'
import { consoleLogInfos } from '../../../../constants'
import { SyncLockContrastData } from '../../../../types'
import getNewXandYFromContrast from '../../../helpers/contrasts/getNewXandYFromContrast/getNewXandYFromContrast'
import sendMessageToBackend from '../../../helpers/sendMessageToBackend/sendMessageToBackend'
import { $colorHxya, setColorHxyaWithSideEffects } from '../../colors/colorHxya/colorHxya'
import { $lockRelativeChroma } from '../../colors/lockRelativeChroma/lockRelativeChroma'
import { $contrast } from '../contrast/contrast'
import merge from 'lodash/merge'

export const $lockContrast = atom(false)

export const setLockContrast = action($lockContrast, 'setLockContrast', (lockContrast, newLockContrast: boolean) => {
  lockContrast.set(newLockContrast)
})

type SideEffects = {
  syncLockContrastWithBackend: boolean
}

type Props = {
  newLockContrast: boolean
  sideEffects?: Partial<SideEffects>
}

const defaultSideEffects: SideEffects = {
  syncLockContrastWithBackend: true
}

export const setLockContrastWithSideEffects = action($lockContrast, 'setLockContrastWithSideEffects', (lockContrast, props: Props) => {
  const { newLockContrast, sideEffects: partialSideEffects } = props

  const sideEffects = JSON.parse(JSON.stringify(defaultSideEffects))
  merge(sideEffects, partialSideEffects)

  lockContrast.set(newLockContrast)

  if (sideEffects.syncLockContrastWithBackend) {
    sendMessageToBackend<SyncLockContrastData>({
      type: 'syncLockContrast',
      data: {
        newLockContrast: newLockContrast
      }
    })
  }

  // if lockConstrat is true, we need to adjust x and y value as for example we can have multiple Y values for the same contrast, without this, when setting lockContrast to true, we can have the manipulator on the color picker slightly off the lock line.
  if (newLockContrast) {
    const newXy = getNewXandYFromContrast({
      h: $colorHxya.get().h,
      x: $colorHxya.get().x,
      targetContrast: $contrast.get(),
      lockRelativeChroma: $lockRelativeChroma.get()
    })

    setColorHxyaWithSideEffects({
      newColorHxya: newXy,
      sideEffects: {
        colorsRgba: {
          syncContrast: false
        }
      }
    })
  }
})

if (consoleLogInfos.includes('Store updates')) {
  logger({
    lockContrast: $lockContrast
  })
}
