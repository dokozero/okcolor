import { uiMessageTexts } from './ui/ui-messages'

enum FigmaEditorTypes {
  'figjam',
  'figma',
  'dev'
}
export type FigmaEditorType = keyof typeof FigmaEditorTypes

enum FileColorProfiles {
  'rgb',
  'p3'
}
// We use 'rgb' and not 'srgb' because Culori use it like this, even if it's confusing because rgb is a color model.
export type FileColorProfile = keyof typeof FileColorProfiles

export enum ColorModels {
  'oklchCss',
  'oklch',
  'okhsl',
  'okhsv'
}
export type CurrentColorModel = keyof typeof ColorModels

enum FillOrStrokes {
  'fill',
  'stroke'
}
export type CurrentFillOrStroke = keyof typeof FillOrStrokes

export enum HxyaLabels {
  'h' = 'h',
  'x' = 'x',
  'y' = 'y',
  'a' = 'a'
}

export interface ColorRgb {
  r: number // 0 - 255
  g: number // 0 - 255
  b: number // 0 - 255
}

export interface ColorRgba {
  r: number // 0 - 255
  g: number // 0 - 255
  b: number // 0 - 255
  a: number // 0 - 100
}

export interface ColorHxy {
  h: number // 0 - 360
  x: number // oklchCss = 0 - MAX_CHROMA_P3, others: 0 - 100
  y: number // 0 - 100
}

export interface ColorHxya {
  h: number | null // 0 - 360
  x: number // oklchCss = 0 - MAX_CHROMA_P3, others: 0 - 100
  y: number // 0 - 100
  a: number // 0 - 100
}

export interface PartialColorHxya {
  h?: number | undefined // 0 - 360
  x?: number | undefined // oklchCss = 0 - MAX_CHROMA_P3, others: 0 - 100
  y?: number | undefined // 0 - 100
  a?: number | undefined // 0 - 100
}

export interface ColorsRgba {
  [key: string]: ColorRgba | null
  fill: ColorRgba | null
  stroke: ColorRgba | null
}

enum KeysPressed {
  'shift',
  'ctrl',
  ''
}

export type CurrentKeysPressed = (keyof typeof KeysPressed)[]

export interface ColorValueDecimals {
  [key: string]: number
  h: 0 | 1
  x: 0 | 1 | 3 | 4 | 6
  y: 0 | 1
}

export enum ColorCodesInputValues {
  'currentColorModel' = 'currentColorModel',
  'color' = 'color',
  'rgba' = 'rgba',
  'hex' = 'hex'
}

export interface InitData {
  figmaEditorType: FigmaEditorType
  fileColorProfile: FileColorProfile
  currentColorModel: CurrentColorModel
  lockRelativeChroma: boolean
  showCssColorCodes: boolean
}

export interface NewColorsRgbaData {
  currentFillOrStroke: CurrentFillOrStroke
  colorsRgba: ColorsRgba
}

export interface DisplayUiMessageData {
  uiMessageCode: keyof typeof uiMessageTexts
  nodeType: string | null
}

export interface OnMessageFromPlugin {
  data: {
    pluginMessage: {
      message: string
      initData: InitData
      newColorsRgbaData: NewColorsRgbaData
      displayUiMessageData: DisplayUiMessageData
    }
  }
}
