/* eslint-disable @typescript-eslint/ban-ts-comment */

import { ColorRgba, CurrentFillOrStroke } from '../../types'

export default function updateShapeColor(newColorRgba: ColorRgba, currentFillOrStroke: CurrentFillOrStroke, updateParent: boolean) {
  const newColorRgbaFormated = {
    r: newColorRgba.r / 255,
    g: newColorRgba.g / 255,
    b: newColorRgba.b / 255,
    a: newColorRgba.a / 100
  }
  let copyNode
  const type = currentFillOrStroke + 's'

  for (const node of figma.currentPage.selection) {
    let parentObject

    // Deep copy of node[types] is necessary to update it as explained in Figma's dev doc: https://www.figma.com/plugin-docs/editing-properties/
    // We use ts-ignore because know here that node will always have a fills or strokes properties because the user can't use the plugin if the selected shape(s) are not of the types from supportedNodeTypes.
    if (updateParent) {
      parentObject = node.parent as any // We know that node.parent will have the properties if updateParent is true.
      while (parentObject) {
        if (parentObject.fills?.length !== 0) {
          break
        } else if (parentObject.parent) {
          parentObject = parentObject.parent
        } else {
          break
        }
      }
      // @ts-ignore
      copyNode = JSON.parse(JSON.stringify(parentObject.fills))
    } else {
      // @ts-ignore
      copyNode = JSON.parse(JSON.stringify(node[type]))
    }

    copyNode[0].color.r = newColorRgbaFormated.r
    copyNode[0].color.g = newColorRgbaFormated.g
    copyNode[0].color.b = newColorRgbaFormated.b
    copyNode[0].opacity = newColorRgbaFormated.a

    if (updateParent) {
      // @ts-ignore
      parentObject.fills = copyNode
    } else {
      // @ts-ignore
      node[type] = copyNode
    }
  }
}
