import { action, atom } from 'nanostores'
import { logger } from '@nanostores/logger'
import { consoleLogInfos } from '../../../../constants'
import { CurrentFileColorProfile } from '../../../../types'

export const $currentFileColorProfile = atom<CurrentFileColorProfile>('rgb')

export const setCurrentFileColorProfile = action(
  $currentFileColorProfile,
  'setCurrentFileColorProfile',
  (currentFileColorProfile, newCurrentFileColorProfile: CurrentFileColorProfile) => {
    currentFileColorProfile.set(newCurrentFileColorProfile)
  }
)

if (consoleLogInfos.includes('Store updates')) {
  logger({
    currentFileColorProfile: $currentFileColorProfile
  })
}
