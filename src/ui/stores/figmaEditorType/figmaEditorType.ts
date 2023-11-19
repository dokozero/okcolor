import { action, atom } from 'nanostores'
import { logger } from '@nanostores/logger'
import { consoleLogInfos } from '../../../constants'
import { FigmaEditorType } from '../../../types'

export const $figmaEditorType = atom<FigmaEditorType | null>(null)

export const setFigmaEditorType = action($figmaEditorType, 'setFigmaEditorType', (figmaEditorType, newFigmaEditorType: FigmaEditorType) => {
  figmaEditorType.set(newFigmaEditorType)
})

if (consoleLogInfos.includes('Store updates')) {
  logger({
    figmaEditorType: $figmaEditorType
  })
}
