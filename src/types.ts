import { uiMessageTexts } from './ui/ui-messages'

export type RgbElement = number // 0 - 255

export type Hue = number // 0 - 360
export type AbsoluteChroma = number // 0 - MAX_CHROMA_P3
export type RelativeChroma = number // 0 - 100
export type Saturation = number // 0 - 100
export type Lightness = number // 0 - 100
export type Opacity = number // 0 - 100

export type ApcaContrast = number // -108 - 106

export type SvgPath = string

// We use enums to get the value when hovering variable that use these types like FigmaEditorType
enum FigmaEditorTypes {
  'figjam',
  'figma',
  'dev'
}
export type FigmaEditorType = keyof typeof FigmaEditorTypes

// We use 'rgb' and not 'srgb' because Culori use it like this, even if it's confusing because rgb is a color model, not a space.
enum FileColorProfiles {
  'rgb',
  'p3'
}
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

export type ColorRgb = {
  r: RgbElement
  g: RgbElement
  b: RgbElement
}

export type ColorRgba = {
  r: RgbElement
  g: RgbElement
  b: RgbElement
  a: RgbElement
}

export type ColorHxy = {
  h: Hue
  x: AbsoluteChroma | Saturation
  y: Lightness
}

export type ColorHxya = {
  h: Hue
  x: AbsoluteChroma | Saturation
  y: Lightness
  a: Opacity
}

export type ColorsRgba = {
  [key: string]: ColorRgba | ColorRgb | null
  parentFill: ColorRgb | null
  fill: ColorRgba | null
  stroke: ColorRgba | null
}

type KeysPressed = 'shift' | 'ctrl' | ''

export type CurrentKeysPressed = KeysPressed[]

export type ColorValueDecimals = {
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

// Message for UI types

export type MessageForUiTypes = 'syncLocalStorageValues' | 'syncCurrentFillOrStrokeAndColorsRgba' | 'displayUiMessage'

export type SyncLocalStorageValuesData = {
  figmaEditorType: FigmaEditorType
  fileColorProfile: FileColorProfile
  currentColorModel: CurrentColorModel
  showCssColorCodes: boolean
  lockRelativeChroma: boolean
  lockContrast: boolean
}

export type SyncCurrentFillOrStrokeAndColorsRgbaData = {
  currentFillOrStroke: CurrentFillOrStroke
  colorsRgba: ColorsRgba
}

export type DisplayUiMessageData = {
  uiMessageCode: keyof typeof uiMessageTexts
  nodeType: string | null
}

export type MessageForUiData = SyncLocalStorageValuesData | SyncCurrentFillOrStrokeAndColorsRgbaData | DisplayUiMessageData

export type MessageForUi = {
  type: MessageForUiTypes
  data: MessageForUiData
}

// Message for backend types

export type MessageForBackendTypes =
  | 'triggerInit'
  | 'updateShapeColor'
  | 'syncFileColorProfile'
  | 'syncCurrentFillOrStroke'
  | 'syncCurrentColorModel'
  | 'syncShowCssColorCodes'
  | 'syncLockRelativeChroma'
  | 'syncLockContrast'

export type UpdateShapeColorData = {
  newColorRgba: ColorRgba
  updateParent: boolean
}

export type SyncFileColorProfileData = {
  fileColorProfile: FileColorProfile
}

export type SyncCurrentFillOrStrokeData = {
  currentFillOrStroke: CurrentFillOrStroke
}

export type SyncCurrentColorModelData = {
  currentColorModel: CurrentColorModel
}

export type SyncShowCssColorCodesData = {
  showCssColorCodes: boolean
}

export type SyncLockRelativeChromaData = {
  lockRelativeChroma: boolean
}

export type SyncLockContrastData = {
  lockContrast: boolean
}

export type MessageForBackendData =
  | UpdateShapeColorData
  | SyncFileColorProfileData
  | SyncCurrentFillOrStrokeData
  | SyncCurrentColorModelData
  | SyncShowCssColorCodesData
  | SyncLockRelativeChromaData
  | SyncLockContrastData

export type MessageForBackend = {
  type: MessageForBackendTypes
  data: MessageForBackendData
}
