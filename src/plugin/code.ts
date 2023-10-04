/* eslint-disable @typescript-eslint/ban-ts-comment */

import { PICKER_SIZE } from '../constants'
import type { ColorRgba, ColorsRgba, CurrentColorModel, CurrentFillOrStroke, FileColorProfile } from '../types'
import { uiMessageTexts } from '../ui/ui-messages'

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

const colorsRgba: ColorsRgba = {
  fill: null,
  stroke: null
}

const supportedNodeTypes = [
  'BOOLEAN_OPERATION',
  'COMPONENT',
  'ELLIPSE',
  'FRAME',
  'INSTANCE',
  'LINE',
  'POLYGON',
  'RECTANGLE',
  'STAR',
  'TEXT',
  'VECTOR',
  'SHAPE_WITH_TEXT',
  'HIGHLIGHT'
]

const changePropertiesToReactTo = ['fills', 'fillStyleId', 'strokes', 'strokeWeight']

/*
 ** HELPER FUNCTIONS
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

const updateColorsRgba = (): boolean => {
  const selection = figma.currentPage.selection

  if (!selection[0]) {
    sendUiMessageCodeToUi('no_selection')
    return false
  }

  // We use this for loop to either check if one thing is selected or multiple as use can for example select a group a shape, in that case we should block the plugin from being used.
  for (const node of selection) {
    // We don't support some node types like groups as it would be too complicated to change color of potentially lot of nested shape's colors.
    if (!supportedNodeTypes.includes(node.type)) {
      sendUiMessageCodeToUi('not_supported_type', node.type)
      return false
    }
  }

  const selectionFill = selection[0].fills[0]
  const selectionStroke = selection[0].strokes[0]

  if (!selectionFill && !selectionStroke) {
    sendUiMessageCodeToUi('no_color_in_shape')
    return false
  }

  // We the following 3 conditions, we allow for example to modify the color of a shape that have a gradient on its stroke and a solid fill or vice versa.
  if (selectionFill?.type !== 'SOLID' && selectionStroke?.type !== 'SOLID') {
    sendUiMessageCodeToUi('no_solid_color')
    return false
  }

  if (selectionFill?.type === 'SOLID') {
    colorsRgba.fill = {
      r: selectionFill.color.r * 255,
      g: selectionFill.color.g * 255,
      b: selectionFill.color.b * 255,
      a: Math.round(selectionFill.opacity * 100)
    }
  } else {
    colorsRgba.fill = null
  }

  if (selectionStroke?.type === 'SOLID') {
    colorsRgba.stroke = {
      r: selectionStroke.color.r * 255,
      g: selectionStroke.color.g * 255,
      b: selectionStroke.color.b * 255,
      a: Math.round(selectionStroke.opacity * 100)
    }
  } else {
    colorsRgba.stroke = null
  }

  // If user select multiple shape and not all of them have a stroke of a fill or if it's case but one of them is a gradient, we block the plugin.
  if (selection.length > 1) {
    let fillsCount = 0
    let strokesCount = 0

    for (const node of selection) {
      if (node.fills[0]?.type === 'SOLID') fillsCount++
      if (node.strokes[0]?.type === 'SOLID') strokesCount++
    }

    if (selection.length !== fillsCount && selection.length !== strokesCount) {
      sendUiMessageCodeToUi('not_all_shapes_have_fill_or_stroke')
      return false
    }
  }

  return true
}

/*
 ** UPDATES TO UI
 */

const sendInitToUi = () => {
  figma.ui.postMessage({
    message: 'init',
    initData: {
      figmaEditorType: figma.editorType,
      fileColorProfile: fileColorProfile,
      currentColorModel: currentColorModel,
      lockRelativeChroma: lockRelativeChroma,
      showCssColorCodes: showCssColorCodes
    }
  })
}

const sendNewColorsRgbaToUi = () => {
  figma.ui.postMessage({
    message: 'newColorsRgba',
    newColorsRgbaData: {
      colorsRgba: colorsRgba,
      currentFillOrStroke: currentFillOrStroke
    }
  })
}

const sendUiMessageCodeToUi = (uiMessageCode: keyof typeof uiMessageTexts, nodeType?: string | undefined) => {
  figma.ui.postMessage({
    message: 'displayUiMessage',
    displayUiMessageData: {
      uiMessageCode: uiMessageCode,
      nodeType: nodeType
    }
  })
}

/*
 ** UPDATES FROM FIGMA
 */

