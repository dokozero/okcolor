import { action, atom } from 'nanostores'
import { logger } from '@nanostores/logger'
import { consoleLogInfos } from '../../../constants'
import { SelectionId } from '../../../types'

export const $selectionId = atom<SelectionId>('')

export const setSelectionId = action($selectionId, 'setSelectionId', (selectionId, newSelectionId: SelectionId) => {
  selectionId.set(newSelectionId)
})

if (consoleLogInfos.includes('Store updates')) {
  logger({
    selectionId: $selectionId
  })
}
