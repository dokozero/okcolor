import clamp from 'lodash/clamp'
import { $colorHxya, setColorHxyaWithSideEffects } from '../../../../stores/colors/colorHxya/colorHxya'
import { $lockRelativeChroma } from '../../../../stores/colors/lockRelativeChroma/lockRelativeChroma'
import { $relativeChroma, setRelativeChromaWithSideEffects } from '../../../../stores/colors/relativeChroma/relativeChroma'
import { $lockContrast } from '../../../../stores/contrasts/lockContrast/lockContrast'
import { $currentKeysPressed } from '../../../../stores/currentKeysPressed/currentKeysPressed'
import { $oklchRenderMode } from '../../../../stores/oklchRenderMode/oklchRenderMode'
import getColorHxyDecimals from '../../../../helpers/colors/getColorHxyDecimals/getColorHxyDecimals'
import round from 'lodash/round'

export default function handleKeyDown(eventKey: 'ArrowUp' | 'ArrowDown' | 'ArrowLeft' | 'ArrowRight') {
  if ($lockRelativeChroma.get() && (eventKey === 'ArrowLeft' || eventKey === 'ArrowRight')) return

  if ($lockContrast.get() && (eventKey === 'ArrowUp' || eventKey === 'ArrowDown')) return

  let newValue = 0
  let stepUpdateValue = 0

  const axis = eventKey === 'ArrowUp' || eventKey === 'ArrowDown' ? 'y' : 'x'

  if (axis === 'x') {
    newValue = $relativeChroma.get()
  } else {
    newValue = $colorHxya.get().y
  }

  if ($currentKeysPressed.get().includes('shift')) {
    newValue = Math.round(newValue / 5) * 5
  }

  stepUpdateValue = $currentKeysPressed.get().includes('shift') ? 5 : 1

  if (eventKey === 'ArrowUp' || eventKey === 'ArrowRight') {
    newValue += stepUpdateValue
  } else if (eventKey === 'ArrowDown' || eventKey === 'ArrowLeft') {
    newValue -= stepUpdateValue
  }

  if (axis === 'y') {
    // Fix floating-point inaccuracies, for example 16.08 - 1 gives 15.079999999999998.
    newValue = round(newValue, getColorHxyDecimals().y)
  }

  // To avoid getting out of the color picker.
  newValue = clamp(newValue, 0, 100)

  if (axis === 'x') {
    setRelativeChromaWithSideEffects({
      newRelativeChroma: newValue
    })
  } else {
    let localLockRelativeChroma = $lockRelativeChroma.get()

    if ($oklchRenderMode.get() === 'square') {
      localLockRelativeChroma = true
    }

    setColorHxyaWithSideEffects({
      newColorHxya: axis === 'y' ? { y: newValue } : { x: newValue },
      lockRelativeChroma: localLockRelativeChroma
    })
  }
}
