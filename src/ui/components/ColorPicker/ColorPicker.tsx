import { useEffect, useRef, useState } from 'react'
import { useStore } from '@nanostores/react'
import { consoleLogInfos, PICKER_SIZE, OKLCH_CHROMA_SCALE, MAX_CHROMA_P3 } from '../../../constants'
import utilsGlsl from '@virtual:shaders/src/ui/shaders/utils.glsl'
import libraryGlsl from '@virtual:shaders/src/ui/shaders/library.glsl'
import fShader from '@virtual:shaders/src/ui/shaders/f_shader.glsl'
import vShader from '@virtual:shaders/src/ui/shaders/v_shader.glsl'
import * as twgl from 'twgl.js'
import { inGamut } from '../../helpers/colors/culori.mjs'
import { AbsoluteChroma, Saturation, ColorModelList, OklchRenderModeList } from '../../../types'
import limitMouseManipulatorPosition from '../../helpers/limitMouseManipulatorPosition/limitMouseManipulatorPosition'
import { $colorHxya, setColorHxyaWithSideEffects } from '../../stores/colors/colorHxya/colorHxya'
import { $colorsRgba } from '../../stores/colors/colorsRgba/colorsRgba'
import { $currentColorModel } from '../../stores/colors/currentColorModel/currentColorModel'
import { $currentFileColorProfile } from '../../stores/colors/currentFileColorProfile/currentFileColorProfile'
import { $lockRelativeChroma } from '../../stores/colors/lockRelativeChroma/lockRelativeChroma'
import { $relativeChroma } from '../../stores/colors/relativeChroma/relativeChroma'
import { $contrast } from '../../stores/contrasts/contrast/contrast'
import { $currentBgOrFg } from '../../stores/contrasts/currentBgOrFg/currentBgOrFg'
import { $lockContrast } from '../../stores/contrasts/lockContrast/lockContrast'
import { $currentKeysPressed } from '../../stores/currentKeysPressed/currentKeysPressed'
import { setMouseEventCallback } from '../../stores/mouseEventCallback/mouseEventCallback'
import { $uiMessage } from '../../stores/uiMessage/uiMessage'
import getContrastStrokeLimit from './helpers/getContrastStrokeLimit/getContrastStrokeLimit'
import getRelativeChromaStrokeLimit from './helpers/getRelativeChromaStrokeLimit/getRelativeChromaStrokeLimit'
import getSrgbStrokeLimit from './helpers/getSrgbStrokeLimit/getSrgbStrokeLimit'
import getColorHxyDecimals from '../../helpers/colors/getColorHxyDecimals/getColorHxyDecimals'
import round from 'lodash/round'
import clamp from 'lodash/clamp'
import convertHxyToRgb from '../../helpers/colors/convertHxyToRgb/convertHxyToRgb'
import { renderImageData } from '../../helpers/colors/renderImageData/renderImageData'
import { $userSettings } from '../../stores/settings/userSettings/userSettings'
import getColorPickerResolutionInfos from '../../helpers/colors/getColorPickerResolutionInfos/getColorPickerResolutionInfos'
import { $selectionId } from '../../stores/selectionId/selectionId'
import { $isTransitionRunning, $oklchRenderMode, setIsTransitionRunning } from '../../stores/oklchRenderMode/oklchRenderMode'
import convertRelativeChromaToAbsolute from '../../helpers/colors/convertRelativeChromaToAbsolute/convertRelativeChromaToAbsolute'
import getLinearMappedValue from '../../helpers/getLinearMappedValue/getLinearMappedValue'
import handleKeyDown from './helpers/handleKeyDown/handleKeyDown'
import handleWheel from './helpers/handleWheel/handleWheel'

// We use these var to measure speeds of color picker rendering (see in constants file to activate it).
let colorPickerStrokesRenderingStart: number
let colorPickerStrokesRenderingEnd: number
let colorPickerCanvasRenderingStart: number
let colorPickerCanvasRenderingEnd: number

const inGamutSrgb = inGamut('rgb')

let canvas2dContext: CanvasRenderingContext2D | null = null
let canvas2dContextTransition: CanvasRenderingContext2D | null = null
let canvasWebglContext: WebGL2RenderingContext | null = null
let bufferInfo: twgl.BufferInfo
let programInfo: twgl.ProgramInfo

enum ColorSpacesNames {
  'sRGB',
  'P3'
}

let previousXManipulatorPosition = 0

