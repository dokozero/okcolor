import { $colorHxya, setColorHxyaWithSideEffects } from '../../../../stores/colors/colorHxya/colorHxya'
import { $lockRelativeChroma } from '../../../../stores/colors/lockRelativeChroma/lockRelativeChroma'
import { $relativeChroma, setRelativeChromaWithSideEffects } from '../../../../stores/colors/relativeChroma/relativeChroma'
import { $lockContrast } from '../../../../stores/contrasts/lockContrast/lockContrast'
import { $currentKeysPressed } from '../../../../stores/currentKeysPressed/currentKeysPressed'
import { $oklchRenderMode } from '../../../../stores/oklchRenderMode/oklchRenderMode'
import getStepUpdateValue from '../../../ColorValueInputs/helpers/getStepUpdateValue/getStepUpdateValue'

export default function handleKeyDown(eventKey: 'ArrowUp' | 'ArrowDown' | 'ArrowLeft' | 'ArrowRight') {
  if ($lockRelativeChroma.get() && (eventKey === 'ArrowLeft' || eventKey === 'ArrowRight')) return

  if ($lockContrast.get() && (eventKey === 'ArrowUp' || eventKey === 'ArrowDown')) return

  let newValue = 0
  let stepUpdateValue = 0

  const axis = eventKey === 'ArrowUp' || eventKey === 'ArrowDown' ? 'y' : 'x'

  if (axis === 'y') {
    newValue = $colorHxya.get().y

    if ($currentKeysPressed.get().includes('shift')) {
      newValue = Math.round(newValue / 5) * 5
    }

    stepUpdateValue = $currentKeysPressed.get().includes('shift') ? 5 : 1
  } else if (axis === 'x') {
    if ($oklchRenderMode.get() === 'triangle') {
      newValue = $colorHxya.get().x
      stepUpdateValue = getStepUpdateValue('x')
    } else {
      newValue = $relativeChroma.get()

      if ($currentKeysPressed.get().includes('shift')) {
        newValue = Math.round(newValue / 5) * 5
      }

      stepUpdateValue = $currentKeysPressed.get().includes('shift') ? 5 : 1
    }
  }

  if (eventKey === 'ArrowUp' || eventKey === 'ArrowRight') {
    newValue += stepUpdateValue
  } else if (eventKey === 'ArrowDown' || eventKey === 'ArrowLeft') {
    newValue -= stepUpdateValue
  }

  // To avoid getting out of the color picker.
  if (axis === 'y' && (newValue < 0 || newValue > 100)) {
    return
  }
  if (axis === 'x' && $oklchRenderMode.get() === 'square' && (newValue < 0 || newValue > 100)) {
    return
  }

  // Without this, the min value will be something like 0.004.
  if (axis === 'x' && $oklchRenderMode.get() === 'triangle' && newValue < 0) {
    newValue = 0
  }

  if ($oklchRenderMode.get() === 'square' && axis === 'x') {
    setRelativeChromaWithSideEffects({
      newRelativeChroma: newValue
    })
  } else {
    let localLockRelativeChroma = $lockRelativeChroma.get()

    if (axis === 'y' && $oklchRenderMode.get() === 'square') {
      localLockRelativeChroma = true
    }

    setColorHxyaWithSideEffects({
      newColorHxya: axis === 'y' ? { y: newValue } : { x: newValue },
      lockRelativeChroma: localLockRelativeChroma
    })
  }
}
