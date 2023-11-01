import { action, atom } from 'nanostores'
import { logger } from '@nanostores/logger'
import { consoleLogInfos } from '../../../constants'

export const $lockContrast = atom(false)

export const setLockContrast = action($lockContrast, 'setLockContrast', (lockContrast, newLockContrast: boolean) => {
  lockContrast.set(newLockContrast)
})

if (consoleLogInfos.includes('Store updates')) {
  logger({
    lockContrast: $lockContrast
  })
}
