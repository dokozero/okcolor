import { ApcaContrast, ColorHxy, ColorHxya, ColorRgb } from '../../types'
import { $fileColorProfile, $colorsRgba, $currentColorModel, $updateParent } from '../store'
import convertHxyToRgb from './convertHxyToRgb'
import getClampedChroma from './getClampedChroma'
import { roundWithDecimal, clampNumber } from './others'
import getContrastFromBgandFgRgba from './getContrastFromBgandFgRgba'

/**
 * Find the lightness for the given contrast on the current hue and chroma.
 */
export default function convertContrastToLightness(currentColorHxya: ColorHxya, targetContrast: ApcaContrast): ColorHxy {
  let newY: number | undefined
  let newX = currentColorHxya.x
  let newRgb: ColorRgb
  let tempNewContrast = 0
  let count = 0

  let bottomTrigger = true
  let topTrigger = false

  const newYStep = [50, 25, 10, 5, 1, 0.1]
  let currentStepIndex = 0

  // We need this because based on $updateParent, the condition will not be the same
  let newYUpdateCondition: boolean

  // The approach to find the lightness is to start from the top (newY = 100) and go one step bellow (newYStep[0] = 50),
  // then if tempNewContrast === targetContrast we are done, but if that's not the case, we continue. When we go too far, we change the order
  // of scanning from top-bottom to bottom-up while making the step smaller (newY += newYStep[currentStepIndex] where currentStepIndex is incremented),
  // then, if again we go to far on this new direction, we reverse order with a smaller newYStep, until we find the goo lightness.
  do {
    // TODO - remove count
    count++

    newYUpdateCondition = $updateParent.get() ? tempNewContrast > targetContrast : tempNewContrast < targetContrast

    if (newY === undefined) {
      newY = 100
    } else if (newYUpdateCondition) {
      if (topTrigger) {
        topTrigger = false
        bottomTrigger = true
        if (currentStepIndex < 5) currentStepIndex++
      }
      newY -= newYStep[currentStepIndex]
    } else {
      if (bottomTrigger) {
        bottomTrigger = false
        topTrigger = true
        if (currentStepIndex < 5) currentStepIndex++
      }
      newY += newYStep[currentStepIndex]
    }
    newY = roundWithDecimal(newY, 1)
    if (newY < 0 || newY > 100) break

    // We don't check if we are on oklch or okhsl for example because we allow contrast checking only with oklch.
    newX = getClampedChroma({ h: currentColorHxya.h!, x: currentColorHxya.x, y: newY })

    newRgb = convertHxyToRgb({
      colorHxy: {
        h: currentColorHxya.h!,
        x: newX * 100,
        y: newY
      },
      originColorModel: $currentColorModel.get()!,
      fileColorProfile: $fileColorProfile.get()!
    })

    if ($updateParent.get()) {
      tempNewContrast = getContrastFromBgandFgRgba(newRgb, $colorsRgba.get().fill!)
    } else {
      tempNewContrast = getContrastFromBgandFgRgba($colorsRgba.get().parentFill!, { ...newRgb, a: $colorsRgba.get().fill!.a })
    }
  } while (tempNewContrast !== targetContrast && count < 100)

  newY = clampNumber(newY, 0, 100)

  return {
    h: currentColorHxya.h!,
    x: newX,
    y: newY
  }
}
