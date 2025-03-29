import { OKLCH_CHROMA_SCALE, PICKER_SIZE } from '../../../../../constants'
import getLinearMappedValue from '../../../../helpers/getLinearMappedValue/getLinearMappedValue'
import { $colorHxya } from '../../../../stores/colors/colorHxya/colorHxya'
import { $currentColorModel } from '../../../../stores/colors/currentColorModel/currentColorModel'
import { $relativeChroma } from '../../../../stores/colors/relativeChroma/relativeChroma'
import { $oklchRenderMode } from '../../../../stores/oklchRenderMode/oklchRenderMode'

type Props = {
  position: number
}

let previousXManipulatorPosition = 0

export default function getNewManipulatorPosition(props: Props) {
  const { position } = props

  const newManipulatorPosition = {
    x: 0,
    y: 0
  }

  if ($currentColorModel.get() === 'oklch') {
    let startPosition = 0
    let endPosition = 0

    if ($oklchRenderMode.get() === 'triangle') {
      startPosition = $colorHxya.get().x * OKLCH_CHROMA_SCALE
      endPosition = $relativeChroma.get() / 100
      newManipulatorPosition.x = getLinearMappedValue({
        valueToMap: position,
        originalRange: { min: 0, max: 100 },
        targetRange: { min: startPosition, max: endPosition }
      })
    } else if ($oklchRenderMode.get() === 'square') {
      if ($colorHxya.get().y < 1 || $colorHxya.get().y > 99) {
        // Fix to avoid the manipulator going to left corner when Y is at 100 or 0.
        newManipulatorPosition.x = previousXManipulatorPosition
      } else {
        startPosition = $relativeChroma.get() / 100
        endPosition = $colorHxya.get().x * OKLCH_CHROMA_SCALE

        newManipulatorPosition.x = getLinearMappedValue({
          valueToMap: position,
          originalRange: { min: 100, max: 0 },
          targetRange: { min: startPosition, max: endPosition }
        })

        previousXManipulatorPosition = newManipulatorPosition.x
      }
    }
  } else {
    newManipulatorPosition.x = $colorHxya.get().x / 100
  }

  newManipulatorPosition.x = PICKER_SIZE * newManipulatorPosition.x
  newManipulatorPosition.y = PICKER_SIZE * (1 - $colorHxya.get().y / 100)

  return newManipulatorPosition
}
