import { deepMap, atom, computed, map, action } from 'nanostores'
import type {
  FileColorProfile,
  CurrentColorModel,
  ColorsRgba,
  FigmaEditorType,
  ColorHxya,
  CurrentKeysPressed,
  CurrentFillOrStroke,
  PartialColorHxya,
  ColorValueDecimals
} from '../types'
import convertRgbToHxy from './helpers/convertRgbToHxy'
import convertHxyToRgb from './helpers/convertHxyToRgb'
import convertAbsoluteChromaToRelative from './helpers/convertAbsoluteChromaToRelative'
import { consoleLogInfos } from '../constants'

import getContrastFromBgandFgRgba from './helpers/getContrastFromBgandFgRgba'
import filterNewColorHxya from './helpers/filterNewColorHxya'

export const $uiMessage = map({
  show: false,
  message: ''
})

export const $figmaEditorType = atom<FigmaEditorType | null>(null)
export const $fileColorProfile = atom<FileColorProfile | null>(null)
export const $currentColorModel = atom<CurrentColorModel | null>(null)
export const $currentFillOrStroke = atom<CurrentFillOrStroke>('fill')
export const $showCssColorCodes = atom(true)
export const $currentKeysPressed = atom<CurrentKeysPressed>([''])
export const $isMouseInsideDocument = atom(false)
export const $mouseEventCallback = atom<((event: MouseEvent) => void) | null>(null)
export const $relativeChroma = atom<number | null>(null)
export const $lockRelativeChroma = atom<boolean | null>(null)
export const $updateParent = atom(false)
export const $contrast = atom<number | null>(null)
export const $lockContrast = atom<boolean | null>(null)

export const $colorsRgba = deepMap<ColorsRgba>({
  parentFill: null,
  fill: {
    r: 255,
    g: 255,
    b: 255,
    a: 0
  },
  stroke: {
    r: 255,
    g: 255,
    b: 255,
    a: 0
  }
})

export const updateColorsRgbaAndSyncColorHxya = action(
  $colorsRgba,
  'updateColorsRgba',
  (colorsRgba, newColorsRgba: ColorsRgba, keepOklchCssDoubleDigit: boolean = false) => {
    if (consoleLogInfos.includes('Store updates')) {
      console.log('Store update — updateColorsRgba')
      console.log(`    newColorsRgba: ${JSON.stringify(newColorsRgba)}`)
      console.log(`    keepOklchCssDoubleDigit: ${keepOklchCssDoubleDigit}`)
    }

    colorsRgba.set(newColorsRgba)

    const newColorRgba = newColorsRgba[`${$currentFillOrStroke.get()}`]

    const newColorHxy = convertRgbToHxy({
      colorRgb: {
        r: newColorRgba!.r,
        g: newColorRgba!.g,
        b: newColorRgba!.b
      },
      targetColorModel: $currentColorModel.get()!,
      fileColorProfile: $fileColorProfile.get()!,
      keepOklchCssDoubleDigit: keepOklchCssDoubleDigit
    })

    $colorHxya.set({
      h: newColorHxy.h,
      x: newColorHxy.x,
      y: newColorHxy.y,
      a: newColorRgba!.a
    })
  }
)

// This map contain the current color being used in the UI, it can be the fill or the stroke of the foreground but also the background (colorsRgba.parentFill) of the current selected object.
export const $colorHxya = map<ColorHxya>({
  h: null,
  x: 0,
  y: 0,
  a: 0
})

interface UpdateColorHxyaAndSyncColorsRgbaAndPlugin {
  newColorHxya: PartialColorHxya
  syncColorsRgba?: boolean
  syncColorRgbWithPlugin?: boolean
  bypassLockRelativeChromaFilter?: boolean
  bypassLockContrastFilter?: boolean
}

/**
 * @param bypassLockRelativeChromaFilter False by default, this value says: "update the chroma even if lockRelativeChroma is true". This is useful for example if the user update the relative chroma value from the input while lockRelativeChroma is true, without this bypass value, it wouldn't be possible as relativeChroma and contrast value are updated after colorHxya is updated, so in filterNewColorHxya(), we would still get the old values.
 * @param bypassLockContrastFilter Same reason than bypassLockRelativeChromaFilter, this value says: "update the contrast even if lockChroma is true".
 */

