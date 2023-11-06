import { CurrentColorModel } from '../../../types'

type Props = {
  currentColorModel: CurrentColorModel
  isColorCodeInputsOpen: boolean
  isContrastInputOpen: boolean
}

const pluginHeights = {
  okhsvl: {
    colorCodes: 564,
    noColorCodes: 435
  },
  oklch: {
    contrastAndColorCodes: 680,
    contrastAndNoColorCodes: 550,
    noContrastAndColorCodes: 647,
    noContrastAndNoColorCodes: 517
  }
}

export default function getWindowHeigh(props: Props): number {
  const { currentColorModel, isColorCodeInputsOpen, isContrastInputOpen } = props

  if (['okhsv', 'okhsl'].includes(currentColorModel)) {
    if (isColorCodeInputsOpen) {
      return pluginHeights.okhsvl.colorCodes
    } else {
      return pluginHeights.okhsvl.noColorCodes
    }
  } else if (['oklch', 'oklchCss'].includes(currentColorModel)) {
    if (isContrastInputOpen) {
      if (isColorCodeInputsOpen) {
        return pluginHeights.oklch.contrastAndColorCodes
      } else {
        return pluginHeights.oklch.contrastAndNoColorCodes
      }
    } else {
      if (isColorCodeInputsOpen) {
        return pluginHeights.oklch.noContrastAndColorCodes
      } else {
        return pluginHeights.oklch.noContrastAndNoColorCodes
      }
    }
  }

  return pluginHeights.oklch.contrastAndColorCodes
}
