import round from 'lodash/round'
import convertRelativeChromaToAbsolute from '../../../../helpers/colors/convertRelativeChromaToAbsolute/convertRelativeChromaToAbsolute'
import getColorHxyDecimals from '../../../../helpers/colors/getColorHxyDecimals/getColorHxyDecimals'
import { $colorHxya, setColorHxyaWithSideEffects } from '../../../../stores/colors/colorHxya/colorHxya'
import { $oklchRenderMode } from '../../../../stores/oklchRenderMode/oklchRenderMode'

export default function handleWheel(event: WheelEvent) {
  let currentH = $colorHxya.get().h
  let valueToAdd = event.deltaY / 8

  // If deltaY is not equal to 0 or -0 when shift is pressed, it means that user has a trackpad.
  // That's because with a mouse and whift pressed, system whill trigger horizontal scrolling, thus keeping deltaY to 0 and update deltaX instead, but not with trackpads like Apple's one.
  // In that case, we avoid constraining movement to value of 5 as the trackpad is not precise enough.
  if (event.shiftKey && event.deltaY === 0) {
    // Round the value to the nearest multiple of 5 value. E.g. if hue is 134, we round it to 135.
    // This is usefull to have value multiple of 5 when user press shift no matter the initial hue value.
    currentH = Math.round(currentH / 5) * 5

    if (event.deltaX > 0) {
      valueToAdd = 5
    } else {
      valueToAdd = -5
    }
  }

  let newH = round(currentH + valueToAdd, getColorHxyDecimals().h)

  // To allows for an infinite scroll loop.
  if (newH < 0) {
    newH = 360
  } else if (newH > 360) {
    newH = 0
  }

  if ($oklchRenderMode.get() === 'triangle') {
    setColorHxyaWithSideEffects({
      newColorHxya: {
        h: newH
      }
    })
  } else if ($oklchRenderMode.get() === 'square') {
    const newXValue = convertRelativeChromaToAbsolute({
      h: newH,
      y: $colorHxya.get().y
    })

    setColorHxyaWithSideEffects({
      newColorHxya: {
        x: newXValue,
        h: newH
      },
      sideEffects: {
        syncRelativeChroma: false
      }
    })
  }
}
