// We keep this file for archive purpose just in case but now the rendering of color picker is done with WebGL shaders.

import { RES_PICKER_SIZE_OKHSLV, RES_PICKER_SIZE_OKLCH, OKLCH_CHROMA_SCALE, MAX_CHROMA_P3 } from '../../constants'

import { converter, clampChromaInGamut } from './colors/culori.mjs'
import type { Rgb, Oklch } from './colors/culori.mjs'

const localDebugMode = false

const convertToRgb = converter('rgb')

export const renderImageData = function (hue: number, colorModel: string, fileColorProfile: string): ImageData {
  let imageData: ImageData
  let okhxyX: number
  let okhxyY: number
  let pixelIndex: number

  if (colorModel === 'okhsl' || colorModel === 'okhsv') {
    imageData = new ImageData(RES_PICKER_SIZE_OKHSLV, RES_PICKER_SIZE_OKHSLV)

    for (let y = 0; y < RES_PICKER_SIZE_OKHSLV; y++) {
      for (let x = 0; x < RES_PICKER_SIZE_OKHSLV; x++) {
        okhxyX = x / RES_PICKER_SIZE_OKHSLV
        okhxyY = (RES_PICKER_SIZE_OKHSLV - y) / RES_PICKER_SIZE_OKHSLV

        let rgbColor: Rgb

        if (colorModel === 'okhsl') {
          rgbColor = convertToRgb({ mode: 'okhsl', h: hue, s: okhxyX, l: okhxyY })
        } else if (colorModel === 'okhsv') {
          rgbColor = convertToRgb({ mode: 'okhsv', h: hue, s: okhxyX, v: okhxyY })
        }

        pixelIndex = (y * RES_PICKER_SIZE_OKHSLV + x) * 4
        imageData.data[pixelIndex] = rgbColor.r * 255
        imageData.data[pixelIndex + 1] = rgbColor.g * 255
        imageData.data[pixelIndex + 2] = rgbColor.b * 255
        imageData.data[pixelIndex + 3] = 255
      }
    }
  } else if (colorModel === 'oklch' || colorModel === 'oklchCss') {
    let currentTheme: string

    if (document.documentElement.classList.contains('figma-dark')) {
      currentTheme = 'dark'
    } else {
      currentTheme = 'light'
    }

    // For local debug if needed.
    let numberOfRenderedPixelsForCurrentLine = 0
    let numberOfTotalRenderedPixels = 0

    imageData = new ImageData(RES_PICKER_SIZE_OKLCH, RES_PICKER_SIZE_OKLCH)

    let rgbColor: Rgb
    let pixelIndex: number

    let bgColorLuminosity = 0

    let currentChroma: number
    let currentLuminosity: number

    let whitePixelRendered = false

    let sRGBMaxChroma: Oklch
    let P3MaxChroma: Oklch

    if (currentTheme === 'dark') {
      bgColorLuminosity = 35
    } else {
      bgColorLuminosity = 70
    }

    const bgColor = convertToRgb({ mode: 'oklch', h: hue, c: 1, l: bgColorLuminosity })

    for (let y = 0; y < RES_PICKER_SIZE_OKLCH; y++) {
      if (localDebugMode) {
        console.log('-')
        console.log('Luminosity = ' + (RES_PICKER_SIZE_OKLCH - y) / RES_PICKER_SIZE_OKLCH)
        numberOfRenderedPixelsForCurrentLine = 0
      }

      currentLuminosity = (RES_PICKER_SIZE_OKLCH - y) / RES_PICKER_SIZE_OKLCH

      sRGBMaxChroma = clampChromaInGamut({ mode: 'oklch', l: currentLuminosity, c: MAX_CHROMA_P3, h: hue }, 'oklch', 'rgb')
      P3MaxChroma = clampChromaInGamut({ mode: 'oklch', l: currentLuminosity, c: MAX_CHROMA_P3, h: hue }, 'oklch', 'p3')

      for (let x = 0; x < RES_PICKER_SIZE_OKLCH; x++) {
        currentChroma = x / (RES_PICKER_SIZE_OKLCH * OKLCH_CHROMA_SCALE)

        pixelIndex = (y * RES_PICKER_SIZE_OKLCH + x) * 4

        if (currentChroma > sRGBMaxChroma.c && !whitePixelRendered && fileColorProfile === 'p3') {
          imageData.data[pixelIndex] = 255
          imageData.data[pixelIndex + 1] = 255
          imageData.data[pixelIndex + 2] = 255
          imageData.data[pixelIndex + 3] = 255
          whitePixelRendered = true
        } else if ((fileColorProfile === 'p3' && currentChroma > P3MaxChroma.c) || (fileColorProfile === 'rgb' && currentChroma > sRGBMaxChroma.c)) {
          imageData.data[pixelIndex] = bgColor.r
          imageData.data[pixelIndex + 1] = bgColor.g
          imageData.data[pixelIndex + 2] = bgColor.b
          imageData.data[pixelIndex + 3] = 255
        } else {
          if (localDebugMode) {
            numberOfRenderedPixelsForCurrentLine++
            numberOfTotalRenderedPixels++
          }

          rgbColor = convertToRgb({ mode: 'oklch', h: hue, c: currentChroma, l: currentLuminosity })
          imageData.data[pixelIndex] = rgbColor.r * 255
          imageData.data[pixelIndex + 1] = rgbColor.g * 255
          imageData.data[pixelIndex + 2] = rgbColor.b * 255
          imageData.data[pixelIndex + 3] = 255
        }
      }

      if (localDebugMode) {
        console.log('Number of rendered pixels for current line = ' + numberOfRenderedPixelsForCurrentLine)
      }

      whitePixelRendered = false
    }

    if (localDebugMode) {
      console.log('---')
      console.log('Done')
      console.log('Number of total rendered pixels = ' + numberOfTotalRenderedPixels)
    }
  }

  return imageData!
}
