import { deepMap, atom, computed, map, action } from 'nanostores'
import type {
  FileColorProfile,
  CurrentColorModel,
  ColorsRgba,
  FigmaEditorType,
  ColorHxya,
  CurrentKeysPressed,
  CurrentFillOrStroke,
  ColorValueDecimals,
  UpdateShapeColorData,
  ApcaContrast,
  RelativeChroma,
  CurrentContrastMethod,
  CurrentBgOrFg,
  WcagContrast
} from '../types'
import convertHxyToRgb from './helpers/convertHxyToRgb'
import convertAbsoluteChromaToRelative from './helpers/convertAbsoluteChromaToRelative'
import { consoleLogInfos } from '../constants'

import getContrastFromBgandFgRgba from './helpers/getContrastFromBgandFgRgba'
import filterNewColorHxya from './helpers/filterNewColorHxya'
import sendMessageToBackend from './helpers/sendMessageToBackend'

export const $uiMessage = map({
  show: false,
  message: ''
})

// We use default values in the atoms but they are not used, because we get these values from backend.
// They are useful however to not use null in their type (although some of them have it when we have to).
// More infos in the comment on top in App component.
export const $figmaEditorType = atom<FigmaEditorType | null>(null)
export const $fileColorProfile = atom<FileColorProfile>('rgb')
export const $currentColorModel = atom<CurrentColorModel>('oklchCss')
export const $currentFillOrStroke = atom<CurrentFillOrStroke>('fill')
export const $currentKeysPressed = atom<CurrentKeysPressed>([''])
export const $isMouseInsideDocument = atom(false)
export const $mouseEventCallback = atom<((event: MouseEvent) => void) | null>(null)
export const $relativeChroma = atom<RelativeChroma>(0)
export const $lockRelativeChroma = atom(false)
export const $isContrastInputOpen = atom(false)
export const $currentBgOrFg = atom<CurrentBgOrFg>('fg')
export const $currentContrastMethod = atom<CurrentContrastMethod>('apca')
export const $contrast = atom<ApcaContrast | WcagContrast | null>(null)
export const $lockContrast = atom(false)
export const $isColorCodeInputsOpen = atom(false)

export const $lockContrastStartY = atom<number | null>(null)
export const $lockContrastEndY = atom<number | null>(null)

export const $colorsRgba = deepMap<ColorsRgba>({
  parentFill: null,
  fill: {
    r: 0,
    g: 0,
    b: 0,
    a: 0
  },
  stroke: null
})

// This map contain the current color being used in the UI, it can be the fill or the stroke of the foreground but also the background (colorsRgba.parentFill) of the current selected object.
export const $colorHxya = map<ColorHxya>({
  h: 0,
  x: 0,
  y: 0,
  a: 0
})

type UpdateColorHxyaAndSyncColorsRgbaAndBackend = {
  newColorHxya: Partial<ColorHxya>
  syncColorsRgba?: boolean
  syncColorRgbWithBackend?: boolean
  bypassLockRelativeChromaFilter?: boolean
  bypassLockContrastFilter?: boolean
}

/**
 * @param bypassLockRelativeChromaFilter False by default, this value says: "update the chroma even if lockRelativeChroma is true". This is useful for example if the user update the relative chroma value from the input while lockRelativeChroma is true, without this bypass value, it wouldn't be possible as relativeChroma and contrast value are updated after colorHxya is updated, so in filterNewColorHxya(), we would still get the old values.
 * @param bypassLockContrastFilter Same reason than bypassLockRelativeChromaFilter, this value says: "update the contrast even if lockChroma is true".
 */

