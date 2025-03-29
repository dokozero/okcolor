import round from 'lodash/round'
import { PICKER_SIZE, MAX_CHROMA_P3 } from '../../../../../constants'
import convertAbsoluteChromaToRelative from '../../../../helpers/colors/convertAbsoluteChromaToRelative/convertAbsoluteChromaToRelative'
import convertRelativeChromaToAbsolute from '../../../../helpers/colors/convertRelativeChromaToAbsolute/convertRelativeChromaToAbsolute'
import getColorHxyDecimals from '../../../../helpers/colors/getColorHxyDecimals/getColorHxyDecimals'
import getLinearMappedValue from '../../../../helpers/getLinearMappedValue/getLinearMappedValue'
import limitMouseManipulatorPosition from '../../../../helpers/limitMouseManipulatorPosition/limitMouseManipulatorPosition'
import { $colorHxya, setColorHxyaWithSideEffects } from '../../../../stores/colors/colorHxya/colorHxya'
import { $currentColorModel } from '../../../../stores/colors/currentColorModel/currentColorModel'
import { $lockRelativeChroma } from '../../../../stores/colors/lockRelativeChroma/lockRelativeChroma'
import { $lockContrast } from '../../../../stores/contrasts/lockContrast/lockContrast'
import { $currentKeysPressed } from '../../../../stores/currentKeysPressed/currentKeysPressed'
import { $oklchRenderMode } from '../../../../stores/oklchRenderMode/oklchRenderMode'

type Props = {
  event: MouseEvent
  rect: DOMRect
}

export default function handleNewManipulatorPosition(props: Props) {
  const { event, rect } = props

  let setColorHxya = true

  // Get the new X and Y value between 0 and 100.
  const canvasY = limitMouseManipulatorPosition(1 - (event.clientY - rect.top) / PICKER_SIZE) * 100
  let canvasX = limitMouseManipulatorPosition((event.clientX - rect.left) / PICKER_SIZE) * 100

  let newXValue: number
  let newYValue: number

  if ($lockContrast.get()) {
    newYValue = $colorHxya.get().y
  } else {
    newYValue = round(canvasY, getColorHxyDecimals().y)
  }

  if ($lockRelativeChroma.get()) {
    newXValue = $colorHxya.get().x
  } else {
    if ($currentColorModel.get() !== 'oklch') {
      newXValue = round(canvasX, getColorHxyDecimals().x)
    } else {
      if ($oklchRenderMode.get() === 'triangle') {
        newXValue = getLinearMappedValue({
          valueToMap: canvasX,
          originalRange: { min: 0, max: 100 },
          targetRange: { min: 0, max: MAX_CHROMA_P3 }
        })

        newXValue = round(newXValue, getColorHxyDecimals().x)
      } else {
        newXValue = convertRelativeChromaToAbsolute({
          h: $colorHxya.get().h,
          y: newYValue,
          relativeChroma: canvasX
        })
      }
    }
  }

  if ($currentKeysPressed.get().includes('shift')) {
    setColorHxya = false

    if (!$lockContrast.get() && round(newYValue) % 5 === 0) {
      newYValue = round(newYValue)

      setColorHxya = true
    }

    let relativeChromaToTest = canvasX

    if ($oklchRenderMode.get() === 'triangle') {
      relativeChromaToTest = convertAbsoluteChromaToRelative({
        colorHxy: {
          h: $colorHxya.get().h,
          x: newXValue,
          y: newYValue
        }
      })
    }

    if (!$lockRelativeChroma.get() && round(relativeChromaToTest) % 5 === 0) {
      canvasX = round(canvasX)

      if ($currentColorModel.get() !== 'oklch') {
        newXValue = round(canvasX, getColorHxyDecimals().x)
      } else {
        if ($oklchRenderMode.get() === 'triangle') {
          newXValue = getLinearMappedValue({
            valueToMap: canvasX,
            originalRange: { min: 0, max: 100 },
            targetRange: { min: 0, max: MAX_CHROMA_P3 }
          })

          newXValue = round(newXValue, getColorHxyDecimals().x)
        } else {
          newXValue = convertRelativeChromaToAbsolute({
            h: $colorHxya.get().h,
            y: newYValue,
            relativeChroma: canvasX
          })
        }
      }

      setColorHxya = true
    }
  }

  if (setColorHxya) {
    setColorHxyaWithSideEffects({
      newColorHxya: {
        x: newXValue,
        y: newYValue
      }
    })
  }
}
