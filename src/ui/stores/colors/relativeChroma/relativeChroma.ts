import { action, atom } from 'nanostores'
import { logger } from '@nanostores/logger'
import { consoleLogInfos } from '../../../../constants'
import { RelativeChroma } from '../../../../types'
import convertRelativeChromaToAbsolute from '../../../helpers/colors/convertRelativeChromaToAbsolute/convertRelativeChromaToAbsolute'
import { $colorHxya, setColorHxyaWithSideEffects } from '../colorHxya/colorHxya'

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
      h: $colorHxya.get().h,
      y: $colorHxya.get().y,
      relativeChroma: newRelativeChroma
    })

    setColorHxyaWithSideEffects({
      newColorHxya: { x: newColorX },
      sideEffects: {
        lockRelativeChroma: false,
        syncRelativeChroma: false
      }
    })
  }
})

if (consoleLogInfos.includes('Store updates')) {
  logger({
    relativeChroma: $relativeChroma
  })
}
