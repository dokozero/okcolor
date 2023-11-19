// Rendering of the color picker without hardware acceleration (imageData instead of WebGL).

import { OKLCH_CHROMA_SCALE, MAX_CHROMA_P3 } from '../../../../constants'
import { AbsoluteChroma, ColorRgb, CurrentColorModel, CurrentFileColorProfile, Hue } from '../../../../types'
import { $currentColorModel } from '../../../stores/colors/currentColorModel/currentColorModel'
import { $currentFileColorProfile } from '../../../stores/colors/currentFileColorProfile/currentFileColorProfile'
import convertHxyToRgb from '../convertHxyToRgb/convertHxyToRgb'
import { clampChromaInGamut } from '../culori.mjs'
import getColorPickerResolutionInfos from '../getColorPickerResolutionInfos/getColorPickerResolutionInfos'

const localDebugInfos = {
  all: false,
  totalPixelNbOnly: false
}
const showPreciseRenderedPixels = false

type Props = {
  h: Hue
  currentColorModel?: CurrentColorModel
  currentFileColorProfile?: CurrentFileColorProfile
}

let rgbColor: ColorRgb | null = null
let pixelIndex: number

export const renderImageData = (props: Props): ImageData => {
  const { h, currentColorModel = $currentColorModel.get(), currentFileColorProfile = $currentFileColorProfile.get() } = props

  const pickerSize = getColorPickerResolutionInfos().size

  let imageData: ImageData

  let currentX: number
  let currentY: number

  if (['okhsv', 'okhsl'].includes(currentColorModel)) {
    imageData = new ImageData(pickerSize, pickerSize)

    for (let y = 0; y < pickerSize; y++) {
      for (let x = 0; x < pickerSize; x++) {
        pixelIndex = (y * pickerSize + x) * 4

        currentX = x / pickerSize
        currentY = (pickerSize - y) / pickerSize

        rgbColor = convertHxyToRgb({
          colorHxy: { h: h, x: currentX * 100, y: currentY * 100 }
        })

        imageData.data[pixelIndex] = rgbColor.r * 255
        imageData.data[pixelIndex + 1] = rgbColor.g * 255
        imageData.data[pixelIndex + 2] = rgbColor.b * 255
        imageData.data[pixelIndex + 3] = 255
      }
    }
  } else if (['oklch'].includes(currentColorModel)) {
    // For local debug if needed.
    let numberOfRenderedPixelsForCurrentLine = 0
    let numberOfTotalRenderedPixels = 0

    imageData = new ImageData(pickerSize, pickerSize)

    // To render this number of pixels with same color to get a faster render.
    const sameColorPixelLineLength = 6
    let currentPixelLineIndex = 0
    // Thi is used to keep track when we are near the edge of the OkLCH triangle to render each pixel instead a line of sameColorPixelLineLength's length.
    let usePreciseRender = false

    let maxChromaCurrentLine: AbsoluteChroma
    let imageDataPixelRgb: ColorRgb = { r: 0, g: 0, b: 0 }

    for (let y = 0; y < pickerSize; y++) {
      if (localDebugInfos.all) {
        console.log('-')
        console.log('Luminosity = ' + (pickerSize - y) / pickerSize)
        numberOfRenderedPixelsForCurrentLine = 0
      }

      currentY = (pickerSize - y) / pickerSize

      maxChromaCurrentLine = clampChromaInGamut({ mode: 'oklch', l: currentY, c: MAX_CHROMA_P3, h: h }, 'oklch', currentFileColorProfile).c

      usePreciseRender = false
      rgbColor = null

      currentPixelLineIndex = 0

      for (let x = 0; x < pickerSize; x++) {
        pixelIndex = (y * pickerSize + x) * 4

        currentX = x / (pickerSize * OKLCH_CHROMA_SCALE)

        if (maxChromaCurrentLine - currentX < 0.01) usePreciseRender = true
        else usePreciseRender = false

        if (currentX < maxChromaCurrentLine) {
          if (usePreciseRender && showPreciseRenderedPixels) {
            imageDataPixelRgb = { r: 1, g: 0, b: 0 }
          } else if (rgbColor === null || usePreciseRender || currentPixelLineIndex === sameColorPixelLineLength) {
            rgbColor = convertHxyToRgb({
              colorHxy: { h: h, x: currentX, y: currentY * 100 },
              colorSpace: 'rgb'
            })
            imageDataPixelRgb = rgbColor!
            if (localDebugInfos.all) {
              numberOfRenderedPixelsForCurrentLine++
              numberOfTotalRenderedPixels++
            } else if (localDebugInfos.totalPixelNbOnly) {
              numberOfTotalRenderedPixels++
            }
            currentPixelLineIndex = -1
          }
          currentPixelLineIndex++
        }

        imageData.data[pixelIndex] = imageDataPixelRgb.r * 255
        imageData.data[pixelIndex + 1] = imageDataPixelRgb.g * 255
        imageData.data[pixelIndex + 2] = imageDataPixelRgb.b * 255
        imageData.data[pixelIndex + 3] = currentX > maxChromaCurrentLine ? 0 : 255
      }

      if (localDebugInfos.all) {
        console.log('Number of rendered pixels for current line = ' + numberOfRenderedPixelsForCurrentLine)
      }
    }

    if (localDebugInfos.all || localDebugInfos.totalPixelNbOnly) {
      if (localDebugInfos.all) {
        console.log('---')
        console.log('Done')
      }
      console.log('Number of total rendered pixels = ' + numberOfTotalRenderedPixels)
    }
  }

  return imageData!
}
