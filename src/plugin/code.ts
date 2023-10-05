/* eslint-disable @typescript-eslint/ban-ts-comment */

import { PICKER_SIZE } from '../constants'
import type { ColorRgba, ColorsRgba, CurrentColorModel, CurrentFillOrStroke, FileColorProfile } from '../types'
import getNewColorsRgba from './helpers/getNewColorsRgba'
import updateShapeColor from './helpers/newColorRgbaFormated'
import sendMessageToUi from './helpers/sendMessageToUi'

let currentFillOrStroke: CurrentFillOrStroke = 'fill'
let fileColorProfile: FileColorProfile
let currentColorModel: CurrentColorModel
let lockRelativeChroma: boolean
let showCssColorCodes: boolean

const pluginHeights = {
  okHsvlWithoutColorCodes: 436,
  okHsvlWithColorCodes: 564,
  okLchWithoutColorCodes: 469,
  okLchWithColorCodes: 598
}

// We use this variable to prevent the triggering of figma.on "documentchange".
let itsAMe = false

let colorsRgba: ColorsRgba = {
  fill: null,
  stroke: null
}

const changePropertiesToReactTo = ['fills', 'fillStyleId', 'strokes', 'strokeWeight']

/**
 * Local helpers
 */

const resizeWindowHeight = () => {
  if (showCssColorCodes) {
    if (['oklch', 'oklchCss'].includes(currentColorModel)) figma.ui.resize(PICKER_SIZE, pluginHeights.okLchWithColorCodes)
    else figma.ui.resize(PICKER_SIZE, pluginHeights.okHsvlWithColorCodes)
  } else {
    if (['oklch', 'oklchCss'].includes(currentColorModel)) figma.ui.resize(PICKER_SIZE, pluginHeights.okLchWithoutColorCodes)
    else figma.ui.resize(PICKER_SIZE, pluginHeights.okHsvlWithoutColorCodes)
  }
}

const updateColorsRgbaOrSendUiMessageCodeToUi = (): string => {
  const result = getNewColorsRgba()

  if (result.uiMessageCode) {
    sendMessageToUi({
      messageType: 'displayUiMessage',
      messageData: {
        uiMessageCode: result.uiMessageCode,
        nodeType: result.nodeType
      }
    })
    return 'uiMessageCode sent'
  } else {
    colorsRgba = JSON.parse(JSON.stringify(result.newColorsRgba))
  }
  return 'colorsRgba updated'
}

/**
 * Init
 */

const getLocalStorageValueAndCreateUiWindow = async () => {
  // We force the fileColorProfile value to sRGB in FigJam because they don't suport P3 yet (https://help.figma.com/hc/en-us/articles/360039825114).
  if (figma.editorType === 'figma') fileColorProfile = (await figma.clientStorage.getAsync('fileColorProfile')) || 'rgb'
  else if (figma.editorType === 'figjam') fileColorProfile = 'rgb'

  currentColorModel = (await figma.clientStorage.getAsync('currentColorModel')) || 'oklchCss'
  lockRelativeChroma = (await figma.clientStorage.getAsync('lockRelativeChroma')) || false
  showCssColorCodes = (await figma.clientStorage.getAsync('showCssColorCodes')) || false

  let initialUiHeight = showCssColorCodes ? pluginHeights.okLchWithColorCodes : pluginHeights.okLchWithoutColorCodes
  if (['okhsv', 'okhsl'].includes(currentColorModel)) {
    initialUiHeight = showCssColorCodes ? pluginHeights.okHsvlWithColorCodes : pluginHeights.okHsvlWithoutColorCodes
  }

  figma.showUI(__html__, { width: PICKER_SIZE, height: initialUiHeight, themeColors: true })
}

getLocalStorageValueAndCreateUiWindow()

// Send the local storage value and the color of the shape on launch, we call it when the UI is ready, see below figma.ui.onmessage
const init = async () => {
  sendMessageToUi({
    messageType: 'init',
    messageData: {
      figmaEditorType: figma.editorType,
      fileColorProfile: fileColorProfile,
      currentColorModel: currentColorModel,
      lockRelativeChroma: lockRelativeChroma,
      showCssColorCodes: showCssColorCodes
    }
  })

  if (updateColorsRgbaOrSendUiMessageCodeToUi() === 'uiMessageCode sent') return
  currentFillOrStroke = colorsRgba.fill ? 'fill' : 'stroke'

  sendMessageToUi({
    messageType: 'newColorsRgba',
    messageData: {
      colorsRgba: colorsRgba,
      currentFillOrStroke: currentFillOrStroke
    }
  })
}

