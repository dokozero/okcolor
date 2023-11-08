/* eslint-disable @typescript-eslint/ban-ts-comment */

import { ColorRgba, CurrentBgOrFg, CurrentFillOrStroke } from '../../../types'

export default function updateShapeColor(newColorRgba: ColorRgba, currentFillOrStroke: CurrentFillOrStroke, currentBgOrFg: CurrentBgOrFg) {
  let copyNode
  const type = currentFillOrStroke + 's'

  for (const node of figma.currentPage.selection) {
    let parentObject

    // Deep copy of node[types] is necessary to update it as explained in Figma's dev doc: https://www.figma.com/plugin-docs/editing-properties/
    // We use ts-ignore because know here that node will always have a fills or strokes properties because the user can't use the plugin if the selected shape(s) are not of the types from supportedNodeTypes.
    if (currentBgOrFg === 'bg') {
      parentObject = node.parent as any // We know that node.parent will have the properties if currentBgOrFg === 'bg'.
      while (parentObject) {
        if (parentObject.type !== 'GROUP' && parentObject.fills?.length !== 0) {
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

    copyNode[0].color.r = newColorRgba.r
    copyNode[0].color.g = newColorRgba.g
    copyNode[0].color.b = newColorRgba.b
    copyNode[0].opacity = newColorRgba.a

    if (currentBgOrFg === 'bg') {
      // @ts-ignore
      parentObject.fills = copyNode
    } else {
      // @ts-ignore
      node[type] = copyNode
    }
  }
}
