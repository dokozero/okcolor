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

const supportedParentTypes = ['GROUP', 'FRAME', 'COMPONENT']

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

  // Get the parent fill if possible.
  // We test is selection.length is 1 because we don't want to display the contrast of multiple selected shapes as it would show one contrast value and that wouldn't be clear of which one of the selected shape it would be.
  if (supportedParentTypes.includes(firstSelection.parent?.type) && selection.length === 1) {
    let currentObject = firstSelection.parent

    while (currentObject) {
      if (currentObject.fills && currentObject.fills?.length !== 0) {
        // We do this test on a new if and not on the one above, because for example if we have a label with a parent frame which has a gradient and who also have a parent frame with a solid fill, the above condition would be true and we would update parentFill, however if the fill type is not solid we run the "break".
        if (currentObject.fills[0].type !== 'SOLID') break

        // If the parent has a color from a variable, this condition prevent continuing, for now we take the parent fill but we can't modify the color but at least the user can change the fg color to control the contrast.
        // if (currentObject.fills[0].boundVariables?.color) break

        returnObject.newColorsRgba.parentFill = {
          r: currentObject.fills[0].color.r,
          g: currentObject.fills[0].color.g,
          b: currentObject.fills[0].color.b
        }
        break
      } else if (currentObject.parent) {
        currentObject = currentObject.parent
      } else {
        break
      }
    }
  }

  if (selection.length > 1) {
    let fillsCount = 0
    let strokesCount = 0

    for (const node of selection as any) {
      if (node.fills[0]?.type === 'SOLID') fillsCount++
      if (node.strokes[0]?.type === 'SOLID') strokesCount++
    }

    // If user select multiple shape and not all of them have a stroke of a fill, or if it is the case but one of them is a gradient, we disable the UI.
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
      r: selectionFill.color.r,
      g: selectionFill.color.g,
      b: selectionFill.color.b,
      a: selectionFill.opacity
    }
  }

  if (selectionStroke?.type === 'SOLID' && doesAllShapesHaveAStroke) {
    returnObject.newColorsRgba.stroke = {
      r: selectionStroke.color.r,
      g: selectionStroke.color.g,
      b: selectionStroke.color.b,
      a: selectionStroke.opacity
    }
  }

  return returnObject
}
