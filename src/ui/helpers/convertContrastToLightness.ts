import { ApcaContrast, ColorHxy, ColorHxya, ColorRgb } from '../../types'
import { $fileColorProfile, $colorsRgba, $currentColorModel, $updateParent } from '../store'
import convertHxyToRgb from './convertHxyToRgb'
import getClampedChroma from './getClampedChroma'
import { roundWithDecimal, clampNumber } from './others'
import getContrastFromBgandFgRgba from './getContrastFromBgandFgRgba'

// convertLightnessToContrast(hxy)

export default function convertContrastToLightness(currentColorHxya: ColorHxya, targetContrast: ApcaContrast): ColorHxy {
  let newY = 100
  let newX = currentColorHxya.x
  let newRgb: ColorRgb
  let tempNewContrast = 0
  let count = 0

  let bottomTrigger = true
  let topTrigger = false

  const newYStep = [50, 25, 10, 5, 1, 0.1]
  let currentStepIndex = 0

  do {
    count++

    // We don't check if we are on oklch or okhsl for example because we allow contrast checking only with oklch.
    newX = getClampedChroma({ h: currentColorHxya.h!, x: currentColorHxya.x, y: newY })

    newRgb = convertHxyToRgb({
      colorHxy: {
        h: currentColorHxya.h!,
        x: $currentColorModel.get() === 'oklchCss' ? newX * 100 : newX,
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

    if (tempNewContrast === targetContrast) break

    const condition = $updateParent.get() ? tempNewContrast > targetContrast : tempNewContrast < targetContrast

    if (condition) {
      if (topTrigger) {
        bottomTrigger = true
        topTrigger = false
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
  } while (tempNewContrast !== targetContrast && count < 100)

  newY = clampNumber(newY, 0, 100)

  return {
    h: currentColorHxya.h!,
    x: newX,
    y: newY
  }
}

// function getNewHxyFromNewContrast(currentColorHxya: ColorHxya, currentContrast: number, newContrast: number): ColorHxy {
//   let foreground: [number, number, number, number] = [0, 0, 0, 0]
//   let background: [number, number, number] = [0, 0, 0]
//   let newY = currentColorHxya.y
//   let newX = currentColorHxya.x
//   let newRgb: ColorRgb
//   let tempNewContrast: number | null = null
//   let APCAContrastResult: number | string
//   const direction = newContrast > Math.abs(currentContrast) ? 'up' : 'down'

//   if ($updateParent.get()) {
//     if ($fileColorProfile.get() === 'rgb') {
//       foreground = [$colorsRgba.get().fill!.r, $colorsRgba.get().fill!.g, $colorsRgba.get().fill!.b, $colorsRgba.get().fill!.a / 100]
//     } else {
//       foreground = [
//         $colorsRgba.get().fill!.r / 255,
//         $colorsRgba.get().fill!.g / 255,
//         $colorsRgba.get().fill!.b / 255,
//         $colorsRgba.get().fill!.a / 100
//       ]
//     }
//   } else {
//     if ($fileColorProfile.get() === 'rgb') {
//       background = [$colorsRgba.get().parentFill!.r, $colorsRgba.get().parentFill!.g, $colorsRgba.get().parentFill!.b]
//     } else {
//       background = [$colorsRgba.get().parentFill!.r / 255, $colorsRgba.get().parentFill!.g / 255, $colorsRgba.get().parentFill!.b / 255]
//     }
//   }

//   let count = 0

//   let newYBigStep: number
//   let newYSmallStep: number

//   if (currentContrast <= 0) {
//     newYBigStep = $updateParent.get() ? -1 : 1
//     newYSmallStep = $updateParent.get() ? -0.1 : 0.1
//   } else {
//     newYBigStep = $updateParent.get() ? 1 : -1
//     newYSmallStep = $updateParent.get() ? 0.1 : -0.1
//   }

//   do {
//     count++

//     if (['oklch', 'oklchCss'].includes($currentColorModel.get()!)) {
//       newX = getClampedChroma({ h: currentColorHxya.h!, x: currentColorHxya.x, y: newY })
//     }

//     newRgb = convertHxyToRgb({
//       colorHxy: {
//         h: currentColorHxya.h!,
//         x: $currentColorModel.get() === 'oklchCss' ? newX * 100 : newX,
//         y: newY
//       },
//       originColorModel: $currentColorModel.get()!,
//       fileColorProfile: $fileColorProfile.get()!
//     })

//     if ($fileColorProfile.get() === 'rgb') {
//       if ($updateParent.get()) {
//         background = [newRgb.r, newRgb.g, newRgb.b]
//       } else {
//         foreground = [newRgb.r, newRgb.g, newRgb.b, $colorsRgba.get().fill!.a / 100]
//       }

//       APCAContrastResult = APCAcontrast(sRGBtoY(alphaBlend(foreground, background)), sRGBtoY(background))
//     } else {
//       if ($updateParent.get()) {
//         background = [newRgb.r / 255, newRgb.g / 255, newRgb.b / 255]
//       } else {
//         foreground = [newRgb.r / 255, newRgb.g / 255, newRgb.b / 255, $colorsRgba.get().fill!.a / 100]
//       }

//       APCAContrastResult = APCAcontrast(displayP3toY(alphaBlend(foreground, background, false)), displayP3toY(background))
//     }

//     if (typeof APCAContrastResult === 'string') tempNewContrast = parseInt(APCAContrastResult)
//     else tempNewContrast = APCAContrastResult

//     tempNewContrast = Math.abs(tempNewContrast)
//     tempNewContrast = Math.round(tempNewContrast)

//     if (direction === 'up') {
//       if (tempNewContrast < newContrast) newY += newYBigStep
//       else newY -= newYSmallStep
//     } else {
//       if (tempNewContrast > newContrast) newY -= newYBigStep
//       else newY += newYSmallStep
//     }
//     newY = roundWithDecimal(newY, 1)
//   } while (tempNewContrast !== newContrast && tempNewContrast !== 0 && count < 100)

//   // console.log(count)

//   newY = clampNumber(newY, 0, 100)

//   return { h: currentColorHxya.h!, x: newX, y: newY }
// }
