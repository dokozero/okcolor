import { action, atom } from 'nanostores'
import { logger } from '@nanostores/logger'
import { RelativeChroma } from '../../../types'
import { consoleLogInfos } from '../../../constants'
import { $colorHxya, setColorHxyaWithSideEffects } from './colorHxya'
import convertRelativeChromaToAbsolute from '../../helpers/colors/convertRelativeChromaToAbsolute'

export const $relativeChroma = atom<RelativeChroma>(0)

export const setRelativeChroma = action($relativeChroma, 'setRelativeChroma', (relativeChroma, newRelativeChroma: RelativeChroma) => {
  relativeChroma.set(newRelativeChroma)
})

type Props = {
  newRelativeChroma: RelativeChroma
  syncColorHxya?: boolean
}

/**
 * Side effects (default to true): syncColorHxya
 */
export const setRelativeChromaWithSideEffects = action($relativeChroma, 'setRelativeChromaWithSideEffects', (relativeChroma, props: Props) => {
  const { newRelativeChroma, syncColorHxya = true } = props

  relativeChroma.set(newRelativeChroma)

  if (syncColorHxya) {
    const newColorX = convertRelativeChromaToAbsolute({
      colorHxya: $colorHxya.get(),
      relativeChroma: newRelativeChroma
    })

    // TODO - remove?
    // This condition could be true if for example user is updating relative chroma near white of black, in this case we'll have multiple absolute chroma values for the same relative chroma one.
    // In that case we want to update directly the $relativeChroma value or the input would not be updated.
    if (newColorX === $colorHxya.get().x) return

    setColorHxyaWithSideEffects({ newColorHxya: { x: newColorX }, bypassLockRelativeChromaFilter: true, syncRelativeChroma: false })
  }
})

if (consoleLogInfos.includes('Store updates')) {
  logger({
    relativeChroma: $relativeChroma
  })
}