/**
 * Updates from Figma
 */

const handleFigmaOnSelectionChange = () => {
  if (updateColorsRgbaOrSendUiMessageCodeToUi() === 'uiMessageCode sent') return

  currentFillOrStroke = colorsRgba.fill ? 'fill' : 'stroke'

  sendMessageToUi({
    messageType: 'newColorsRgba',
    messageData: {
      colorsRgba: colorsRgba,
      currentFillOrStroke: currentFillOrStroke
    }
  })
}

const handleFigmaOnDocumentChange = (event: DocumentChangeEvent) => {
  if (itsAMe) return
  if (event.documentChanges[0].type !== 'PROPERTY_CHANGE') return

  const changeProperty = event.documentChanges[0].properties[0]

  // We don't run the code if for example the user has changed the rotation of the shape.
  // We take into account "strokeWeight" to handle the case where the user add a stroke but then remove it with cmd+z, that event has for some reasons the changeProperty "strokeWeight" and not "stroke".
  // For "fillStyleId", it's to take into account if user has a shape with a color style and he change it to another or if he uses the eyedropper thus removing the color style.
  if (changePropertiesToReactTo.includes(changeProperty)) {
    // We test if user has added a fill or a stroke to an already selected shape, if yes we need to update the UI and activate the fill/stroke selector accordingly.
    const oldColorsRgba = JSON.parse(JSON.stringify(colorsRgba))

    if (updateColorsRgbaOrSendUiMessageCodeToUi() === 'uiMessageCode sent') return

    if (JSON.stringify(oldColorsRgba) !== JSON.stringify(colorsRgba)) {
      if (currentFillOrStroke === 'fill' && !colorsRgba.fill) {
        currentFillOrStroke = 'stroke'
      } else if (currentFillOrStroke === 'stroke' && !colorsRgba.stroke) {
        currentFillOrStroke = 'fill'
      }
    }

    sendMessageToUi({
      messageType: 'newColorsRgba',
      messageData: {
        colorsRgba: colorsRgba,
        currentFillOrStroke: currentFillOrStroke
      }
    })
  }
}

// If user change shape selection.
figma.on('selectionchange', handleFigmaOnSelectionChange)

// If user change property of selected shape.
figma.on('documentchange', handleFigmaOnDocumentChange)

figma.on('close', () => {
  figma.off('selectionchange', handleFigmaOnSelectionChange)
  figma.off('documentchange', handleFigmaOnDocumentChange)
})

/**
 * Updates from UI
 */

let timeoutId: number

interface OnMessageEvent {
  message: string
  newColorRgba?: ColorRgba
  fileColorProfile?: FileColorProfile
  currentFillOrStroke?: CurrentFillOrStroke
  currentColorModel?: CurrentColorModel
  showCssColorCodes?: boolean
  lockRelativeChroma?: boolean
}

figma.ui.onmessage = (event: OnMessageEvent) => {
  switch (event.message) {
    case 'init':
      // We wait the UI is fully loaded before sending the init infos back to the UI, see the useEffect on the UI code.
      init()
      break

    case 'updateShapeColor':
      itsAMe = true
      updateShapeColor(event.newColorRgba!, currentFillOrStroke)

      // We reset itsAMe value to false here because if we do it on the documentchange callback, when we move the hue cursor on FFFFFF or 000000 in OkHSL, this callback is not executed so itsAMe would stay on true and if for example user delete the fill of the shape we would get an error.
      if (timeoutId) clearTimeout(timeoutId)

      timeoutId = setTimeout(() => {
        itsAMe = false
      }, 500)
      break

    case 'syncFileColorProfile':
      figma.clientStorage.setAsync('fileColorProfile', event.fileColorProfile)
      break

    case 'syncCurrentFillOrStroke':
      currentFillOrStroke = event.currentFillOrStroke!
      break

    case 'syncCurrentColorModel':
      currentColorModel = event.currentColorModel!
      resizeWindowHeight()
      figma.clientStorage.setAsync('currentColorModel', event.currentColorModel)
      break

    case 'syncShowCssColorCodes':
      showCssColorCodes = event.showCssColorCodes!
      resizeWindowHeight()
      figma.clientStorage.setAsync('showCssColorCodes', showCssColorCodes)
      break

    case 'syncLockRelativeChromaWithPlugin':
      figma.clientStorage.setAsync('lockRelativeChroma', event.lockRelativeChroma)
      break
  }
}
