import { PICKER_SIZE } from '../../../../constants'
import { CurrentColorModel } from '../../../../types'
import { $currentColorModel } from '../../../stores/colors/currentColorModel/currentColorModel'
import { $userSettings } from '../../../stores/settings/userSettings/userSettings'

type ReturnObject = {
  factor: number
  size: number
}

export default function getColorPickerResolutionInfos(
  currentColorModel: CurrentColorModel | 'oklchTransition' = $currentColorModel.get()
): ReturnObject {
  const returnObject: ReturnObject = {
    factor: 0,
    size: 0
  }

  switch (currentColorModel) {
    case 'oklchTransition':
      returnObject.factor = 0.8
      break

    case 'oklch':
      returnObject.factor = $userSettings.get().useHardwareAcceleration ? 0.25 : 0.8
      break

    case 'okhsl':
    case 'okhsv':
      returnObject.factor = $userSettings.get().useHardwareAcceleration ? 0.5 : 2.5
      break
  }

  returnObject.size = PICKER_SIZE / returnObject.factor

  return returnObject
}
