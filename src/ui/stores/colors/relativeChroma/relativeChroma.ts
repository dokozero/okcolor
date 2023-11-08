import { action, atom } from 'nanostores'
import { logger } from '@nanostores/logger'
import { consoleLogInfos } from '../../../../constants'
import { RelativeChroma } from '../../../../types'
import convertRelativeChromaToAbsolute from '../../../helpers/colors/convertRelativeChromaToAbsolute/convertRelativeChromaToAbsolute'
import { $colorHxya, setColorHxyaWithSideEffects } from '../colorHxya/colorHxya'
import merge from 'lodash/merge'

export const $relativeChroma = atom<RelativeChroma>(0)

export const setRelativeChroma = action($relativeChroma, 'setRelativeChroma', (relativeChroma, newRelativeChroma: RelativeChroma) => {
  relativeChroma.set(newRelativeChroma)
})

type SideEffects = {
  syncColorHxya: boolean
}

type Props = {
  newRelativeChroma: RelativeChroma
  sideEffects?: Partial<SideEffects>
}

const defaultSideEffects: SideEffects = {
  syncColorHxya: true
}

export const setRelativeChromaWithSideEffects = action($relativeChroma, 'setRelativeChromaWithSideEffects', (relativeChroma, props: Props) => {
  const { newRelativeChroma, sideEffects: partialSideEffects } = props

  const sideEffects = JSON.parse(JSON.stringify(defaultSideEffects))
  merge(sideEffects, partialSideEffects)

  relativeChroma.set(newRelativeChroma)

  if (sideEffects.syncColorHxya) {
    const newColorX = convertRelativeChromaToAbsolute({
      h: $colorHxya.get().h,
      y: $colorHxya.get().y,
      relativeChroma: newRelativeChroma
    })

    setColorHxyaWithSideEffects({
      newColorHxya: { x: newColorX },
      sideEffects: {
        syncRelativeChroma: false
      },
      lockRelativeChroma: false
    })
  }
})

if (consoleLogInfos.includes('Store updates')) {
  logger({
    relativeChroma: $relativeChroma
  })
}
