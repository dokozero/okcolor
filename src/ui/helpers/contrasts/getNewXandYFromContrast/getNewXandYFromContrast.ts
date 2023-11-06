import { Hue, AbsoluteChroma, ApcaContrast, WcagContrast, Lightness, ColorRgb } from '../../../../types'
import { $colorsRgba } from '../../../stores/colors/colorsRgba/colorsRgba'
import { $lockRelativeChroma } from '../../../stores/colors/lockRelativeChroma/lockRelativeChroma'
import { $currentBgOrFg } from '../../../stores/contrasts/currentBgOrFg/currentBgOrFg'
import convertHxyToRgb from '../../colors/convertHxyToRgb/convertHxyToRgb'
import convertRelativeChromaToAbsolute from '../../colors/convertRelativeChromaToAbsolute/convertRelativeChromaToAbsolute'
import getClampedChroma from '../../colors/getClampedChroma/getClampedChroma'
import clampNumber from '../../numbers/clampNumber/clampNumber'
import roundWithDecimal from '../../numbers/roundWithDecimal/roundWithDecimal'
import getContrastFromBgandFgRgba from '../getContrastFromBgandFgRgba/getContrastFromBgandFgRgba'

type Props = {
  h: Hue
  x: AbsoluteChroma
  targetContrast: ApcaContrast | WcagContrast
  lockRelativeChroma?: boolean
}

/**
 * Find the lightness and the chroma for the given contrast based the given hue and chroma.
 * If lockRelativeChroma is true, the returned X will take it into account.
 */

