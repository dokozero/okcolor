import { action, atom } from 'nanostores'
import { logger } from '@nanostores/logger'
import { FigmaEditorType } from '../../types'
import { consoleLogInfos } from '../../constants'

export const $figmaEditorType = atom<FigmaEditorType | null>(null)

export const setFigmaEditorType = action($figmaEditorType, 'setFigmaEditorType', (figmaEditorType, newFigmaEditorType: FigmaEditorType) => {
  figmaEditorType.set(newFigmaEditorType)
})

if (consoleLogInfos.includes('Store updates')) {
  logger({
    figmaEditorType: $figmaEditorType
  })
}
