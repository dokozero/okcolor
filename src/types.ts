import { uiMessageTexts } from './ui/ui-messages'

// this value contain the id of the current select shape in the editor, this is useful for example in ColorPicker, as we render the color picker when the hue changes, if the user launches the plugin with no selection then select a shape with pure black or white, the hue will stay the same and thus, color picker will be empty, so tou fix this, we also react to the selectionId (see its store) to update whenever the user select a new shape.
export type SelectionId = string

export enum OklchInputOrderList {
  'lch',
  'hcl'
}

export type OklchHlDecimalPrecisionRange = 1 | 2

export type UserSettings = {
  oklchHlDecimalPrecision: OklchHlDecimalPrecisionRange
  useSimplifiedChroma: boolean
  oklchInputOrder: keyof typeof OklchInputOrderList
  useHardwareAcceleration: boolean
}

export type RgbElement = number // 0 - 1 with no limitation on the number of decimals.

export type Hue = number // 0 - 360
export type AbsoluteChroma = number // 0 - MAX_CHROMA_P3
export type RelativeChroma = number // 0 - 100
export type Saturation = number // 0 - 100
export type Lightness = number // 0 - 100
export type Opacity = number // 0 - 1 with 2 decimal precision (eg. 0.75).

export type AbsoluteChromaOklchInput = number // 0 - MAX_CHROMA_P3 * 100
export type OpacityInput = number // 0 - 100

export type HxyaTypes = Hue | AbsoluteChroma | Saturation | Lightness | Opacity
export type HxyaInputTypes = Hue | AbsoluteChroma | AbsoluteChromaOklchInput | Saturation | Lightness | OpacityInput

export type ApcaContrast = number // -108 - 106
export type WcagContrast = number // -21 - 21, normally WCAG contrast is between 0 and 21 but because APCA one can be negative, we also use a negative value here as it is easier to work with, for example in getNewXandYFromContrast() and also forthe user when he enter a value in the contrast input as without this distinction, if he enter a value like "14", in many cases, this can mean two colors (two different lightness with a given hue and chroma).

export type SvgPath = string

export type RgbArray = [RgbElement, RgbElement, RgbElement]
export type RgbaArray = [RgbElement, RgbElement, RgbElement, Opacity]

// We use enums to get the value when hovering variable that use these types like FigmaEditorType
enum FigmaEditorTypeList {
  'figjam',
  'figma',
  'dev',
  'slides'
}
export type FigmaEditorType = keyof typeof FigmaEditorTypeList

// We use 'rgb' and not 'srgb' because Culori use it like this, even if it's confusing because rgb is a color model, not a gamut.
enum FileColorProfileList {
  'rgb',
  'p3'
}
export type CurrentFileColorProfile = keyof typeof FileColorProfileList

export enum ColorModelList {
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

export enum OklchRenderModeList {
  'triangle',
  'square'
}

export type OklchRenderMode = 'triangle' | 'square'

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
  a: Opacity
}

// We use "Hxy" and not "Lch" as this value can hold okhsv, okhsl and oklch values, between these three models, only the "h" is shared, for the two other we use these more generic "xy" letters.
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

type KeysPressed = 'shift' | ''

export type CurrentKeysPressed = KeysPressed[]

export type ColorHxyDecimals = {
  [key: string]: number
  h: number
  x: number
  y: number
}

export type ContrastRange = {
  negative: {
    min: ApcaContrast | WcagContrast
    max: ApcaContrast | WcagContrast
  }
  positive: {
    min: ApcaContrast | WcagContrast
    max: ApcaContrast | WcagContrast
  }
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
  newFigmaEditorType: FigmaEditorType
  newUserSettings: UserSettings
  newCurrentFileColorProfile: CurrentFileColorProfile
  newIsContrastInputOpen: boolean
  newLockRelativeChroma: boolean
  newCurrentContrastMethod: CurrentContrastMethod
  newLockContrast: boolean
  newIsColorCodeInputsOpen: boolean
  newCurrentColorModel: CurrentColorModel
  newOklchRenderMode: OklchRenderMode
}

export type SyncNewShapeData = {
  selectionId: SelectionId
  newCurrentFillOrStroke: CurrentFillOrStroke
  newColorsRgba: ColorsRgba
  newLockContrast: boolean
  newLockRelativeChroma: boolean
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
  | 'SyncUserSettings'
  | 'syncCurrentFillOrStroke'
  | 'syncCurrentColorModel'
  | 'syncIsContrastInputOpen'
  | 'syncLockRelativeChroma'
  | 'syncCurrentContrastMethod'
  | 'syncLockContrast'
  | 'syncIsColorCodeInputsOpen'
  | 'syncOklchRenderMode'

export type UpdateShapeColorData = {
  newColorRgba: ColorRgba
  newCurrentBgOrFg: CurrentBgOrFg
}

export type SyncUserSettingsData = {
  newUserSettings: UserSettings
}

export type SyncCurrentFillOrStrokeData = {
  newCurrentFillOrStroke: CurrentFillOrStroke
}

export type SyncCurrentColorModelData = {
  newCurrentColorModel: CurrentColorModel
}

export type SyncIsContrastInputOpenData = {
  newIsContrastInputOpen: boolean
}

export type SyncLockRelativeChromaData = {
  newLockRelativeChroma: boolean
}

export type SyncCurrentContrastMethodData = {
  newCurrentContrastMethod: CurrentContrastMethod
}

export type SyncLockContrastData = {
  newLockContrast: boolean
}

export type SyncIsColorCodeInputsOpenData = {
  newIsColorCodeInputsOpen: boolean
}

export type SyncOklchRenderModeData = {
  newOklchRenderMode: OklchRenderMode
}

export type MessageForBackendData =
  | UpdateShapeColorData
  | SyncUserSettingsData
  | SyncCurrentFillOrStrokeData
  | SyncCurrentColorModelData
  | SyncIsContrastInputOpenData
  | SyncLockRelativeChromaData
  | SyncCurrentContrastMethodData
  | SyncLockContrastData
  | SyncIsColorCodeInputsOpenData
  | SyncOklchRenderModeData

export type MessageForBackend = {
  type: MessageForBackendTypes
  data: MessageForBackendData
}