// The approach to find the lightness is to start from the top (newY = 100) and go one step bellow (newYStep[0] = 50),
// then if tempNewContrast === targetContrast we are done, but if that's not the case, we continue. When we go too far, we change the order
// of scanning from top-bottom to bottom-up while making the step smaller (newY += newYStep[currentStepIndex] where currentStepIndex is incremented),
// then, if again we go to far on this new direction, we reverse order with a smaller newYStep, until we find the goo lightness.
// Finally, because we often have a range of Y values available for the same chroma, we then look for the miny and maxY values (from the first value found) and return the average of it. We do this because the first loop will find a Y value taht can be close to the min or the max or around the middle but for consistency, we want to always return the average.
export default function getNewXandYFromContrast(props: Props): { x: AbsoluteChroma; y: Lightness } {
  const debugInfos = false

  const { h, x, targetContrast, lockRelativeChroma = $lockRelativeChroma.get() } = props

  let newX = x
  let newRgb: ColorRgb
  let tempNewContrast: ApcaContrast | WcagContrast = 0
  let loopCountLimit = 0 // In caes of to avoid infinite loop

  let totalLoops = 0 // For debugInfos.

  let yBetweenMinYAndMaxY: Lightness | undefined

  let bottomTrigger = true
  let topTrigger = false

  const ySteps = [50, 25, 10, 5, 1, 0.1]
  let currentStepIndex = 0
  // We need this because based on $currentBgOrFg, the condition will not be the same
  let newYUpdateCondition: boolean

  // First loop, find a Y value that yield the targetContrast.
  do {
    loopCountLimit++

    newYUpdateCondition = $currentBgOrFg.get() === 'bg' ? tempNewContrast > targetContrast : tempNewContrast < targetContrast

    if (yBetweenMinYAndMaxY === undefined) {
      yBetweenMinYAndMaxY = 100
    } else if (newYUpdateCondition!) {
      if (topTrigger) {
        topTrigger = false
        bottomTrigger = true
        if (currentStepIndex < 5) currentStepIndex++
      }
      yBetweenMinYAndMaxY -= ySteps[currentStepIndex]
    } else {
      if (bottomTrigger) {
        bottomTrigger = false
        topTrigger = true
        if (currentStepIndex < 5) currentStepIndex++
      }
      yBetweenMinYAndMaxY += ySteps[currentStepIndex]
    }
    yBetweenMinYAndMaxY = roundWithDecimal(yBetweenMinYAndMaxY, 1)
    if (yBetweenMinYAndMaxY < 0 || yBetweenMinYAndMaxY > 100) {
      yBetweenMinYAndMaxY = clampNumber(yBetweenMinYAndMaxY, 0, 100)
      break
    }

    if (lockRelativeChroma) {
      newX = convertRelativeChromaToAbsolute({
        h: h,
        y: yBetweenMinYAndMaxY
      })
    } else {
      // We don't check if we are on oklch or okhsl for example because we allow contrast checking only with oklch.
      newX = getClampedChroma({ h: h, x: x, y: yBetweenMinYAndMaxY })
    }

    newRgb = convertHxyToRgb({
      colorHxy: {
        h: h,
        x: newX,
        y: yBetweenMinYAndMaxY
      }
    })

    if ($currentBgOrFg.get() === 'bg') {
      tempNewContrast = getContrastFromBgandFgRgba($colorsRgba.get().fill!, newRgb)
    } else {
      tempNewContrast = getContrastFromBgandFgRgba({ ...newRgb, a: $colorsRgba.get().fill!.a }, $colorsRgba.get().parentFill!)
    }
  } while (tempNewContrast !== targetContrast && loopCountLimit < 100)

  if (debugInfos) {
    console.log('Debug infos for getNewXandYFromContrast()')
    console.log('—')
    console.log('Iterations for first loop (yBetweenMinYAndMaxY)', loopCountLimit)
  }
  totalLoops = loopCountLimit

  if (yBetweenMinYAndMaxY === 0 || yBetweenMinYAndMaxY === 100) {
    return {
      x: newX,
      y: yBetweenMinYAndMaxY
    }
  }

  let minY: number | null = null
  let maxY: number | null = null

  minY = yBetweenMinYAndMaxY
  maxY = yBetweenMinYAndMaxY + 0.1
  let minYFound = false
  let maxYFound = false
  loopCountLimit = 0

  // Second loop, from the first Y value found (yBetweenMinYAndMaxY), we look for the min and max Y (multiple Y values often give the same contrast).
  while ((!minYFound || !maxYFound) && loopCountLimit < 100) {
    loopCountLimit++

    if (!minYFound) {
      minY = roundWithDecimal((minY -= 0.1), 1)
      if (minY < 0 || minY > 100) {
        minY = clampNumber(minY, 0, 100)
        minYFound = true
      }
    } else {
      maxY = roundWithDecimal((maxY += 0.1), 1)
      if (maxY < 0 || maxY > 100) {
        maxY = clampNumber(maxY, 0, 100)
        maxYFound = true
      }
    }

    if (lockRelativeChroma) {
      newX = convertRelativeChromaToAbsolute({
        h: h,
        y: !minYFound ? minY : maxY
      })
    } else {
      // We don't check if we are on oklch or okhsl for example because we allow contrast checking only with oklch.
      newX = getClampedChroma({ h: h, x: x, y: !minYFound ? minY : maxY })
    }

    newRgb = convertHxyToRgb({
      colorHxy: {
        h: h,
        x: newX,
        y: !minYFound ? minY : maxY
      }
    })

    if ($currentBgOrFg.get() === 'bg') {
      tempNewContrast = getContrastFromBgandFgRgba($colorsRgba.get().fill!, newRgb)
    } else {
      tempNewContrast = getContrastFromBgandFgRgba({ ...newRgb, a: $colorsRgba.get().fill!.a }, $colorsRgba.get().parentFill!)
    }

    if (tempNewContrast !== targetContrast && !minYFound) {
      minY = roundWithDecimal((minY += 0.1), 1)
      minYFound = true
    } else if (tempNewContrast !== targetContrast && !maxYFound) {
      maxY = roundWithDecimal((maxY -= 0.1), 1)
      maxYFound = true
    }
  }

  totalLoops += loopCountLimit
  if (debugInfos) {
    console.log('Iterations for second loop (minY and maxY)', loopCountLimit)
    console.log('TotalLoops', totalLoops)
    console.log('-')
    console.log('maxY', maxY)
    console.log('yBetweenMinYAndMaxY', yBetweenMinYAndMaxY)
    console.log('minY', minY)
    console.log('-')
    console.log('Average Y', roundWithDecimal((minY + maxY) / 2, 1))
  }

  // Get the average of minY and maxY to get newY.
  const newY = roundWithDecimal((minY + maxY) / 2, 1)

  return {
    x: newX,
    y: newY
  }
}