// If user change shape selection.
figma.on('selectionchange', () => {
  if (!updateColorsRgba()) return

  currentFillOrStroke = colorsRgba.fill ? 'fill' : 'stroke'

  sendNewColorsRgbaToUi()
})

// If user change property of selected shape.
figma.on('documentchange', (event) => {
  if (itsAMe) {
    return
  }

  const changeType = event.documentChanges[0].type

  if (changeType === 'PROPERTY_CHANGE') {
    const changeProperty = event.documentChanges[0].properties[0]

    // We don't run the code if for example the user has changed the rotation of the shape.
    // We take into account "strokeWeight" to handle the case where the user add a stroke but then remove it with cmd+z, that event has for some reasons the changeProperty "strokeWeight" and not "stroke".
    // For "fillStyleId", it's to take into account if user has a shape with a color style and he change it to another or if he uses the eyedropper thus removing the color style.
    if (changePropertiesToReactTo.includes(changeProperty)) {
      // We test if user has added a fill or a stroke to an already selected shape, if yes we need to update the UI and activate the fill/stroke selector accordingly.
      const oldColorsRgba = JSON.parse(JSON.stringify(colorsRgba))

      if (!updateColorsRgba()) return

      if (JSON.stringify(oldColorsRgba) !== JSON.stringify(colorsRgba)) {
        if (currentFillOrStroke === 'fill' && !colorsRgba.fill) {
          currentFillOrStroke = 'stroke'
        } else if (currentFillOrStroke === 'stroke' && !colorsRgba.stroke) {
          currentFillOrStroke = 'fill'
        }
      }

      sendNewColorsRgbaToUi()
    }
  }
})

/*
 ** UPDATES FROM UI
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
  if (event.message === 'init') {
    // We wait the UI is fully loaded before sending the init infos back to the UI, see the useEffect on the UI code.
    init()
  } else if (event.message === 'updateShapeColor') {
    itsAMe = true

    const newColorRgbaFormated = {
      r: event.newColorRgba!.r / 255,
      g: event.newColorRgba!.g / 255,
      b: event.newColorRgba!.b / 255,
      a: event.newColorRgba!.a / 100
    }
    let copyNode
    const type = currentFillOrStroke + 's'

    for (const node of figma.currentPage.selection) {
      // @ts-ignore
      // We know here that node will always have a fills or strokes properties because the user can use the plugin is the selected shape(s) are not of the types from supportedNodeTypes.
      copyNode = JSON.parse(JSON.stringify(node[type]))

      copyNode[0].color.r = newColorRgbaFormated.r
      copyNode[0].color.g = newColorRgbaFormated.g
      copyNode[0].color.b = newColorRgbaFormated.b
      copyNode[0].opacity = newColorRgbaFormated.a

      // @ts-ignore
      node[type] = copyNode
    }

    // We reset itsAMe value to false here because if we do it on the documentchange callback, when we move the hue cursor on FFFFFF or 000000 in OkHSL, this callback is not executed so itsAMe would stay on true and if for example user delete the fill of the shape we would get an error.
    if (timeoutId) {
      clearTimeout(timeoutId)
    }
    timeoutId = setTimeout(() => {
      itsAMe = false
    }, 500)
  } else if (event.message === 'syncFileColorProfile') {
    figma.clientStorage.setAsync('fileColorProfile', event.fileColorProfile)
  } else if (event.message === 'syncCurrentFillOrStroke') {
    currentFillOrStroke = event.currentFillOrStroke!
  } else if (event.message === 'syncCurrentColorModel') {
    currentColorModel = event.currentColorModel!
    resizeWindowHeight()
    figma.clientStorage.setAsync('currentColorModel', event.currentColorModel)
  } else if (event.message === 'syncShowCssColorCodes') {
    showCssColorCodes = event.showCssColorCodes!
    resizeWindowHeight()
    figma.clientStorage.setAsync('showCssColorCodes', showCssColorCodes)
  } else if (event.message === 'syncLockRelativeChromaWithPlugin') {
    figma.clientStorage.setAsync('lockRelativeChroma', event.lockRelativeChroma)
  }
}

/*
 ** INIT
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

// To send the color of the shape on launch, we call it when the UI is ready, see above figma.ui.onmessage
const init = async () => {
  sendInitToUi()

  if (!updateColorsRgba()) return

  currentFillOrStroke = colorsRgba.fill ? 'fill' : 'stroke'

  sendNewColorsRgbaToUi()
}
