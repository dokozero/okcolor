import { useRef, useEffect } from 'react'
import {
  $currentColorModel,
  $uiMessage,
  $colorsRgba,
  $currentFillOrStroke,
  $fileColorProfile,
  $currentBgOrFg,
  updateColorHxyaAndSyncColorsRgbaAndBackend,
  $colorHxya
} from '../../../store'
import { ApcaContrast, ColorRgb, ColorRgba, Lightness, Opacity, WcagContrast } from '../../../../types'
import convertRgbToHxy from '../../../helpers/convertRgbToHxy'
import { useStore } from '@nanostores/react'
import { consoleLogInfos } from '../../../../constants'
import getContrastFromBgandFgRgba from '../../../helpers/getContrastFromBgandFgRgba'
import convertHxyToRgb from '../../../helpers/convertHxyToRgb'

export default function BgFgToggle() {
  if (consoleLogInfos.includes('Component renders')) {
    console.log('Component render — BgFgToggle')
  }

  const bgFgToggle = useRef<HTMLDivElement>(null)
  const bgToggle = useRef<HTMLDivElement>(null)
  const fgToggle = useRef<HTMLDivElement>(null)
  const bgToggleText = useRef<HTMLDivElement>(null)
  const fgToggleText = useRef<HTMLDivElement>(null)

  const colorsRgba = useStore($colorsRgba)
  const colorHxya = useStore($colorHxya)
  const currentColorModel = useStore($currentColorModel)
  const currentBgOrFg = useStore($currentBgOrFg)

  const handleBgFgToggle = () => {
    if ($currentBgOrFg.get() === 'bg') $currentBgOrFg.set('fg')
    else $currentBgOrFg.set('bg')

    let newColorRgba: ColorRgb | ColorRgba
    let opacity: Opacity = 100

    if ($currentBgOrFg.get() === 'bg') {
      newColorRgba = $colorsRgba.get().parentFill!
    } else {
      newColorRgba = $colorsRgba.get().fill!
      opacity = $colorsRgba.get().fill!.a
    }

    const newColorHxy = convertRgbToHxy({
      colorRgb: {
        r: newColorRgba.r,
        g: newColorRgba.g,
        b: newColorRgba.b
      },
      targetColorModel: $currentColorModel.get(),
      fileColorProfile: $fileColorProfile.get()
    })

    updateColorHxyaAndSyncColorsRgbaAndBackend({
      newColorHxya: { ...newColorHxy, a: opacity },
      syncColorsRgba: false,
      syncColorRgbWithBackend: false,
      bypassLockRelativeChromaFilter: true,
      bypassLockContrastFilter: true
    })
  }

  useEffect(() => {
    if (['okhsv', 'okhsl'].includes(currentColorModel)) return

    if (!colorsRgba.parentFill || !colorsRgba.fill) {
      bgFgToggle.current!.style.background = 'none'
      return
    }

    bgToggle.current!.style.background = `rgb(${colorsRgba.parentFill.r}, ${colorsRgba.parentFill.g}, ${colorsRgba.parentFill.b})`
    fgToggle.current!.style.background = `rgb(${colorsRgba.fill.r}, ${colorsRgba.fill.g}, ${colorsRgba.fill.b})`

    let whiteTextContrast: ApcaContrast | WcagContrast
    let blackTextContrast: ApcaContrast | WcagContrast

    // Define color of Bg toggle label
    whiteTextContrast = getContrastFromBgandFgRgba({ r: 255, g: 255, b: 255, a: 100 }, colorsRgba.parentFill)
    blackTextContrast = getContrastFromBgandFgRgba({ r: 0, g: 0, b: 0, a: 100 }, colorsRgba.parentFill)

    if (Math.abs(whiteTextContrast) > Math.abs(blackTextContrast)) bgToggleText.current!.style.color = '#FFFFFF'
    else bgToggleText.current!.style.color = '#000000'

    // Define color of Fg toggle label
    whiteTextContrast = getContrastFromBgandFgRgba({ r: 255, g: 255, b: 255, a: 100 }, colorsRgba.fill)
    blackTextContrast = getContrastFromBgandFgRgba({ r: 0, g: 0, b: 0, a: 100 }, colorsRgba.fill)

    if (Math.abs(whiteTextContrast) > Math.abs(blackTextContrast)) fgToggleText.current!.style.color = '#FFFFFF'
    else fgToggleText.current!.style.color = '#000000'
  }, [colorsRgba, currentColorModel])

  useEffect(() => {
    let outlineLightness: Lightness = 80

    if (document.documentElement.classList.contains('figma-dark')) {
      outlineLightness = 50
    }

    const toggleOutlineColor = convertHxyToRgb({
      colorHxy: {
        h: $colorHxya.get().h,
        x: $currentColorModel.get() === 'oklchCss' ? $colorHxya.get().x * 100 : $colorHxya.get().x,
        y: outlineLightness
      },
      originColorModel: $currentColorModel.get(),
      fileColorProfile: $fileColorProfile.get()
    })

    if (currentBgOrFg === 'bg') {
      fgToggle.current!.style.outlineColor = 'transparent'
      bgToggle.current!.style.outlineColor = `rgb(${toggleOutlineColor.r}, ${toggleOutlineColor.g}, ${toggleOutlineColor.b})`
    } else {
      bgToggle.current!.style.outlineColor = 'transparent'
      fgToggle.current!.style.outlineColor = `rgb(${toggleOutlineColor.r}, ${toggleOutlineColor.g}, ${toggleOutlineColor.b})`
    }
  }, [currentBgOrFg, colorHxya])

  useEffect(() => {
    document.addEventListener('keydown', (event) => {
      if (!['oklch', 'oklchCss'].includes($currentColorModel.get())) return
      // We test if document.activeElement?.tagName is an input because we don't want to trigger this code if user type "c" while he's in one of them.
      if ($uiMessage.get().show || document.activeElement?.tagName === 'INPUT') return
      if (!$colorsRgba.get().parentFill || !$colorsRgba.get().fill || $currentFillOrStroke.get() === 'stroke') return

      if (['b', 'B', 'f', 'F'].includes(event.key)) handleBgFgToggle()
    })
  }, [])

  return (
    <div
      ref={bgFgToggle}
      className={'c-bg-fg-toggle u-ml-auto ' + (!colorsRgba.parentFill || !colorsRgba.fill ? 'u-visibility-hidden' : '')}
      onClick={handleBgFgToggle}
    >
      <div ref={bgToggle} className="c-bg-fg-toggle__element">
        <div
          ref={bgToggleText}
          className={'c-bg-fg-toggle__element-label' + (currentBgOrFg === 'bg' ? ' c-bg-fg-toggle__element-label--active' : '')}
        >
          Bg
        </div>
      </div>

      <div ref={fgToggle} className="c-bg-fg-toggle__element">
        <div
          ref={fgToggleText}
          className={'c-bg-fg-toggle__element-label' + (currentBgOrFg === 'fg' ? ' c-bg-fg-toggle__element-label--active' : '')}
        >
          Fg
        </div>
      </div>
    </div>
  )
}
