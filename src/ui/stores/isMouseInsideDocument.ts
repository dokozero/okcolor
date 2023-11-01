import { action, atom } from 'nanostores'
import { logger } from '@nanostores/logger'
import { consoleLogInfos } from '../../constants'

export const $isMouseInsideDocument = atom(false)

export const setIsMouseInsideDocument = action(
  $isMouseInsideDocument,
  'setIsMouseInsideDocument',
  (isMouseInsideDocument, newIsMouseInsideDocument: boolean) => {
    isMouseInsideDocument.set(newIsMouseInsideDocument)
  }
)

if (consoleLogInfos.includes('Store updates')) {
  logger({
    isMouseInsideDocument: $isMouseInsideDocument
  })
}
