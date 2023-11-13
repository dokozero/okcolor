/* eslint-disable @typescript-eslint/ban-ts-comment */

import { PICKER_SIZE } from '../constants'
import type {
  ColorsRgba,
  CurrentColorModel,
  CurrentFillOrStroke,
  DisplayUiMessageData,
  CurrentFileColorProfile,
  MessageForBackend,
  MessageForBackendData,
  SyncCurrentColorModelData,
  SyncNewShapeData,
  SyncCurrentFillOrStrokeData,
  SyncLocalStorageValuesData,
  SyncLockContrastData,
  SyncLockRelativeChromaData,
  SyncIsColorCodeInputsOpenData,
  UpdateShapeColorData,
  SyncIsContrastInputOpenData,
  CurrentContrastMethod,
  SyncCurrentContrastMethodData,
  SyncCurrentFileColorProfileData,
  UserSettings,
  SyncUserSettingsData
} from '../types'
import getNewColorsRgba from './helpers/getNewColorsRgba/getNewColorsRgba'
import getWindowHeigh from './helpers/getWindowHeigh/getWindowHeigh'
import sendMessageToUi from './helpers/sendMessageToUi/sendMessageToUi'
import updateShapeColor from './helpers/updateShapeColor/updateShapeColor'

let userSettings: UserSettings
let currentFillOrStroke: CurrentFillOrStroke = 'fill'
let currentFileColorProfile: CurrentFileColorProfile
let currentColorModel: CurrentColorModel
let isContrastInputOpen: boolean
let lockRelativeChroma: boolean
let currentContrastMethod: CurrentContrastMethod
let lockContrast: boolean
let isColorCodeInputsOpen: boolean

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
  const windowHeight = getWindowHeigh({
    currentColorModel: currentColorModel,
    isColorCodeInputsOpen: isColorCodeInputsOpen,
    isContrastInputOpen: isContrastInputOpen
  })

  figma.ui.resize(PICKER_SIZE, windowHeight)
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
  // We force the currentFileColorProfile value to sRGB in FigJam because they don't suport P3 yet (https://help.figma.com/hc/en-us/articles/360039825114).
  if (figma.editorType === 'figma') currentFileColorProfile = (await figma.clientStorage.getAsync('currentFileColorProfile')) || 'rgb'
  else if (figma.editorType === 'figjam') currentFileColorProfile = 'rgb'

  const userSettingsString =
    (await figma.clientStorage.getAsync('userSettings')) ||
    '{"useSimplifiedChroma": false, "oklchInputOrder": "lch", "useHardwareAcceleration": true}'

  userSettings = JSON.parse(userSettingsString)

  isContrastInputOpen = (await figma.clientStorage.getAsync('isContrastInputOpen')) || false
  isColorCodeInputsOpen = (await figma.clientStorage.getAsync('isColorCodeInputsOpen')) || false
  currentContrastMethod = (await figma.clientStorage.getAsync('currentContrastMethod')) || 'apca'
  currentColorModel = (await figma.clientStorage.getAsync('currentColorModel')) || 'oklch'

  // @ts-ignore
  // For those who still have the old value before the introduction of the user settings.
  if (currentColorModel === 'oklchCss') currentColorModel = 'oklch'

  if (['okhsv', 'okhsl'].includes(currentColorModel)) {
    lockRelativeChroma = false
    lockContrast = false
  } else {
    lockRelativeChroma = (await figma.clientStorage.getAsync('lockRelativeChroma')) || false
    lockContrast = (await figma.clientStorage.getAsync('lockContrast')) || false
  }

  const initialWindowHeight = getWindowHeigh({
    currentColorModel: currentColorModel,
    isColorCodeInputsOpen: isColorCodeInputsOpen,
    isContrastInputOpen: isContrastInputOpen
  })

  figma.showUI(__html__, { width: PICKER_SIZE, height: initialWindowHeight, themeColors: true })
}

getLocalStorageValueAndCreateUiWindow()