export const updateColorHxyaAndSyncColorsRgbaAndBackend = action(
  $colorHxya,
  'updateColorHxy',
  (colorHxya, props: UpdateColorHxyaAndSyncColorsRgbaAndBackend) => {
    const {
      newColorHxya,
      syncColorsRgba = true,
      syncColorRgbWithBackend = true,
      bypassLockRelativeChromaFilter = false,
      bypassLockContrastFilter = false
    } = props

    if (consoleLogInfos.includes('Store updates')) {
      console.log('Store update — updateColorHxya')
      console.log(`    newColorHxya: ${JSON.stringify(newColorHxya)}`)
    }

    const { h, x, y, a } = filterNewColorHxya(newColorHxya, bypassLockRelativeChromaFilter, bypassLockContrastFilter)

    colorHxya.set({
      h: h !== undefined ? h : colorHxya.get().h,
      x: x !== undefined ? x : colorHxya.get().x,
      y: y !== undefined ? y : colorHxya.get().y,
      a: a !== undefined ? a : colorHxya.get().a
    })

    if (!syncColorsRgba && !syncColorRgbWithBackend) return

    const chroma = ['oklch', 'oklchCss'].includes($currentColorModel.get()) ? colorHxya.get().x * 100 : colorHxya.get().x
    const newColorRgb = convertHxyToRgb({
      colorHxy: {
        h: colorHxya.get().h,
        x: chroma,
        y: colorHxya.get().y
      },
      originColorModel: $currentColorModel.get(),
      fileColorProfile: $fileColorProfile.get()
    })

    if (syncColorsRgba) {
      const key = $currentBgOrFg.get() === 'bg' ? 'parentFill' : `${$currentFillOrStroke.get()}`

      $colorsRgba.setKey(key, { ...newColorRgb, a: colorHxya.get().a })
    }

    if (syncColorRgbWithBackend) {
      sendMessageToBackend<UpdateShapeColorData>({
        type: 'updateShapeColor',
        data: {
          newColorRgba: { ...newColorRgb, a: $colorHxya.get().a },
          currentBgOrFg: $currentBgOrFg.get()
        }
      })
    }
  }
)

// Update $relativeChroma when $colorHxya changes.
// We don't use computed() to calculate $relativeChroma because we need to update from other places.
$colorHxya.subscribe((newColorHxya) => {
  if (['okhsv', 'okhsl'].includes($currentColorModel.get())) return

  if (consoleLogInfos.includes('Store updates')) {
    console.log('Store update — $relativeChroma (subscribed on $colorHxya)')
    console.log(`    newColorHxya: ${JSON.stringify(newColorHxya)}`)
  }

  // We don't want to get a new relative chroma value if the lock is on, but we also check if relativeChroma value is not undefined, if that the case we first need to set it.
  // And if lightness is 0 or 100, there is no need to continue either.
  if ($lockRelativeChroma.get() && $relativeChroma.get() && (newColorHxya.y === 0 || newColorHxya.y === 100)) return

  $relativeChroma.set(convertAbsoluteChromaToRelative({ h: newColorHxya.h, x: newColorHxya.x, y: newColorHxya.y }))
})

// Update $contrast when $colorsRgba changes.
// We don't use computed() to calculate $contrast because we need to update from other places.
$colorsRgba.subscribe((newColorsRgba) => {
  if (['okhsv', 'okhsl'].includes($currentColorModel.get())) return

  if (consoleLogInfos.includes('Store updates')) {
    console.log('Store update — $contrast (subscribed on $colorsRgba)')
    console.log(`    newColorHxya: ${JSON.stringify(newColorsRgba)}`)
  }

  if (!newColorsRgba.parentFill || !newColorsRgba.fill || ($lockContrast.get() && $contrast.get() !== null)) return

  let newContrast: ApcaContrast | WcagContrast | null = null

  newContrast = getContrastFromBgandFgRgba(newColorsRgba.fill!, newColorsRgba.parentFill!)

  if (newContrast !== null) $contrast.set(newContrast)
})

export const $colorValueDecimals = computed(
  [$currentColorModel, $lockRelativeChroma],
  (currentColorModel, lockRelativeChroma): ColorValueDecimals => {
    if (consoleLogInfos.includes('Store updates')) {
      console.log('Store update — $colorValueDecimals (computed from $currentColorModel or $lockRelativeChroma)')
      console.log(`    currentColorModel: ${currentColorModel}`)
      console.log(`    lockRelativeChroma: ${lockRelativeChroma}`)
    }

    switch (currentColorModel) {
      case 'okhsl':
      case 'okhsv':
        return { h: 0, x: 0, y: 0 }
      case 'oklch':
      case 'oklchCss':
        return { h: 1, x: lockRelativeChroma ? 6 : 3, y: 1 }
      default:
        return { h: 0, x: 0, y: 0 }
    }
  }
)
