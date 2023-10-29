/* eslint-disable @typescript-eslint/ban-ts-comment */

import { PICKER_SIZE } from '../constants'
import type {
  ColorsRgba,
  CurrentColorModel,
  CurrentFillOrStroke,
  DisplayUiMessageData,
  FileColorProfile,
  MessageForBackend,
  MessageForBackendData,
  SyncCurrentColorModelData,
  SyncCurrentFillOrStrokeAndColorsRgbaData,
  SyncCurrentFillOrStrokeData,
  SyncFileColorProfileData,
  SyncLocalStorageValuesData,
  SyncLockContrastData,
  SyncLockRelativeChromaData,
  SyncShowCssColorCodesData,
  UpdateShapeColorData
} from '../types'
import getNewColorsRgba from './helpers/getNewColorsRgba'
import sendMessageToUi from './helpers/sendMessageToUi'
import updateShapeColor from './helpers/updateShapeColor'

let currentFillOrStroke: CurrentFillOrStroke = 'fill'
let fileColorProfile: FileColorProfile
let currentColorModel: CurrentColorModel
let showCssColorCodes: boolean
let lockRelativeChroma: boolean
let lockContrast: boolean

const pluginHeights = {
  okHsvlWithoutColorCodes: 435,
  okHsvlWithColorCodes: 564,
  okLchWithoutColorCodes: 503,
  okLchWithColorCodes: 632
}

// We use this variable to prevent the triggering of figma.on "documentchange".
let itsAMe = false

let colorsRgba: ColorsRgba = {
  parentFill: null,
  fill: null,
  stroke: null
}

const changePropertiesToReactTo = ['fills', 'fillStyleId', 'strokes', 'strokeStyleId', 'strokeWeight', 'textStyleId']

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
    sendMessageToUi<DisplayUiMessageData>({
      type: 'displayUiMessage',
      data: {
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
  showCssColorCodes = (await figma.clientStorage.getAsync('showCssColorCodes')) || false

  if (currentColorModel === 'okhsv' || currentColorModel === 'okhsl') {
    lockRelativeChroma = false
    lockContrast = false
  } else {
    lockRelativeChroma = (await figma.clientStorage.getAsync('lockRelativeChroma')) || false
    lockContrast = (await figma.clientStorage.getAsync('lockContrast')) || false
  }

  let initialUiHeight = showCssColorCodes ? pluginHeights.okLchWithColorCodes : pluginHeights.okLchWithoutColorCodes
  if (['okhsv', 'okhsl'].includes(currentColorModel)) {
    initialUiHeight = showCssColorCodes ? pluginHeights.okHsvlWithColorCodes : pluginHeights.okHsvlWithoutColorCodes
  }

  figma.showUI(__html__, { width: PICKER_SIZE, height: initialUiHeight, themeColors: true })
}

getLocalStorageValueAndCreateUiWindow()

// Send the local storage value and the color of the shape on launch, we call it when the UI is ready, see below figma.ui.onmessage
const init = async () => {
  sendMessageToUi<SyncLocalStorageValuesData>({
    type: 'syncLocalStorageValues',
    data: {
      figmaEditorType: figma.editorType,
      fileColorProfile: fileColorProfile,
      currentColorModel: currentColorModel,
      showCssColorCodes: showCssColorCodes,
      lockRelativeChroma: lockRelativeChroma,
      lockContrast: lockContrast
    }
  })

  if (updateColorsRgbaOrSendUiMessageCodeToUi() === 'uiMessageCode sent') return
  currentFillOrStroke = colorsRgba.fill ? 'fill' : 'stroke'

  sendMessageToUi<SyncCurrentFillOrStrokeAndColorsRgbaData>({
    type: 'syncCurrentFillOrStrokeAndColorsRgba',
    data: {
      currentFillOrStroke: currentFillOrStroke,
      colorsRgba: colorsRgba
    }
  })
}

/**
 * Updates from Figma
 */

const handleFigmaOnSelectionChange = () => {
  if (updateColorsRgbaOrSendUiMessageCodeToUi() === 'uiMessageCode sent') return

  currentFillOrStroke = colorsRgba.fill ? 'fill' : 'stroke'

  sendMessageToUi<SyncCurrentFillOrStrokeAndColorsRgbaData>({
    type: 'syncCurrentFillOrStrokeAndColorsRgba',
    data: {
      currentFillOrStroke: currentFillOrStroke,
      colorsRgba: colorsRgba
    }
  })
}

const handleFigmaOnDocumentChange = (event: DocumentChangeEvent) => {
  if (itsAMe) return
  if (event.documentChanges[0].type !== 'PROPERTY_CHANGE') return

  const changeProperties = event.documentChanges[0].properties

  // We don't run the code if for example the user has changed the rotation of the shape.
  // We take into account "strokeWeight" to handle the case where the user add a stroke but then remove it with cmd+z, that event has for some reasons the changeProperty "strokeWeight" and not "stroke".
  // For "fillStyleId", it's to take into account if user has a shape with a color style and he change it to another or if he uses the eyedropper thus removing the color style.
  if (changeProperties.some((item) => changePropertiesToReactTo.includes(item))) {
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

    sendMessageToUi<SyncCurrentFillOrStrokeAndColorsRgbaData>({
      type: 'syncCurrentFillOrStrokeAndColorsRgba',
      data: {
        currentFillOrStroke: currentFillOrStroke,
        colorsRgba: colorsRgba
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

figma.ui.onmessage = (event: MessageForBackend) => {
  let data: MessageForBackendData

  switch (event.type) {
    case 'triggerInit':
      // We wait for the UI to be ready before sending the init infos to it, see the useEffect on the App component.
      init()
      break

    case 'updateShapeColor':
      data = event.data as UpdateShapeColorData

      itsAMe = true
      updateShapeColor(data.newColorRgba, currentFillOrStroke, data.updateParent)

      // We reset itsAMe value to false here because if we do it on the documentchange callback, when we move the hue cursor on FFFFFF or 000000 in OkHSL, this callback is not executed so itsAMe would stay on true and if for example user delete the fill of the shape, we would get an error.
      if (timeoutId) clearTimeout(timeoutId)

      timeoutId = setTimeout(() => {
        itsAMe = false
      }, 500)
      break

    case 'syncFileColorProfile':
      data = event.data as SyncFileColorProfileData
      figma.clientStorage.setAsync('fileColorProfile', data.fileColorProfile)
      break

    case 'syncCurrentFillOrStroke':
      data = event.data as SyncCurrentFillOrStrokeData
      currentFillOrStroke = data.currentFillOrStroke
      break

    case 'syncCurrentColorModel':
      data = event.data as SyncCurrentColorModelData
      currentColorModel = data.currentColorModel
      resizeWindowHeight()
      figma.clientStorage.setAsync('currentColorModel', data.currentColorModel)
      break

    case 'syncShowCssColorCodes':
      data = event.data as SyncShowCssColorCodesData
      showCssColorCodes = data.showCssColorCodes
      resizeWindowHeight()
      figma.clientStorage.setAsync('showCssColorCodes', showCssColorCodes)
      break

    case 'syncLockRelativeChroma':
      data = event.data as SyncLockRelativeChromaData
      figma.clientStorage.setAsync('lockRelativeChroma', data.lockRelativeChroma)
      break

    case 'syncLockContrast':
      data = event.data as SyncLockContrastData
      figma.clientStorage.setAsync('lockContrast', data.lockContrast)
      break
  }
}