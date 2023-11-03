import { uiMessageTexts } from './ui/ui-messages'

export type RgbElement = number // 0 - 255

export type Hue = number // 0 - 360
export type AbsoluteChroma = number // 0 - MAX_CHROMA_P3
export type RelativeChroma = number // 0 - 100
export type Saturation = number // 0 - 100
export type Lightness = number // 0 - 100
export type Opacity = number // 0 - 100

export type ApcaContrast = number // -108 - 106
export type WcagContrast = number // -21 - 21, normally WCAG contrast is between 0 and 21 but because APCA one can be negative, we also use a negative value here as it easier to work with, for example in getNewXandYFromContrast().

export type SvgPath = string

export type RgbArray = [RgbElement, RgbElement, RgbElement]
export type RgbaArray = [RgbElement, RgbElement, RgbElement, RgbElement]

// We use enums to get the value when hovering variable that use these types like FigmaEditorType
enum FigmaEditorTypeList {
  'figjam',
  'figma',
  'dev'
}
export type FigmaEditorType = keyof typeof FigmaEditorTypeList

// We use 'rgb' and not 'srgb' because Culori use it like this, even if it's confusing because rgb is a color model, not a space.
enum FileColorProfileList {
  'rgb',
  'p3'
}
export type FileColorProfile = keyof typeof FileColorProfileList

export enum ColorModelList {
  'oklchCss',
  'oklch',
  'okhsl',
  'okhsv'
}
export type CurrentColorModel = keyof typeof ColorModelList

enum ContrastMethodList {
  'apca',
  'wcag'
}
export type CurrentContrastMethod = keyof typeof ContrastMethodList

enum FillOrStrokeList {
  'fill',
  'stroke'
}
export type CurrentFillOrStroke = keyof typeof FillOrStrokeList

enum CurrentBgOrFgList {
  'bg',
  'fg'
}
export type CurrentBgOrFg = keyof typeof CurrentBgOrFgList

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

export type UiMessage = {
  show: boolean
  message: string
}

// Message for UI types

export type MessageForUiTypes = 'syncLocalStorageValues' | 'syncNewShape' | 'displayUiMessage'

export type SyncLocalStorageValuesData = {
  figmaEditorType: FigmaEditorType
  fileColorProfile: FileColorProfile
  isContrastInputOpen: boolean
  lockRelativeChroma: boolean
  currentContrastMethod: CurrentContrastMethod
  lockContrast: boolean
  isColorCodeInputsOpen: boolean
  currentColorModel: CurrentColorModel
}

export type SyncNewShapeData = {
  currentFillOrStroke: CurrentFillOrStroke
  colorsRgba: ColorsRgba
  lockContrast: boolean
  lockRelativeChroma: boolean
}

export type DisplayUiMessageData = {
  uiMessageCode: keyof typeof uiMessageTexts
  nodeType: string | null
}

export type MessageForUiData = SyncLocalStorageValuesData | SyncNewShapeData | DisplayUiMessageData

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
  | 'syncIsContrastInputOpen'
  | 'syncLockRelativeChroma'
  | 'syncCurrentContrastMethod'
  | 'syncLockContrast'
  | 'syncIsColorCodeInputsOpen'

export type UpdateShapeColorData = {
  newColorRgba: ColorRgba
  currentBgOrFg: CurrentBgOrFg
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

export type SyncIsContrastInputOpenData = {
  isContrastInputOpen: boolean
}

export type SyncLockRelativeChromaData = {
  lockRelativeChroma: boolean
}

export type SyncCurrentContrastMethodData = {
  currentContrastMethod: CurrentContrastMethod
}

export type SyncLockContrastData = {
  lockContrast: boolean
}

export type SyncIsColorCodeInputsOpenData = {
  isColorCodeInputsOpen: boolean
}

export type MessageForBackendData =
  | UpdateShapeColorData
  | SyncFileColorProfileData
  | SyncCurrentFillOrStrokeData
  | SyncCurrentColorModelData
  | SyncIsContrastInputOpenData
  | SyncLockRelativeChromaData
  | SyncCurrentContrastMethodData
  | SyncLockContrastData
  | SyncIsColorCodeInputsOpenData

export type MessageForBackend = {
  type: MessageForBackendTypes
  data: MessageForBackendData
}