export const updateColorHxyaAndSyncColorsRgbaAndPlugin = action(
  $colorHxya,
  'updateColorHxy',
  (colorHxya, props: UpdateColorHxyaAndSyncColorsRgbaAndPlugin) => {
    const {
      newColorHxya,
      syncColorsRgba = true,
      syncColorRgbWithPlugin = true,
      bypassLockRelativeChromaFilter = false,
      bypassLockContrastFilter = false
    } = props

    if (consoleLogInfos.includes('Store updates')) {
      console.log('Store update — updateColorHxya')
      console.log(`    newColorHxya: ${JSON.stringify(newColorHxya)}`)
    }

    const { h, x, y, a } = filterNewColorHxya(
      {
        h: newColorHxya.h !== undefined ? newColorHxya.h : $colorHxya.get().h!,
        x: newColorHxya.x !== undefined ? newColorHxya.x : $colorHxya.get().x,
        y: newColorHxya.y !== undefined ? newColorHxya.y : $colorHxya.get().y,
        a: newColorHxya.a !== undefined ? newColorHxya.a : $colorHxya.get().a
      },
      bypassLockRelativeChromaFilter,
      bypassLockContrastFilter
    )

    colorHxya.set({
      h: h !== undefined ? h : colorHxya.get().h,
      x: x !== undefined ? x : colorHxya.get().x,
      y: y !== undefined ? y : colorHxya.get().y,
      a: a !== undefined ? a : colorHxya.get().a
    })

    if (!syncColorsRgba && !syncColorRgbWithPlugin) return

    const chroma = ['oklch', 'oklchCss'].includes($currentColorModel.get()!) ? colorHxya.get().x * 100 : colorHxya.get().x
    const newColorRgb = convertHxyToRgb({
      colorHxy: {
        h: colorHxya.get().h!,
        x: chroma,
        y: colorHxya.get().y
      },
      originColorModel: $currentColorModel.get()!,
      fileColorProfile: $fileColorProfile.get()!
    })

    if (syncColorsRgba) {
      const key = $updateParent.get() ? 'parentFill' : `${$currentFillOrStroke.get()}`

      $colorsRgba.setKey(key, { ...newColorRgb, a: colorHxya.get().a })
    }

    if (syncColorRgbWithPlugin) {
      parent.postMessage(
        {
          pluginMessage: {
            message: 'updateShapeColor',
            newColorRgba: { ...newColorRgb, a: $colorHxya.get().a },
            updateParent: $updateParent.get()
          }
        },
        '*'
      )
    }
  }
)

// Update $relativeChroma when $colorHxya changes.
// We don't use computed() to calculate $relativeChroma because we need to update from other places.
$colorHxya.subscribe((newColorHxya) => {
  if (['okhsv', 'okhsl'].includes($currentColorModel.get()!)) return

  if (consoleLogInfos.includes('Store updates')) {
    console.log('Store update — $relativeChroma (subscribed on $colorHxya)')
    console.log(`    newColorHxya: ${JSON.stringify(newColorHxya)}`)
  }

  if (newColorHxya.h === null) return

  // We don't want to get a new relative chroma value if the lock is on, but we also check if relativeChroma value is not undefined, if that the case we first need to set it.
  // And if lightness is 0 or 100, there is no need to continue either.
  if ($lockRelativeChroma.get() && $relativeChroma.get() && (newColorHxya.y === 0 || newColorHxya.y === 100)) return

  $relativeChroma.set(convertAbsoluteChromaToRelative({ h: newColorHxya.h, x: newColorHxya.x, y: newColorHxya.y }))
})

// Update $contrast when $colorsRgba changes.
// We don't use computed() to calculate $contrast because we need to update from other places.
$colorsRgba.subscribe((newColorsRgba) => {
  if (['okhsv', 'okhsl'].includes($currentColorModel.get()!)) return

  if (consoleLogInfos.includes('Store updates')) {
    console.log('Store update — $contrast (subscribed on $colorsRgba)')
    console.log(`    newColorHxya: ${JSON.stringify(newColorsRgba)}`)
  }

  if (!newColorsRgba.parentFill) {
    $contrast.set(null)
    return
  }

  let newContrast: number | null = null

  newContrast = getContrastFromBgandFgRgba(newColorsRgba.parentFill!, newColorsRgba.fill!)

  if (newContrast !== null) {
    newContrast = Math.round(newContrast)

    $contrast.set(newContrast)
  }
})

export const $colorValueDecimals = computed(
  [$currentColorModel, $lockRelativeChroma],
  (currentColorModel, lockRelativeChroma): ColorValueDecimals | undefined => {
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
        return
    }
  }
)
