/* eslint-disable @typescript-eslint/ban-ts-comment */

import { ColorRgba, CurrentFillOrStroke } from '../../types'

export default function updateShapeColor(newColorRgba: ColorRgba, currentFillOrStroke: CurrentFillOrStroke) {
  const newColorRgbaFormated = {
    r: newColorRgba.r / 255,
    g: newColorRgba.g / 255,
    b: newColorRgba.b / 255,
    a: newColorRgba.a / 100
  }
  let copyNode
  const type = currentFillOrStroke + 's'

  for (const node of figma.currentPage.selection) {
    // @ts-ignore
    // We know here that node will always have a fills or strokes properties because the user can't use the plugin if the selected shape(s) are not of the types from supportedNodeTypes.
    copyNode = JSON.parse(JSON.stringify(node[type]))

    copyNode[0].color.r = newColorRgbaFormated.r
    copyNode[0].color.g = newColorRgbaFormated.g
    copyNode[0].color.b = newColorRgbaFormated.b
    copyNode[0].opacity = newColorRgbaFormated.a

    // @ts-ignore
    node[type] = copyNode
  }
}
