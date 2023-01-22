// @ts-nochec k

let currentFillOrStroke: string= "fill";

function sendShapeColorToUI(shape) {
  // console.log("BACKEND: send Shape Color To UI");

  let rgbValues = [];

  if (shape != null) {
    rgbValues[0] = shape[0].color.r * 255;
    rgbValues[1] = shape[0].color.g * 255;
    rgbValues[2] = shape[0].color.b * 255;
  }
  else {
    rgbValues[0] = 255;
    rgbValues[1] = 255;
    rgbValues[2] = 255;
  }

  figma.ui.postMessage({"rgbValues": rgbValues, "message": "new shape color"});
}

// TODO handle case if use change color from Figma color picker?


figma.showUI(__html__, {width: 280, height: 470});

// To send the color of the shape on launch
for (const node of figma.currentPage.selection) {
  // console.log('selected on launch');

  if (figma.currentPage.selection[0]) {
    sendShapeColorToUI(figma.currentPage.selection[0].fills);
  }
}

figma.on("selectionchange", () => {
  // console.log('BACKEND: selection change');

  if (figma.currentPage.selection[0]) {
    if (currentFillOrStroke == "fill") {
      sendShapeColorToUI(figma.currentPage.selection[0].fills);
    }
    else if (currentFillOrStroke == "stroke") {
      sendShapeColorToUI(figma.currentPage.selection[0].strokes)
    }
    
  }
  else {
    sendShapeColorToUI(null);
  }
});

figma.ui.onmessage = (msg) => {
  if (msg.type == "update shape color") {
    // console.log("BACKEND: update shape color");
    
    for (const node of figma.currentPage.selection) {
      if (msg.fillOrStroke == "fill") {
        if ("fills" in node) {
          const nodeFills = node.fills;
          let nodeFillsCopy = JSON.parse(JSON.stringify(nodeFills));

          nodeFillsCopy[0].color.r = msg.rgbValues[0] / 255;
          nodeFillsCopy[0].color.g = msg.rgbValues[1] / 255;
          nodeFillsCopy[0].color.b = msg.rgbValues[2] / 255;

          node.fills = nodeFillsCopy;
        }
      }
      else if (msg.fillOrStroke == "stroke") {
        if ("strokes" in node) {
          const nodeStrokes = node.strokes;
          let nodeStrokesCopy = JSON.parse(JSON.stringify(nodeStrokes));

          nodeStrokesCopy[0].color.r = msg.rgbValues[0] / 255;
          nodeStrokesCopy[0].color.g = msg.rgbValues[1] / 255;
          nodeStrokesCopy[0].color.b = msg.rgbValues[2] / 255;

          node.strokes = nodeStrokesCopy;
        }
      }

    }
  }
  else if (msg.type == "send me shape color") {
    // console.log("BACKEND: send shape color");

    currentFillOrStroke = msg.fillOrStroke;

    if (msg.fillOrStroke == "fill") {
      sendShapeColorToUI(figma.currentPage.selection[0].fills);
    }
    else if (msg.fillOrStroke == "stroke") {
      sendShapeColorToUI(figma.currentPage.selection[0].strokes);
    }
  }
}