export default function ColorPicker() {
  if (consoleLogInfos.includes('Component renders')) {
    console.log('Component render — ColorPicker')
  }

  const isMounted = useRef(false)

  const [colorSpaceOfCurrentColor, setColorSpaceOfCurrentColor] = useState<keyof typeof ColorSpacesNames | ''>('')

  const selectionId = useStore($selectionId)
  const uiMessage = useStore($uiMessage)
  const colorHxya = useStore($colorHxya)
  const currentColorModel = useStore($currentColorModel)
  const currentFileColorProfile = useStore($currentFileColorProfile)
  const lockRelativeChroma = useStore($lockRelativeChroma)
  const lockContrast = useStore($lockContrast)
  const relativeChroma = useStore($relativeChroma)
  const contrast = useStore($contrast)
  const currentBgOrFg = useStore($currentBgOrFg)
  const oklchRenderMode = useStore($oklchRenderMode)

  const colorPicker = useRef<HTMLDivElement>(null)
  const colorSpaceLabel = useRef<HTMLDivElement>(null)
  const colorPickerCanvas = useRef<HTMLCanvasElement>(null)
  const colorPickerTransitionCanvas = useRef<HTMLCanvasElement>(null)
  const manipulatorColorPicker = useRef<SVGGElement>(null)
  const srgbLimitStroke = useRef<SVGPathElement>(null)
  const relativeChromaStroke = useRef<SVGPathElement>(null)
  const contrastStroke = useRef<SVGPathElement>(null)

  const updateManipulatorPosition = ({ position = $oklchRenderMode.get() === 'triangle' ? 0 : 100 }: { position?: number } = {}) => {
    let x: AbsoluteChroma | Saturation

    if ($currentColorModel.get() === 'oklch') {
      let startPosition = 0
      let endPosition = 0

      if ($oklchRenderMode.get() === 'triangle') {
        startPosition = $colorHxya.get().x * OKLCH_CHROMA_SCALE
        endPosition = $relativeChroma.get() / 100
        x = getLinearMappedValue({
          valueToMap: position,
          originalRange: { min: 0, max: 100 },
          targetRange: { min: startPosition, max: endPosition }
        })
      } else if ($oklchRenderMode.get() === 'square') {
        if ($colorHxya.get().y < 1 || $colorHxya.get().y > 99) {
          x = previousXManipulatorPosition
        } else {
          startPosition = $relativeChroma.get() / 100
          endPosition = $colorHxya.get().x * OKLCH_CHROMA_SCALE

          x = getLinearMappedValue({
            valueToMap: position,
            originalRange: { min: 100, max: 0 },
            targetRange: { min: startPosition, max: endPosition }
          })

          previousXManipulatorPosition = x
        }
      }
    } else {
      x = $colorHxya.get().x / 100
    }

    const y = $colorHxya.get().y / 100

    manipulatorColorPicker.current!.transform.baseVal.getItem(0).setTranslate(PICKER_SIZE * x!, PICKER_SIZE * (1 - y))
  }

  const handleNewManipulatorPosition = (event: MouseEvent) => {
    if ($isTransitionRunning.get()) return

    const rect = colorPickerCanvas.current!.getBoundingClientRect()

    let setColorHxya = true

    // Get the new X and Y value between 0 and 100.
    const canvasY = limitMouseManipulatorPosition(1 - (event.clientY - rect.top) / PICKER_SIZE) * 100
    let canvasX = limitMouseManipulatorPosition((event.clientX - rect.left) / PICKER_SIZE) * 100

    let newXValue: number
    let newYValue: number

    if ($lockContrast.get()) {
      newYValue = $colorHxya.get().y
    } else {
      newYValue = round(canvasY, getColorHxyDecimals().y)
    }

    if ($lockRelativeChroma.get()) {
      newXValue = $colorHxya.get().x
    } else {
      if ($currentColorModel.get() !== 'oklch') {
        newXValue = round(canvasX, getColorHxyDecimals().x)
      } else {
        if ($oklchRenderMode.get() === 'triangle') {
          newXValue = getLinearMappedValue({
            valueToMap: canvasX,
            originalRange: { min: 0, max: 100 },
            targetRange: { min: 0, max: MAX_CHROMA_P3 }
          })

          newXValue = round(newXValue, getColorHxyDecimals().x)
        } else {
          newXValue = convertRelativeChromaToAbsolute({
            h: $colorHxya.get().h,
            y: newYValue,
            relativeChroma: canvasX
          })
        }
      }
    }

    if ($currentKeysPressed.get().includes('shift')) {
      setColorHxya = false

      if (!$lockContrast.get() && round(newYValue) % 5 === 0) {
        newYValue = round(newYValue)

        setColorHxya = true
      }

      if (!$lockRelativeChroma.get() && round(canvasX) % 5 === 0) {
        canvasX = round(canvasX)

        if ($currentColorModel.get() !== 'oklch') {
          newXValue = round(canvasX, getColorHxyDecimals().x)
        } else {
          if ($oklchRenderMode.get() === 'triangle') {
            newXValue = getLinearMappedValue({
              valueToMap: canvasX,
              originalRange: { min: 0, max: 100 },
              targetRange: { min: 0, max: MAX_CHROMA_P3 }
            })

            newXValue = round(newXValue, getColorHxyDecimals().x)
          } else {
            newXValue = convertRelativeChromaToAbsolute({
              h: $colorHxya.get().h,
              y: newYValue,
              relativeChroma: canvasX
            })
          }
        }

        setColorHxya = true
      }
    }

    if (setColorHxya) {
      setColorHxyaWithSideEffects({
        newColorHxya: {
          x: newXValue,
          y: newYValue
        }
      })
    }

    updateManipulatorPosition()
  }

  const setColorOfColorSpaceLabel = ({ position = $oklchRenderMode.get() === 'triangle' ? 0 : 100 }: { position?: number } = {}) => {
    if ($currentFileColorProfile.get() === 'rgb') return

    // We do this to prevent transition while we still see the picker background.
    if ($oklchRenderMode.get() === 'square' && position < 80) {
      return
    }

    const minLightness = document.documentElement.classList.contains('figma-dark') ? 75 : 57

    const chroma = getLinearMappedValue({
      valueToMap: position,
      originalRange: { min: 0, max: 100 },
      targetRange: { min: 0.01, max: 0.114 }
    })

    const lightness = getLinearMappedValue({
      valueToMap: position,
      originalRange: { min: 0, max: 100 },
      targetRange: { min: minLightness, max: 60 }
    })

    colorSpaceLabel.current!.style.color = `oklch(${lightness}% ${chroma} ${$colorHxya.get().h})`
  }

  const renderSrgbLimitStroke = ({ position = $oklchRenderMode.get() === 'triangle' ? 0 : 100 }: { position?: number } = {}) => {
    if ($currentColorModel.get() === 'oklch' && $currentFileColorProfile.get() === 'p3') {
      srgbLimitStroke.current!.setAttribute('d', getSrgbStrokeLimit({ position: position }))
    } else {
      srgbLimitStroke.current!.setAttribute('d', '')
    }
  }

  const renderRelativeChromaStroke = ({ position = $oklchRenderMode.get() === 'triangle' ? 0 : 100 }: { position?: number } = {}) => {
    if ($currentColorModel.get() === 'oklch' && $lockRelativeChroma.get()) {
      relativeChromaStroke.current!.setAttribute('d', getRelativeChromaStrokeLimit({ position: position }))
    } else {
      relativeChromaStroke.current!.setAttribute('d', '')
    }
  }

  const renderContrastStroke = ({ position = $oklchRenderMode.get() === 'triangle' ? 0 : 100 }: { position?: number } = {}) => {
    if ($currentColorModel.get() === 'oklch' && $lockContrast.get() && $colorsRgba.get().parentFill && $colorsRgba.get().fill) {
      contrastStroke.current!.setAttribute('d', getContrastStrokeLimit({ position: position }))
    } else {
      contrastStroke.current!.setAttribute('d', '')
    }
  }

  const animateOklchRenderModeTransition = ({
    useHardwareAcceleration = $userSettings.get().useHardwareAcceleration
  }: { useHardwareAcceleration?: boolean } = {}) => {
    const canvasToAnimate = useHardwareAcceleration ? canvas2dContextTransition : canvas2dContext

    let position = $oklchRenderMode.get() === 'square' ? 0 : 100
    canvasToAnimate!.putImageData(renderImageData({ h: $colorHxya.get().h, position }), 0, 0)

    if (useHardwareAcceleration) {
      colorPickerCanvas.current!.classList.add('u-visibility-hidden')
      colorPickerTransitionCanvas.current!.classList.remove('u-visibility-hidden')
    }

    const frameInterval = 30 // Interval in ms
    let lastFrameTime = performance.now()
    let animationComplete = false

    const animateCanvas = () => {
      const now = performance.now()
      if (now - lastFrameTime >= frameInterval) {
        lastFrameTime = now

        updateManipulatorPosition({ position: position })
        renderSrgbLimitStroke({ position: position })
        renderRelativeChromaStroke({ position: position })
        renderContrastStroke({ position: position })
        setColorOfColorSpaceLabel({ position: position })

        canvasToAnimate!.putImageData(renderImageData({ h: $colorHxya.get().h, position: clamp(position, 0, 100) }), 0, 0)

        if ($oklchRenderMode.get() === 'square') {
          if (position > 100) {
            animationComplete = true
          }
          position += 8
        } else {
          if (position < 0) {
            animationComplete = true
          }
          position -= 8
        }
      }

      if (animationComplete) {
        if (useHardwareAcceleration) {
          colorPickerCanvas.current!.classList.remove('u-visibility-hidden')
          colorPickerTransitionCanvas.current!.classList.add('u-visibility-hidden')

          // Continue with WebGL rendering
          const size = getColorPickerResolutionInfos().size
          canvasWebglContext!.clearColor(0, 0, 0, 1)
          canvasWebglContext!.clear(canvasWebglContext!.COLOR_BUFFER_BIT)

          // Rest of your WebGL setup.
          const uniforms = {
            resolution: [size, size],
            chromaScale: OKLCH_CHROMA_SCALE,
            isSpaceP3: $currentFileColorProfile.get() === 'p3',
            colorModel: ColorModelList[$currentColorModel.get()],
            oklchRenderMode: OklchRenderModeList[$oklchRenderMode.get()],
            hueRad: ($colorHxya.get().h * Math.PI) / 180
          }
          twgl.setUniforms(programInfo, uniforms)
          twgl.drawBufferInfo(canvasWebglContext!, bufferInfo)
        }

        updateManipulatorPosition()
        renderSrgbLimitStroke()
        renderRelativeChromaStroke()
        renderContrastStroke()
        setColorOfColorSpaceLabel()

        setIsTransitionRunning(false)
      } else {
        requestAnimationFrame(animateCanvas)
      }
    }

    // Start the animation
    animateCanvas()
  }

  const renderColorPickerCanvas = ({ animation = false }: { animation?: boolean } = {}) => {
    if (consoleLogInfos.includes('Color picker rendering speed')) {
      colorPickerStrokesRenderingStart = performance.now()
    }

    if (consoleLogInfos.includes('Color picker rendering speed')) {
      colorPickerStrokesRenderingEnd = performance.now()
      console.log('---')
      console.log(`(Hardware acceleration ${$userSettings.get().useHardwareAcceleration ? 'on' : 'off'})`)
      console.log('Color picker render durations:')
      console.log(` Strokes: ${round(colorPickerStrokesRenderingEnd - colorPickerStrokesRenderingStart, 4)} ms.`)

      colorPickerCanvasRenderingStart = performance.now()
    }

    if ($currentColorModel.get() === 'oklch' && $oklchRenderMode.get() === 'triangle') {
      const bgColor = convertHxyToRgb({
        colorHxy: { h: $colorHxya.get().h, x: 0.006, y: document.documentElement.classList.contains('figma-dark') ? 36 : 95 }
      })

      colorPicker.current!.style.backgroundColor = `rgb(${bgColor.r * 255}, ${bgColor.g * 255}, ${bgColor.b * 255})`
    }

    if (animation) {
      animateOklchRenderModeTransition()
      return
    }

    if (!$userSettings.get().useHardwareAcceleration) {
      const position = $oklchRenderMode.get() === 'triangle' ? 0 : 100
      canvas2dContext!.putImageData(renderImageData({ h: $colorHxya.get().h, position }), 0, 0)
    } else {
      const size = getColorPickerResolutionInfos().size

      canvasWebglContext!.clearColor(0, 0, 0, 1)
      canvasWebglContext!.clear(canvasWebglContext!.COLOR_BUFFER_BIT)

      const uniforms = {
        resolution: [size, size],
        chromaScale: OKLCH_CHROMA_SCALE,
        isSpaceP3: $currentFileColorProfile.get() === 'p3',
        colorModel: ColorModelList[$currentColorModel.get()],
        oklchRenderMode: OklchRenderModeList[$oklchRenderMode.get()],
        hueRad: ($colorHxya.get().h * Math.PI) / 180
      }

      twgl.setUniforms(programInfo, uniforms)
      twgl.drawBufferInfo(canvasWebglContext!, bufferInfo)
    }

    updateManipulatorPosition()
    renderSrgbLimitStroke()
    renderRelativeChromaStroke()
    renderContrastStroke()
    setColorOfColorSpaceLabel()

    if (consoleLogInfos.includes('Color picker rendering speed')) {
      colorPickerCanvasRenderingEnd = performance.now()
      console.log(` Canvas: ${round(colorPickerCanvasRenderingEnd - colorPickerCanvasRenderingStart, 4)} ms.`)
      console.log(
        ` Total: ${round(
          colorPickerStrokesRenderingEnd + colorPickerCanvasRenderingEnd - (colorPickerStrokesRenderingStart + colorPickerCanvasRenderingStart),
          4
        )} ms.`
      )
    }
  }

  const scaleColorPickerCanvasAndWebglViewport = () => {
    let resFactor = getColorPickerResolutionInfos().factor
    let pickerSize = getColorPickerResolutionInfos().size

    if ($userSettings.get().useHardwareAcceleration) {
      colorPickerCanvas.current!.style.transform = `scale(${resFactor})`
    } else {
      // We add a bit more to X scale as there a one-pixel gap without.
      colorPickerCanvas.current!.style.transform = `scale(${resFactor + 0.003}, ${resFactor})`
    }

    colorPickerCanvas.current!.width = pickerSize
    colorPickerCanvas.current!.height = pickerSize

    if ($userSettings.get().useHardwareAcceleration) {
      canvasWebglContext!.viewport(0, 0, pickerSize, pickerSize)

      resFactor = getColorPickerResolutionInfos('oklchTransition').factor
      pickerSize = getColorPickerResolutionInfos('oklchTransition').size

      colorPickerTransitionCanvas.current!.style.transform = `scale(${resFactor})`
      colorPickerTransitionCanvas.current!.width = pickerSize
      colorPickerTransitionCanvas.current!.height = pickerSize
    }
  }

  const setDrawingBufferColorSpace = () => {
    canvasWebglContext!.drawingBufferColorSpace = $currentFileColorProfile.get() === 'p3' ? 'display-p3' : 'srgb'
  }

  const initCanvasContext = () => {
    if (!$userSettings.get().useHardwareAcceleration) {
      canvas2dContext = colorPickerCanvas.current!.getContext('2d')
    } else {
      canvas2dContextTransition = colorPickerTransitionCanvas.current!.getContext('2d')
      colorPickerTransitionCanvas.current!.classList.add('u-visibility-hidden')

      canvasWebglContext = colorPickerCanvas.current!.getContext('webgl2')

      const arrays = { position: [-1, -1, 0, 1, -1, 0, -1, 1, 0, -1, 1, 0, 1, -1, 0, 1, 1, 0] }
      bufferInfo = twgl.createBufferInfoFromArrays(canvasWebglContext!, arrays)

      const errorCallback = (errorMessage: any) => {
        console.error(errorMessage)
      }
      programInfo = twgl.createProgramInfo(canvasWebglContext!, [vShader, libraryGlsl + utilsGlsl + fShader], undefined, errorCallback)

      canvasWebglContext!.useProgram(programInfo.program)
      twgl.setBuffersAndAttributes(canvasWebglContext!, programInfo, bufferInfo)
    }
  }

  const updateColorSpaceLabelInColorPicker = () => {
    if ($currentFileColorProfile.get() === 'rgb') return

    let newValue: keyof typeof ColorSpacesNames | '' = ''

    if ($currentColorModel.get() === 'oklch') {
      if (inGamutSrgb(`oklch(${$colorHxya.get().y / 100} ${$colorHxya.get().x - 0.001} ${$colorHxya.get().h})`)) {
        newValue = 'sRGB'
      } else {
        newValue = 'P3'
      }
    }

    if (colorSpaceOfCurrentColor !== newValue) {
      setColorSpaceOfCurrentColor(newValue)
    }
  }

  useEffect(() => {
    if (!isMounted.current) return
    scaleColorPickerCanvasAndWebglViewport()
    renderColorPickerCanvas()
  }, [currentColorModel])

  useEffect(() => {
    if (!isMounted.current) return
    updateManipulatorPosition()
    updateColorSpaceLabelInColorPicker()
  }, [colorHxya.x, colorHxya.y, selectionId])

  useEffect(() => {
    if ($currentColorModel.get() !== 'oklch') return
    if ($currentFileColorProfile.get() === 'rgb') return

    if ($oklchRenderMode.get() === 'square') {
      if ($relativeChroma.get() > 84 && colorHxya.y > 91) {
        colorSpaceLabel.current!.style.opacity = '0.3'
      } else {
        colorSpaceLabel.current!.style.opacity = '1'
      }
    }
  }, [colorHxya.y, relativeChroma])

  useEffect(() => {
    if (!isMounted.current) return

    if ($userSettings.get().useHardwareAcceleration) setDrawingBufferColorSpace()

    renderColorPickerCanvas()
  }, [currentFileColorProfile])

  useEffect(() => {
    if (!isMounted.current || selectionId === '') return
    renderColorPickerCanvas()
    updateColorSpaceLabelInColorPicker()
  }, [colorHxya.h, selectionId])

  useEffect(() => {
    if (!isMounted.current || selectionId === '') return

    renderColorPickerCanvas({
      animation: true
    })
  }, [oklchRenderMode])

  useEffect(() => {
    if (!isMounted.current) return
    renderRelativeChromaStroke()
  }, [relativeChroma, lockRelativeChroma])

  useEffect(() => {
    if (!isMounted.current) return
    renderContrastStroke()
  }, [contrast, lockContrast, currentBgOrFg])

  useEffect(() => {
    if (uiMessage.show) {
      colorPicker.current!.style.backgroundColor = ''
      colorPicker.current!.classList.add('c-color-picker--deactivated')
    } else {
      colorPicker.current!.classList.remove('c-color-picker--deactivated')
    }
  }, [uiMessage])

  useEffect(() => {
    initCanvasContext()
    scaleColorPickerCanvasAndWebglViewport()

    if ($currentFileColorProfile.get() === 'rgb') {
      colorSpaceLabel.current!.style.display = 'none'
    }

    if ($userSettings.get().useHardwareAcceleration) setDrawingBufferColorSpace()

    if (!$uiMessage.get().show) {
      renderColorPickerCanvas()
      updateManipulatorPosition()
      updateColorSpaceLabelInColorPicker()
    }

    colorPicker.current!.addEventListener('mousedown', () => {
      setMouseEventCallback(handleNewManipulatorPosition)
    })

    // Change x or y values from key press.
    colorPicker.current!.addEventListener('keydown', (event) => {
      if ($isTransitionRunning.get()) return
      if (!['ArrowUp', 'ArrowRight', 'ArrowDown', 'ArrowLeft'].includes(event.key)) return

      handleKeyDown(event.key as 'ArrowUp' | 'ArrowDown' | 'ArrowLeft' | 'ArrowRight')
    })

    // Change hue value on vertical wheel.scroll
    colorPicker.current!.addEventListener('wheel', (event) => {
      if ($isTransitionRunning.get()) return

      handleWheel(event)
    })

    isMounted.current = true
  }, [])

  return (
    <div ref={colorPicker} tabIndex={0} className="c-color-picker" style={{ width: `${PICKER_SIZE}px`, height: `${PICKER_SIZE}px` }}>
      <div className="c-color-picker__message-wrapper">
        <p className="c-color-picker__message-text">{uiMessage.message}</p>
      </div>

      <div ref={colorSpaceLabel} className={`c-color-picker__color-space-label`}>
        {colorSpaceOfCurrentColor}
      </div>

      <canvas ref={colorPickerTransitionCanvas} className="c-color-picker__canvas" id="okhxy-xy-picker-transition"></canvas>
      <canvas ref={colorPickerCanvas} className="c-color-picker__canvas" id="okhxy-xy-picker"></canvas>
      <svg className="c-color-picker__srgb-limit-stroke" width={PICKER_SIZE} height={PICKER_SIZE}>
        <path ref={srgbLimitStroke} fill="none" stroke="#FFFFFF" />
      </svg>

      <svg className="c-color-picker__relative-chroma-stroke" width={PICKER_SIZE} height={PICKER_SIZE}>
        <path ref={relativeChromaStroke} fill="none" stroke="#FFFFFF80" />
      </svg>

      <svg className="c-color-picker__contrast-stroke" width={PICKER_SIZE} height={PICKER_SIZE}>
        <path ref={contrastStroke} fill="none" stroke="#FFFFFF80" />
      </svg>

      <svg className="c-color-picker__manipulator" width={PICKER_SIZE} height={PICKER_SIZE}>
        <g ref={manipulatorColorPicker} transform="translate(-10,-10)">
          <circle cx="0" cy="0" r="4.8" fill="none" strokeWidth="2.8" stroke="#555555"></circle>
          <circle cx="0" cy="0" r="4.8" fill="none" strokeWidth="2.5" stroke="#ffffff"></circle>
        </g>
      </svg>
    </div>
  )
}
