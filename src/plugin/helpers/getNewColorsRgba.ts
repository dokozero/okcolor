import { ColorsRgba } from '../../types'
import { uiMessageTexts } from '../../ui/ui-messages'

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

interface GetNewColorsRgbaReturn {
  newColorsRgba: ColorsRgba
  uiMessageCode: keyof typeof uiMessageTexts | null
  nodeType: string | null
}

export default function getNewColorsRgba(): GetNewColorsRgbaReturn {
  const selection = figma.currentPage.selection

  const returnObject: GetNewColorsRgbaReturn = {
    newColorsRgba: {
      fill: null,
      stroke: null
    },
    uiMessageCode: null,
    nodeType: null
  }

  if (!selection[0]) {
    returnObject.uiMessageCode = 'no_selection'
    return returnObject
  }

  // We use this for loop to either check if one thing is selected or multiple as use can for example select a group a shape, in that case we should block the plugin from being used.
  for (const node of selection) {
    // We don't support some node types like groups as it would be too complicated to change color of potentially lot of nested shape's colors.
    if (!supportedNodeTypes.includes(node.type)) {
      returnObject.uiMessageCode = 'not_supported_type'
      returnObject.nodeType = node.type
      return returnObject
    }
  }

  const selectionFill = selection[0].fills[0]
  const selectionStroke = selection[0].strokes[0]

  if (!selectionFill && !selectionStroke) {
    returnObject.uiMessageCode = 'no_color_in_shape'
    return returnObject
  }

  // We the following 3 conditions, we allow for example to modify the color of a shape that have a gradient on its stroke and a solid fill or vice versa.
  if (selectionFill?.type !== 'SOLID' && selectionStroke?.type !== 'SOLID') {
    returnObject.uiMessageCode = 'no_solid_color'
    return returnObject
  }

  if (selectionFill?.type === 'SOLID') {
    returnObject.newColorsRgba.fill = {
      r: selectionFill.color.r * 255,
      g: selectionFill.color.g * 255,
      b: selectionFill.color.b * 255,
      a: Math.round(selectionFill.opacity * 100)
    }
  }

  if (selectionStroke?.type === 'SOLID') {
    returnObject.newColorsRgba.stroke = {
      r: selectionStroke.color.r * 255,
      g: selectionStroke.color.g * 255,
      b: selectionStroke.color.b * 255,
      a: Math.round(selectionStroke.opacity * 100)
    }
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
      returnObject.uiMessageCode = 'not_all_shapes_have_fill_or_stroke'
      return returnObject
    }
  }

  return returnObject
}
