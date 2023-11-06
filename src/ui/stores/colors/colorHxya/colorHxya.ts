// We use default values in the atoms but they are not used, because we get these values from backend.
// They are useful however to not use null in their type (although some of them have it when we have to).
// More infos in the comment on top in App component.

import { map, action } from 'nanostores'
import { logger } from '@nanostores/logger'
import { consoleLogInfos } from '../../../../constants'
import { ColorHxya, UpdateShapeColorData, ColorValueDecimals } from '../../../../types'
import convertAbsoluteChromaToRelative from '../../../helpers/colors/convertAbsoluteChromaToRelative/convertAbsoluteChromaToRelative'
import convertHxyToRgb from '../../../helpers/colors/convertHxyToRgb/convertHxyToRgb'
import filterNewColorHxya from '../../../helpers/colors/filterNewColorHxya/filterNewColorHxya'
import sendMessageToBackend from '../../../helpers/sendMessageToBackend/sendMessageToBackend'
import { $currentBgOrFg } from '../../contrasts/currentBgOrFg/currentBgOrFg'
import { $currentFillOrStroke } from '../../currentFillOrStroke/currentFillOrStroke'
import { setColorsRgbaWithSideEffects, $colorsRgba } from '../colorsRgba/colorsRgba'
import { $currentColorModel } from '../currentColorModel/currentColorModel'
import { $fileColorProfile } from '../fileColorProfile/fileColorProfile'
import { $lockRelativeChroma } from '../lockRelativeChroma/lockRelativeChroma'
import { setRelativeChroma } from '../relativeChroma/relativeChroma'

// This map contain the current color being used in the UI, it can be the fill or the stroke of the foreground but also the background (colorsRgba.parentFill) of the current selected object.
export const $colorHxya = map<ColorHxya>({
  h: 0,
  x: 0,
  y: 0,
  a: 0
})

export const setColorHxya = action($colorHxya, 'setColorHxya', (colorHxya, newColorHxya: Partial<ColorHxya>) => {
  const { h, x, y, a } = filterNewColorHxya(newColorHxya, false, false)

  colorHxya.set({
    h: h !== undefined ? h : colorHxya.get().h,
    x: x !== undefined ? x : colorHxya.get().x,
    y: y !== undefined ? y : colorHxya.get().y,
    a: a !== undefined ? a : colorHxya.get().a
  })
})

type Props = {
  newColorHxya: Partial<ColorHxya>
  syncColorsRgba?: boolean
  syncColorRgbWithBackend?: boolean
  syncRelativeChroma?: boolean
  syncContrast?: boolean
  bypassLockRelativeChromaFilter?: boolean
  bypassLockContrastFilter?: boolean
}

/**
 * Side effects (true by default): syncColorsRgba, syncColorRgbWithBackend, syncRelativeChroma, syncContrast.
 * @param bypassLockRelativeChromaFilter False by default, this value says: "update the chroma even if lockRelativeChroma is true". This is useful for example if the user update the relative chroma value from the input while lockRelativeChroma is true, without this bypass value, it wouldn't be possible as relativeChroma and contrast value are updated after colorHxya is updated, so in filterNewColorHxya(), we would still get the old values.
 * @param bypassLockContrastFilter False by default, same reason than bypassLockRelativeChromaFilter, this value says: "update the contrast even if lockChroma is true".
 */
export const setColorHxyaWithSideEffects = action($colorHxya, 'setColorHxyaWithSideEffects', (colorHxya, props: Props) => {
  const {
    newColorHxya,
    syncColorsRgba = true,
    syncColorRgbWithBackend = true,
    syncRelativeChroma = true,
    syncContrast = true,
    bypassLockRelativeChromaFilter = false,
    bypassLockContrastFilter = false
  } = props

  const { h, x, y, a } = filterNewColorHxya(newColorHxya, bypassLockRelativeChromaFilter, bypassLockContrastFilter)

  colorHxya.set({
    h: h !== undefined ? h : colorHxya.get().h,
    x: x !== undefined ? x : colorHxya.get().x,
    y: y !== undefined ? y : colorHxya.get().y,
    a: a !== undefined ? a : colorHxya.get().a
  })

  const chroma = ['oklch', 'oklchCss'].includes($currentColorModel.get()) ? colorHxya.get().x * 100 : colorHxya.get().x
  const newColorRgb = convertHxyToRgb({
    colorHxy: {
      h: colorHxya.get().h,
      x: chroma,
      y: colorHxya.get().y
    },
    originColorModel: $currentColorModel.get(),
    colorSpace: $fileColorProfile.get()
  })

  if (syncColorsRgba) {
    const key = $currentBgOrFg.get() === 'bg' ? 'parentFill' : `${$currentFillOrStroke.get()}`

    setColorsRgbaWithSideEffects({
      newColorsRgba: { ...$colorsRgba.get(), [key]: { ...newColorRgb, a: colorHxya.get().a } },
      syncColorHxya: false,
      syncContrast: syncContrast
    })
  }

  if (syncColorRgbWithBackend) {
    sendMessageToBackend<UpdateShapeColorData>({
      type: 'updateShapeColor',
      data: {
        newColorRgba: { ...newColorRgb, a: colorHxya.get().a },
        currentBgOrFg: $currentBgOrFg.get()
      }
    })
  }

  if (syncRelativeChroma) {
    if (['okhsv', 'okhsl'].includes($currentColorModel.get())) return

    // We don't want to get a new relative chroma value if the lock is on, but we also check if relativeChroma value is not undefined, if that the case we first need to set it.
    // And if lightness is 0 or 100, there is no need to continue either.
    if ($lockRelativeChroma.get() || newColorHxya.y === 0 || newColorHxya.y === 100) return

    setRelativeChroma(
      convertAbsoluteChromaToRelative({
        colorHxy: {
          h: colorHxya.get().h,
          x: colorHxya.get().x,
          y: colorHxya.get().y
        }
      })
    )
  }
})

export const getColorValueDecimals = (): ColorValueDecimals => {
  switch ($currentColorModel.get()) {
    case 'okhsl':
    case 'okhsv':
      return { h: 0, x: 0, y: 0 }
    case 'oklch':
    case 'oklchCss':
      return { h: 1, x: $lockRelativeChroma.get() ? 6 : 3, y: 1 }
    default:
      return { h: 0, x: 0, y: 0 }
  }
}

if (consoleLogInfos.includes('Store updates')) {
  logger({
    colorHxya: $colorHxya
  })
}
