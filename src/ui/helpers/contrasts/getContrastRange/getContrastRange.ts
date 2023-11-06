import { ContrastRange } from '../../../../types'
import { $currentContrastMethod } from '../../../stores/contrasts/currentContrastMethod/currentContrastMethod'

export default function getContrastRange(currentContrastMethod = $currentContrastMethod.get()): ContrastRange {
  if (currentContrastMethod === 'apca') {
    return {
      negative: { min: -7, max: -108 },
      positive: { min: 7, max: 106 }
    }
  } else {
    return {
      negative: { min: -1, max: -21 },
      positive: { min: 1, max: 21 }
    }
  }
}
