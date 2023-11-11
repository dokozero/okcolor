import { useEffect, useRef, useState } from 'react'
import { useStore } from '@nanostores/react'

import {
  consoleLogInfos,
  PICKER_SIZE,
  RES_PICKER_SIZE_OKHSLV,
  RES_PICKER_SIZE_OKLCH,
  RES_PICKER_FACTOR_OKHSLV,
  RES_PICKER_FACTOR_OKLCH,
  OKLCH_CHROMA_SCALE
} from '../../../constants'

import utilsGlsl from '@virtual:shaders/src/ui/shaders/utils.glsl'
import libraryGlsl from '@virtual:shaders/src/ui/shaders/library.glsl'
import fShader from '@virtual:shaders/src/ui/shaders/f_shader.glsl'
import vShader from '@virtual:shaders/src/ui/shaders/v_shader.glsl'

import * as twgl from 'twgl.js'

import { inGamut } from '../../helpers/colors/culori.mjs'
import { AbsoluteChroma, Saturation, ColorModelList } from '../../../types'
import convertAbsoluteChromaToRelative from '../../helpers/colors/convertAbsoluteChromaToRelative/convertAbsoluteChromaToRelative'
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
import convertHxyToRgb from '../../helpers/colors/convertHxyToRgb/convertHxyToRgb'

let colorPickerGlContext: WebGL2RenderingContext | null = null
let bufferInfo: twgl.BufferInfo
let programInfo: twgl.ProgramInfo

const inGamutSrgb = inGamut('rgb')

let lastMouseX: number
let lastMouseY: number
let mainMouseMovement: 'vertical' | 'horizontal' | null = null

let currentContrainedMove = false

enum ColorSpacesNames {
  'sRGB',
  'P3'
}

