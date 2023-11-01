import { action, atom } from 'nanostores'
import { logger } from '@nanostores/logger'
import { CurrentBgOrFg } from '../../../types'
import { consoleLogInfos } from '../../../constants'

export const $currentBgOrFg = atom<CurrentBgOrFg>('fg')

export const setCurrentBgOrFg = action($currentBgOrFg, 'setCurrentBgOrFg', (currentBgOrFg, newCurrentBgOrFg: CurrentBgOrFg) => {
  currentBgOrFg.set(newCurrentBgOrFg)
})

if (consoleLogInfos.includes('Store updates')) {
  logger({
    currentBgOrFg: $currentBgOrFg
  })
}
