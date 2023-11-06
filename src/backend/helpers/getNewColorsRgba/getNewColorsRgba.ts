import { ColorsRgba } from '../../../types'
import { uiMessageTexts } from '../../../ui/ui-messages'

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

type GetNewColorsRgbaReturn = {
  newColorsRgba: ColorsRgba
  uiMessageCode: keyof typeof uiMessageTexts | null
  nodeType: string | null
}

export default function getNewColorsRgba(): GetNewColorsRgbaReturn {
  const selection = figma.currentPage.selection

  const returnObject: GetNewColorsRgbaReturn = {
    newColorsRgba: {
      parentFill: null,
      fill: null,
      stroke: null
    },
    uiMessageCode: null,
    nodeType: null
  }

  let doesAllShapesHaveAFill = true
  let doesAllShapesHaveAStroke = true

  if (!selection[0]) {
    returnObject.uiMessageCode = 'no_selection'
    return returnObject
  }

  // We use this for loop to either check if one or multiple thing are selected as the user can, for example, select a group a shape, in that case we should block the plugin from being used.
  for (const node of selection) {
    // We don't support some node types like groups as it would be too complicated to change color of potentially lot of nested shape's colors.
    if (!supportedNodeTypes.includes(node.type)) {
      returnObject.uiMessageCode = 'not_supported_type'
      returnObject.nodeType = node.type
      return returnObject
    }
  }

  // We do this because the previous test garanties that selection[0] will have the properties we will use.
  const firstSelection = selection[0] as any
  const selectionFill = firstSelection.fills[0]
  const selectionStroke = firstSelection.strokes[0]

  if (!selectionFill && !selectionStroke) {
    returnObject.uiMessageCode = 'no_color_in_shape'
    return returnObject
  }

  // With the following 3 conditions, we allow for example to modify the color of a shape that have a gradient on its stroke and a solid fill or vice versa.
  if (selectionFill?.type !== 'SOLID' && selectionStroke?.type !== 'SOLID') {
    returnObject.uiMessageCode = 'no_solid_color'
    return returnObject
  }

  if (firstSelection.parent?.fills) {
    let currentObject = firstSelection.parent

    while (currentObject) {
      if (currentObject.fills && currentObject?.fills?.length !== 0) {
        returnObject.newColorsRgba.parentFill = {
          r: currentObject.fills[0].color.r * 255,
          g: currentObject.fills[0].color.g * 255,
          b: currentObject.fills[0].color.b * 255
        }
        break
      } else if (currentObject.parent) {
        currentObject = currentObject.parent
      } else {
        break
      }
    }
  }

  // If user select multiple shape and not all of them have a stroke of a fill, or if it is the case but one of them is a gradient, we disable the UI.
  if (selection.length > 1) {
    // If the first selected shape has a prent fill, we set it back to null as we don't want to display the contrast because
    // it would show one value although and that wouldn't be clear of which one it would be.
    if (returnObject.newColorsRgba.parentFill) {
      returnObject.newColorsRgba.parentFill = null
    }

    let fillsCount = 0
    let strokesCount = 0

    for (const node of selection as any) {
      if (node.fills[0]?.type === 'SOLID') fillsCount++
      if (node.strokes[0]?.type === 'SOLID') strokesCount++
    }

    if (selection.length !== fillsCount && selection.length !== strokesCount) {
      returnObject.uiMessageCode = 'not_all_shapes_have_fill_or_stroke'
      return returnObject
    } else if (selection.length !== fillsCount) {
      // If all selected shapes don't have a fill in common we prevent getting the fill color in returnObject in the next code block.
      doesAllShapesHaveAFill = false
    } else if (selection.length !== strokesCount) {
      // Same reason than above but for the stroke.
      doesAllShapesHaveAStroke = false
    }
  }

  if (selectionFill?.type === 'SOLID' && doesAllShapesHaveAFill) {
    returnObject.newColorsRgba.fill = {
      r: selectionFill.color.r * 255,
      g: selectionFill.color.g * 255,
      b: selectionFill.color.b * 255,
      a: Math.round(selectionFill.opacity * 100)
    }
  }

  if (selectionStroke?.type === 'SOLID' && doesAllShapesHaveAStroke) {
    returnObject.newColorsRgba.stroke = {
      r: selectionStroke.color.r * 255,
      g: selectionStroke.color.g * 255,
      b: selectionStroke.color.b * 255,
      a: Math.round(selectionStroke.opacity * 100)
    }
  }

  return returnObject
}
