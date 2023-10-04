import { useEffect, useRef, useState } from 'react'
import { useStore } from '@nanostores/react'
import {
  $colorHxya,
  $fileColorProfile,
  $currentColorModel,
  $lockRelativeChroma,
  $currentKeysPressed,
  $colorValueDecimals,
  $uiMessage,
  updateColorHxya,
  $mouseEventCallback
} from '../../store'
import { limitMouseHandlerValue, roundWithDecimal } from '../../helpers/others'

import {
  consoleLogInfos,
  PICKER_SIZE,
  RES_PICKER_SIZE_OKHSLV,
  RES_PICKER_SIZE_OKLCH,
  RES_PICKER_FACTOR_OKHSLV,
  RES_PICKER_FACTOR_OKLCH,
  OKLCH_RGB_BOUNDARY_COLOR,
  OKLCH_CHROMA_SCALE
} from '../../../constants'

import utilsGlsl from '@virtual:shaders/src/ui/shaders/utils.glsl'
import libraryGlsl from '@virtual:shaders/src/ui/shaders/library.glsl'
import fShader from '@virtual:shaders/src/ui/shaders/f_shader.glsl'
import vShader from '@virtual:shaders/src/ui/shaders/v_shader.glsl'

import * as twgl from 'twgl.js'

import { inGamut } from '../../helpers/culori.mjs'
import getClampedChroma from '../../helpers/getClampedChroma'
import getSrgbStrokeLimit from './helpers/getSrgbStrokeLimit'
import getRelativeChromaStrokeLimit from './helpers/getRelativeChromaStrokeLimit'
import { ColorModels } from '../../../types'
import convertRelativeChromaToAbsolute from '../../helpers/convertRelativeChromaToAbsolute'
import convertAbsoluteChromaToRelative from '../../helpers/convertAbsoluteChromaToRelative'

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

  const [colorSpaceOfCurrentColor, setColorSpaceOfCurrentColor] = useState<keyof typeof ColorSpacesNames | ''>('')

  const uiMessage = useStore($uiMessage)
  const colorHxya = useStore($colorHxya)

  const currentColorModel = useStore($currentColorModel)
  const lockRelativeChroma = useStore($lockRelativeChroma)

  const colorPicker = useRef<HTMLDivElement>(null)
  const colorPickerCanvas = useRef<HTMLCanvasElement>(null)
  const manipulatorColorPicker = useRef<SVGGElement>(null)
  const srgbBoundary = useRef<SVGPathElement>(null)
  const relativeChromaStroke = useRef<SVGPathElement>(null)

  const updateManipulatorPosition = () => {
    let x = $currentColorModel.get() === 'oklchCss' ? $colorHxya.get().x : $colorHxya.get().x / 100
    const y = $colorHxya.get().y / 100

    if (['oklch', 'oklchCss'].includes($currentColorModel.get()!)) {
      x *= OKLCH_CHROMA_SCALE
    }

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
    if ($currentKeysPressed.get().includes('shift') && mainMouseMovement === 'horizontal' && !$lockRelativeChroma.get()) {
      currentContrainedMove = true
    } else {
      newColorHxya.y = roundWithDecimal(limitMouseHandlerValue(1 - canvasY / PICKER_SIZE) * 100, $colorValueDecimals.get()!.y)
    }

    // Get the new X value.
    if ($currentKeysPressed.get().includes('shift') && mainMouseMovement === 'vertical' && !$lockRelativeChroma.get()) {
      currentContrainedMove = true
    } else {
      if (['oklch', 'oklchCss'].includes($currentColorModel.get()!) && $lockRelativeChroma.get() && !$currentKeysPressed.get().includes('ctrl')) {
        newColorHxya.x = convertRelativeChromaToAbsolute({
          colorHxy: {
            h: $colorHxya.get().h!,
            x: newColorHxya.x,
            y: newColorHxya.y
          }
        })
      } else {
        newColorHxya.x = roundWithDecimal(limitMouseHandlerValue(canvasX / PICKER_SIZE) * 100, $colorValueDecimals.get()!.x)

        switch ($currentColorModel.get()) {
          case 'oklch':
            newColorHxya.x = roundWithDecimal(newColorHxya.x / OKLCH_CHROMA_SCALE, $colorValueDecimals.get()!.x)
            break
          case 'oklchCss':
            newColorHxya.x = roundWithDecimal(newColorHxya.x / 100 / OKLCH_CHROMA_SCALE, $colorValueDecimals.get()!.x)
            break
        }
      }
    }

    if (['oklch', 'oklchCss'].includes($currentColorModel.get()!) && !$lockRelativeChroma.get()) {
      newColorHxya.x = getClampedChroma({ h: $colorHxya.get().h!, x: newColorHxya.x, y: newColorHxya.y })
    }

    if ($currentKeysPressed.get().includes('ctrl')) {
      if (mainMouseMovement === 'vertical' && Math.round(newColorHxya.y) % 5 === 0) {
        if ($lockRelativeChroma.get()) {
          newColorHxya.x = convertRelativeChromaToAbsolute({
            colorHxy: {
              h: $colorHxya.get().h!,
              x: newColorHxya.x,
              y: Math.round(newColorHxya.y)
            }
          })
        }
        updateColorHxya({ x: newColorHxya.x, y: Math.round(newColorHxya.y) })
      } else if (mainMouseMovement === 'horizontal' && !$lockRelativeChroma.get()) {
        let valueToTest = newColorHxya.x

        if (['oklch', 'oklchCss'].includes($currentColorModel.get()!)) {
          valueToTest = convertAbsoluteChromaToRelative({ h: $colorHxya.get().h!, x: newColorHxya.x, y: newColorHxya.y })
        }

        if (valueToTest % 5 === 0) {
          updateColorHxya({ x: newColorHxya.x, y: newColorHxya.y })
        }
      }
    } else {
      updateColorHxya(newColorHxya)
    }

    updateManipulatorPosition()
  }

  const renderColorPickerCanvas = () => {
    if ($fileColorProfile.get() === 'p3') {
      srgbBoundary.current!.setAttribute('d', getSrgbStrokeLimit())
    } else {
      srgbBoundary.current!.setAttribute('d', '')
    }

    if ($lockRelativeChroma.get()) {
      relativeChromaStroke.current!.setAttribute('d', getRelativeChromaStrokeLimit())
    } else {
      relativeChromaStroke.current!.setAttribute('d', '')
    }

    const gl = colorPickerGlContext
    const size = ['oklch', 'oklchCss'].includes($currentColorModel.get()!) ? RES_PICKER_SIZE_OKLCH : RES_PICKER_SIZE_OKHSLV

    gl!.viewport(0, 0, size, size)
    gl!.drawingBufferColorSpace = $fileColorProfile.get() === 'p3' ? 'display-p3' : 'srgb'
    gl!.clearColor(0, 0, 0, 1)
    gl!.clear(gl!.COLOR_BUFFER_BIT)
    twgl.setUniforms(programInfo, {
      resolution: [size, size],
      dark: document.documentElement.classList.contains('figma-dark'),
      chroma_scale: OKLCH_CHROMA_SCALE,
      showP3: $fileColorProfile.get() === 'p3',
      mode: ColorModels[$currentColorModel.get()!],
      hue_rad: ($colorHxya.get().h! * Math.PI) / 180
    })
    twgl.drawBufferInfo(gl!, bufferInfo)
  }

  const scaleColorPickerCanvas = () => {
    if (['oklch', 'oklchCss'].includes($currentColorModel.get()!)) {
      colorPickerCanvas.current!.style.transform = `scale(${RES_PICKER_FACTOR_OKLCH})`
      colorPickerCanvas.current!.width = RES_PICKER_SIZE_OKLCH
      colorPickerCanvas.current!.height = RES_PICKER_SIZE_OKLCH
    } else {
      colorPickerCanvas.current!.style.transform = `scale(${RES_PICKER_FACTOR_OKHSLV})`
      colorPickerCanvas.current!.width = RES_PICKER_SIZE_OKHSLV
      colorPickerCanvas.current!.height = RES_PICKER_SIZE_OKHSLV
    }
  }

  const updateColorSpaceLabelInColorPicker = () => {
    let newValue: keyof typeof ColorSpacesNames | '' = ''

    if (['oklch', 'oklchCss'].includes($currentColorModel.get()!)) {
      const currentChroma = $currentColorModel.get() === 'oklch' ? $colorHxya.get().x / 100 : $colorHxya.get().x - 0.001

      if (inGamutSrgb(`oklch(${$colorHxya.get().y / 100} ${currentChroma} ${$colorHxya.get().h})`)) {
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
    scaleColorPickerCanvas()
  }, [currentColorModel])

  useEffect(() => {
    if (colorHxya.h === null) return

    renderColorPickerCanvas()
    updateManipulatorPosition()
    updateColorSpaceLabelInColorPicker()
  }, [colorHxya])

  useEffect(() => {
    if (colorHxya.h === null) return

    renderColorPickerCanvas()
  }, [lockRelativeChroma])

  useEffect(() => {
    if (uiMessage.show) {
      colorPicker.current!.classList.add('c-color-picker--deactivated')
    } else {
      colorPicker.current!.classList.remove('c-color-picker--deactivated')
    }
  }, [uiMessage])

  useEffect(() => {
    colorPickerGlContext = colorPickerCanvas.current!.getContext('webgl2')
    const gl = colorPickerGlContext!
    const arrays = {
      position: [-1, -1, 0, 1, -1, 0, -1, 1, 0, -1, 1, 0, 1, -1, 0, 1, 1, 0]
    }

    bufferInfo = twgl.createBufferInfoFromArrays(gl, arrays)
    programInfo = twgl.createProgramInfo(gl, [vShader, libraryGlsl + utilsGlsl + fShader])

    gl.useProgram(programInfo.program)
    twgl.setBuffersAndAttributes(gl, programInfo, bufferInfo)

    colorPickerCanvas.current!.addEventListener('mousedown', () => {
      $mouseEventCallback.set(handleNewManipulatorPosition)
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
  }, [])

  return (
    <div ref={colorPicker} className="c-color-picker c-color-picker--deactivated" style={{ width: `${PICKER_SIZE}px`, height: `${PICKER_SIZE}px` }}>
      <div className="c-color-picker__message-wrapper">
        <p className="c-color-picker__message-text">{uiMessage.message}</p>
      </div>

      <div className="c-color-picker__color-space">{colorSpaceOfCurrentColor}</div>

      <canvas ref={colorPickerCanvas} className="c-color-picker__canvas" id="okhxy-xy-picker"></canvas>
      <svg className="c-color-picker__srgb-boundary" width={PICKER_SIZE} height={PICKER_SIZE}>
        <path ref={srgbBoundary} fill="none" stroke={OKLCH_RGB_BOUNDARY_COLOR} />
      </svg>

      <svg className="c-color-picker__relative-chroma-stroke" width={PICKER_SIZE} height={PICKER_SIZE}>
        <path ref={relativeChromaStroke} fill="none" stroke="#FFFFFF80" />
      </svg>

      <svg className="c-color-picker__handler" width={PICKER_SIZE} height={PICKER_SIZE}>
        <g ref={manipulatorColorPicker} transform="translate(-10,-10)">
          <circle cx="0" cy="0" r="4.8" fill="none" strokeWidth="2.8" stroke="#555555"></circle>
          <circle cx="0" cy="0" r="4.8" fill="none" strokeWidth="2.5" stroke="#ffffff"></circle>
        </g>
      </svg>
    </div>
  )
}
