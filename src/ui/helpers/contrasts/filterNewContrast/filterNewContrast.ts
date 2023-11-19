import { ApcaContrast, WcagContrast } from '../../../../types'
import { $currentContrastMethod } from '../../../stores/contrasts/currentContrastMethod/currentContrastMethod'
import getContrastRange from '../getContrastRange/getContrastRange'

/**
 * Like filterNewColorHxya(), contrast store actions can receive contrasts value that depending on the currentcontrast method are not allowed, thus the need to filter it.
 */
export default function filterNewContrast(
  newContrast: ApcaContrast | WcagContrast,
  currentContrastMethod = $currentContrastMethod.get()
): ApcaContrast | WcagContrast {
  let filteredNewContrast: ApcaContrast | WcagContrast = newContrast

  const contrastRange = getContrastRange()

  if (newContrast > contrastRange.negative.min && newContrast < 0) filteredNewContrast = contrastRange.negative.min
  else if (newContrast > 0 && newContrast < contrastRange.positive.min) filteredNewContrast = contrastRange.positive.min
  else if (currentContrastMethod === 'wcag' && newContrast === 0) filteredNewContrast = contrastRange.positive.min

  return filteredNewContrast
}
