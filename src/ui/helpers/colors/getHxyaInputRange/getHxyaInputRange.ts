import { MAX_CHROMA_P3 } from '../../../../constants'
import { HxyaLabels, HxyaTypes } from '../../../../types'
import { $currentColorModel } from '../../../stores/colors/currentColorModel/currentColorModel'
import { $userSettings } from '../../../stores/settings/userSettings/userSettings'

type ReturnObject = {
  min: HxyaTypes
  max: HxyaTypes
}

export default function getHxyaInputRange(property: keyof typeof HxyaLabels, currentColorModel = $currentColorModel.get()): ReturnObject {
  switch (property) {
    case 'h':
      return { min: 0, max: 360 }

    case 'x':
      if (['okhsv', 'okhsl'].includes(currentColorModel)) return { min: 0, max: 100 }
      else return { min: 0, max: $userSettings.get().useSimplifiedChroma ? MAX_CHROMA_P3 * 100 : MAX_CHROMA_P3 }

    case 'y':
      return { min: 0, max: 100 }

    case 'a':
      return { min: 0, max: 100 }
  }
}
