import { HxyaLabels } from '../../../../../types'
import { setColorHxyaWithSideEffects } from '../../../../stores/colors/colorHxya/colorHxya'
import { $currentColorModel } from '../../../../stores/colors/currentColorModel/currentColorModel'
import { $lockRelativeChroma } from '../../../../stores/colors/lockRelativeChroma/lockRelativeChroma'
import { $oklchRenderMode } from '../../../../stores/oklchRenderMode/oklchRenderMode'
import { $userSettings } from '../../../../stores/settings/userSettings/userSettings'

export default function formatAndSendNewValueToStore(eventId: keyof typeof HxyaLabels, newValue: number) {
  let newValueFormated = newValue
  if (($currentColorModel.get() === 'oklch' && $userSettings.get().useSimplifiedChroma && eventId === 'x') || eventId === 'a') newValueFormated /= 100

  let localLockRelativeChroma = $lockRelativeChroma.get()

  // We lock the relative chroma locally because when in square OkLCH mode, we want to keep relative chroma fixed when updating the contrast.
  if ($oklchRenderMode.get() === 'square') {
    if (eventId === 'h' || eventId === 'y') {
      localLockRelativeChroma = true
    }
  }

  setColorHxyaWithSideEffects({
    newColorHxya: {
      [eventId]: newValueFormated
    },
    lockRelativeChroma: localLockRelativeChroma
  })
}
