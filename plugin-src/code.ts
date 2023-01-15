// @ts-nochec k

let currentFillOrStroke: string= "fill";

function sendShapeColorToUI(shape) {
  // console.log("BACKEND: send Shape Color To UI");

  let rgb = {};

  if (shape != null) {
    rgb = {
      "r": shape[0].color.r * 255,
      "g": shape[0].color.g * 255,
      "b": shape[0].color.b * 255,
    }
  }
  else {
    rgb = {
      "r": 255,
      "g": 255,
      "b": 255
    }
  }

  figma.ui.postMessage({"rgb": rgb, "message": "new shape color"});
}


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

          nodeFillsCopy[0].color.r = msg.preparedRgbValue.r;
          nodeFillsCopy[0].color.g = msg.preparedRgbValue.g;
          nodeFillsCopy[0].color.b = msg.preparedRgbValue.b;

          node.fills = nodeFillsCopy;
        }
      }
      else if (msg.fillOrStroke == "stroke") {
        if ("strokes" in node) {
          const nodeStrokes = node.strokes;
          let nodeStrokesCopy = JSON.parse(JSON.stringify(nodeStrokes));

          nodeStrokesCopy[0].color.r = msg.preparedRgbValue.r;
          nodeStrokesCopy[0].color.g = msg.preparedRgbValue.g;
          nodeStrokesCopy[0].color.b = msg.preparedRgbValue.b;

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