// Send the local storage value and the color of the shape on launch, we call it when the UI is ready, see below figma.ui.onmessage
const init = async () => {
  sendMessageToUi<SyncLocalStorageValuesData>({
    type: 'syncLocalStorageValues',
    data: {
      newFigmaEditorType: figma.editorType,
      newUserSettings: userSettings,
      newCurrentFileColorProfile: currentFileColorProfile,
      newIsContrastInputOpen: isContrastInputOpen,
      newLockRelativeChroma: lockRelativeChroma,
      newCurrentContrastMethod: currentContrastMethod,
      newLockContrast: lockContrast,
      newIsColorCodeInputsOpen: isColorCodeInputsOpen,
      newCurrentColorModel: currentColorModel
    }
  })

  if (updateColorsRgbaOrSendUiMessageCodeToUi() === 'uiMessageCode sent') return
  currentFillOrStroke = colorsRgba.fill ? 'fill' : 'stroke'

  sendMessageToUi<SyncNewShapeData>({
    type: 'syncNewShape',
    data: {
      newCurrentFillOrStroke: currentFillOrStroke,
      newColorsRgba: colorsRgba,
      newLockRelativeChroma: lockRelativeChroma,
      newLockContrast: lockContrast
    }
  })
}

/**
 * Updates from Figma
 */

const handleFigmaOnSelectionChange = () => {
  if (updateColorsRgbaOrSendUiMessageCodeToUi() === 'uiMessageCode sent') return

  currentFillOrStroke = colorsRgba.fill ? 'fill' : 'stroke'

  sendMessageToUi<SyncNewShapeData>({
    type: 'syncNewShape',
    data: {
      newCurrentFillOrStroke: currentFillOrStroke,
      newColorsRgba: colorsRgba,
      newLockRelativeChroma: lockRelativeChroma,
      newLockContrast: lockContrast
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

    sendMessageToUi<SyncNewShapeData>({
      type: 'syncNewShape',
      data: {
        newCurrentFillOrStroke: currentFillOrStroke,
        newColorsRgba: colorsRgba,
        newLockRelativeChroma: lockRelativeChroma,
        newLockContrast: lockContrast
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
      updateShapeColor(data.newColorRgba, currentFillOrStroke, data.currentBgOrFg)

      // We reset itsAMe value to false here because if we do it on the documentchange callback, when we move the hue cursor on FFFFFF or 000000 in OkHSL, this callback is not executed so itsAMe would stay on true and if for example user delete the fill of the shape, we would get an error.
      if (timeoutId) clearTimeout(timeoutId)

      timeoutId = setTimeout(() => {
        itsAMe = false
      }, 500)
      break

    case 'SyncUserSettings':
      data = event.data as SyncUserSettingsData
      userSettings = data.newUserSettings
      figma.clientStorage.setAsync('userSettings', JSON.stringify(data.newUserSettings))
      break

    case 'syncCurrentFileColorProfile':
      data = event.data as SyncCurrentFileColorProfileData
      currentFileColorProfile = data.newCurrentFileColorProfile
      figma.clientStorage.setAsync('currentFileColorProfile', data.newCurrentFileColorProfile)
      break

    case 'syncCurrentFillOrStroke':
      data = event.data as SyncCurrentFillOrStrokeData
      currentFillOrStroke = data.newCurrentFillOrStroke
      break

    case 'syncCurrentColorModel':
      data = event.data as SyncCurrentColorModelData
      currentColorModel = data.newCurrentColorModel
      figma.clientStorage.setAsync('currentColorModel', data.newCurrentColorModel)
      resizeWindowHeight()
      break

    case 'syncIsContrastInputOpen':
      data = event.data as SyncIsContrastInputOpenData
      isContrastInputOpen = data.newIsContrastInputOpen
      figma.clientStorage.setAsync('isContrastInputOpen', isContrastInputOpen)
      resizeWindowHeight()
      break

    case 'syncLockRelativeChroma':
      data = event.data as SyncLockRelativeChromaData
      lockRelativeChroma = data.newLockRelativeChroma
      figma.clientStorage.setAsync('lockRelativeChroma', data.newLockRelativeChroma)
      break

    case 'syncCurrentContrastMethod':
      data = event.data as SyncCurrentContrastMethodData
      currentContrastMethod = data.newCurrentContrastMethod
      figma.clientStorage.setAsync('currentContrastMethod', data.newCurrentContrastMethod)
      break

    case 'syncLockContrast':
      data = event.data as SyncLockContrastData
      lockContrast = data.newLockContrast
      figma.clientStorage.setAsync('lockContrast', data.newLockContrast)
      break

    case 'syncIsColorCodeInputsOpen':
      data = event.data as SyncIsColorCodeInputsOpenData
      isColorCodeInputsOpen = data.newIsColorCodeInputsOpen
      figma.clientStorage.setAsync('isColorCodeInputsOpen', isColorCodeInputsOpen)
      resizeWindowHeight()
      break
  }
}