export default function ColorPicker() {
  if (consoleLogInfos.includes('Component renders')) {
    console.log('Component render — ColorPicker')
  }

  const isMounted = useRef(false)

  const [colorSpaceOfCurrentColor, setColorSpaceOfCurrentColor] = useState<keyof typeof ColorSpacesNames | ''>('')

  const uiMessage = useStore($uiMessage)
  const colorHxya = useStore($colorHxya)

  const currentColorModel = useStore($currentColorModel)
  const currentFileColorProfile = useStore($currentFileColorProfile)
  const lockRelativeChroma = useStore($lockRelativeChroma)
  const lockContrast = useStore($lockContrast)
  const relativeChroma = useStore($relativeChroma)
  const contrast = useStore($contrast)
  const currentBgOrFg = useStore($currentBgOrFg)

  const colorPicker = useRef<HTMLDivElement>(null)
  const colorPickerCanvas = useRef<HTMLCanvasElement>(null)
  const manipulatorColorPicker = useRef<SVGGElement>(null)
  const srgbBoundary = useRef<SVGPathElement>(null)
  const relativeChromaStroke = useRef<SVGPathElement>(null)
  const contrastStroke = useRef<SVGPathElement>(null)

  const updateManipulatorPosition = () => {
    let x: AbsoluteChroma | Saturation

    if (['oklch', 'oklchCss'].includes($currentColorModel.get())) {
      x = $colorHxya.get().x * OKLCH_CHROMA_SCALE
    } else {
      x = $colorHxya.get().x / 100
    }

    const y = $colorHxya.get().y / 100

    manipulatorColorPicker.current!.transform.baseVal.getItem(0).setTranslate(PICKER_SIZE * x, PICKER_SIZE * (1 - y))
  }

  const handleNewManipulatorPosition = (event: MouseEvent) => {
    const rect = colorPickerCanvas.current!.getBoundingClientRect()
    const canvasX = event.clientX - rect.left
    const canvasY = event.clientY - rect.top

    const newColorHxya = {
      x: $colorHxya.get().x,
      y: $colorHxya.get().y
    }

    // Get the new Y value.
    if (($currentKeysPressed.get().includes('shift') && mainMouseMovement === 'horizontal' && !$lockRelativeChroma.get()) || $lockContrast.get()) {
      currentContrainedMove = true
    } else {
      newColorHxya.y = round(limitMouseManipulatorPosition(1 - canvasY / PICKER_SIZE) * 100, getColorHxyDecimals().y)
    }

    // Get the new X value.
    if ($currentKeysPressed.get().includes('shift') && mainMouseMovement === 'vertical' && !$lockRelativeChroma.get()) {
      currentContrainedMove = true
    } else {
      newColorHxya.x = round(limitMouseManipulatorPosition(canvasX / PICKER_SIZE) * 100, getColorHxyDecimals().x)

      if (['oklch', 'oklchCss'].includes($currentColorModel.get())) {
        newColorHxya.x = round(newColorHxya.x / 100 / OKLCH_CHROMA_SCALE, getColorHxyDecimals().x)
      }
    }

    if ($currentKeysPressed.get().includes('ctrl')) {
      if (mainMouseMovement === 'vertical' && Math.round(newColorHxya.y) % 5 === 0) {
        setColorHxyaWithSideEffects({ newColorHxya: { x: newColorHxya.x, y: Math.round(newColorHxya.y) } })
      } else if (mainMouseMovement === 'horizontal' && !$lockRelativeChroma.get()) {
        let valueToTest = newColorHxya.x

        if (['oklch', 'oklchCss'].includes($currentColorModel.get())) {
          valueToTest = convertAbsoluteChromaToRelative({
            colorHxy: {
              h: $colorHxya.get().h,
              x: newColorHxya.x,
              y: newColorHxya.y
            }
          })
        }

        if (valueToTest % 5 === 0) {
          setColorHxyaWithSideEffects({ newColorHxya: { x: newColorHxya.x, y: newColorHxya.y } })
        }
      }
    } else {
      setColorHxyaWithSideEffects({ newColorHxya: newColorHxya })
    }

    updateManipulatorPosition()
  }

  const renderSrgbBoundary = () => {
    if ($currentFileColorProfile.get() === 'p3') {
      srgbBoundary.current!.setAttribute('d', getSrgbStrokeLimit())
    } else {
      srgbBoundary.current!.setAttribute('d', '')
    }
  }

  const renderRelativeChromaStroke = () => {
    if ($lockRelativeChroma.get()) {
      relativeChromaStroke.current!.setAttribute('d', getRelativeChromaStrokeLimit())
    } else {
      relativeChromaStroke.current!.setAttribute('d', '')
    }
  }

  const renderContrastStroke = () => {
    if ($lockContrast.get() && $colorsRgba.get().parentFill && $colorsRgba.get().fill) {
      contrastStroke.current!.setAttribute('d', getContrastStrokeLimit())
    } else {
      contrastStroke.current!.setAttribute('d', '')
    }
  }

  const renderColorPickerCanvas = () => {
    renderSrgbBoundary()
    renderRelativeChromaStroke()
    renderContrastStroke()

    if (gl === null) return

    const size = ['oklch', 'oklchCss'].includes($currentColorModel.get()) ? RES_PICKER_SIZE_OKLCH : RES_PICKER_SIZE_OKHSLV

    gl.drawingBufferColorSpace = $currentFileColorProfile.get() === 'p3' ? 'display-p3' : 'srgb'

    const clearColorRgb = convertHxyToRgb({
      colorHxy: {
        h: $colorHxya.get().h,
        x: 0.004,
        y: document.documentElement.classList.contains('figma-dark') ? 43 : 95
      }
    })
    gl.clearColor(clearColorRgb.r, clearColorRgb.g, clearColorRgb.b, 1)
    gl.clear(gl.COLOR_BUFFER_BIT)
    const uniforms = {
      resolution: [size, size],
      isDarkModeEnabled: document.documentElement.classList.contains('figma-dark'),
      chromaScale: OKLCH_CHROMA_SCALE,
      isSpaceP3: $currentFileColorProfile.get() === 'p3',
      colorModel: ColorModelList[$currentColorModel.get()],
      hueRad: ($colorHxya.get().h * Math.PI) / 180
    }
    twgl.setUniforms(programInfo, uniforms)
    twgl.drawBufferInfo(gl, bufferInfo)
  }

  const scaleColorPickerCanvasAndGlViewport = () => {
    if (['oklch', 'oklchCss'].includes($currentColorModel.get())) {
      colorPickerCanvas.current!.style.transform = `scale(${RES_PICKER_FACTOR_OKLCH})`
      colorPickerCanvas.current!.width = RES_PICKER_SIZE_OKLCH
      colorPickerCanvas.current!.height = RES_PICKER_SIZE_OKLCH
    } else {
      colorPickerCanvas.current!.style.transform = `scale(${RES_PICKER_FACTOR_OKHSLV})`
      colorPickerCanvas.current!.width = RES_PICKER_SIZE_OKHSLV
      colorPickerCanvas.current!.height = RES_PICKER_SIZE_OKHSLV
    }

    if (gl === null) return
    const size = ['oklch', 'oklchCss'].includes($currentColorModel.get()) ? RES_PICKER_SIZE_OKLCH : RES_PICKER_SIZE_OKHSLV
    gl.viewport(0, 0, size, size)
  }

  const updateColorSpaceLabelInColorPicker = () => {
    let newValue: keyof typeof ColorSpacesNames | '' = ''

    if (['oklch', 'oklchCss'].includes($currentColorModel.get())) {
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

    scaleColorPickerCanvasAndGlViewport()
    renderColorPickerCanvas()
  }, [currentColorModel])

  useEffect(() => {
    if (!isMounted.current) return

    updateManipulatorPosition()
    updateColorSpaceLabelInColorPicker()
  }, [colorHxya.x, colorHxya.y])

  useEffect(() => {
    if (!isMounted.current) return

    renderColorPickerCanvas()
  }, [colorHxya.h, currentColorModel])

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
      colorPicker.current!.classList.add('c-color-picker--deactivated')
    } else {
      colorPicker.current!.classList.remove('c-color-picker--deactivated')
    }
  }, [uiMessage])

  useEffect(() => {
    gl = colorPickerCanvas.current!.getContext('webgl2')
    if (gl === null) return

    const arrays = {
      position: [-1, -1, 0, 1, -1, 0, -1, 1, 0, -1, 1, 0, 1, -1, 0, 1, 1, 0]
    }
    bufferInfo = twgl.createBufferInfoFromArrays(gl, arrays)
    programInfo = twgl.createProgramInfo(gl, [vShader, libraryGlsl + utilsGlsl + fShader])

    gl.useProgram(programInfo.program)
    twgl.setBuffersAndAttributes(gl, programInfo, bufferInfo)

    scaleColorPickerCanvasAndGlViewport()
    renderColorPickerCanvas()
    updateManipulatorPosition()
    updateColorSpaceLabelInColorPicker()

    colorPickerCanvas.current!.addEventListener('mousedown', () => {
      setMouseEventCallback(handleNewManipulatorPosition)
    })

    document.addEventListener('keyup', () => {
      currentContrainedMove = false
      mainMouseMovement = null
    })

    colorPickerCanvas.current!.addEventListener('mousemove', (event) => {
      const deltaX = Math.abs(event.clientX - lastMouseX)
      const deltaY = Math.abs(event.clientY - lastMouseY)

      if (Math.abs(deltaX - deltaY) && !currentContrainedMove) {
        if (deltaX > deltaY) mainMouseMovement = 'horizontal'
        else mainMouseMovement = 'vertical'
      }

      lastMouseX = event.clientX
      lastMouseY = event.clientY
    })

    isMounted.current = true
  }, [])

  return (
    <div ref={colorPicker} className="c-color-picker" style={{ width: `${PICKER_SIZE}px`, height: `${PICKER_SIZE}px` }}>
      <div className="c-color-picker__message-wrapper">
        <p className="c-color-picker__message-text">{uiMessage.message}</p>
      </div>

      <div className="c-color-picker__color-space">{colorSpaceOfCurrentColor}</div>

      <canvas ref={colorPickerCanvas} className="c-color-picker__canvas" id="okhxy-xy-picker"></canvas>
      <svg className="c-color-picker__srgb-boundary" width={PICKER_SIZE} height={PICKER_SIZE}>
        <path ref={srgbBoundary} fill="none" stroke="#FFFFFF" />
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
