// @ts-nochec k

let currentFillOrStroke: string= "fill";
let currentRgbValues: number[] = [];

let itsAMe: boolean = false;

function sendShapeColorToUI(shapeRgb: any) {
  // console.log("BACKEND: send ShapeRgb Color To UI");

  if (shapeRgb != null) {
    currentRgbValues[0] = shapeRgb.r * 255;
    currentRgbValues[1] = shapeRgb.g * 255;
    currentRgbValues[2] = shapeRgb.b * 255;
  }
  else {
    currentRgbValues[0] = 255;
    currentRgbValues[1] = 255;
    currentRgbValues[2] = 255;
  }

  figma.ui.postMessage({"rgbValues": currentRgbValues, "message": "new shape color"});
}

// TODO handle case if use change color from Figma color picker?


figma.showUI(__html__, {width: 280, height: 470});

// To send the color of the shape on launch
for (const node of figma.currentPage.selection) {
  // console.log('selected on launch');

  if (figma.currentPage.selection[0]) {
    sendShapeColorToUI(figma.currentPage.selection[0].fills[0].color);
  }
}

figma.on("selectionchange", () => {
  // console.log('BACKEND: selection change');

  if (figma.currentPage.selection[0]) {
    if (currentFillOrStroke == "fill") {
      sendShapeColorToUI(figma.currentPage.selection[0].fills[0].color);
    }
    else if (currentFillOrStroke == "stroke") {
      sendShapeColorToUI(figma.currentPage.selection[0].strokes[0].color)
    }
    
  }
  else {
    sendShapeColorToUI(null);
  }
});

figma.on("documentchange", (event) => {
  // console.log('BACKEND: document change');

  const changeType = event.documentChanges[0].type;
  const changeProperty = event.documentChanges[0].properties[0];

  // This is to change the color in the plugin if the user change it from Figma.
  if (figma.currentPage.selection[0] && changeType == "PROPERTY_CHANGE" && !itsAMe) {
    
    if (currentFillOrStroke == "fill" && changeProperty == "fills") {
      console.log("Change fill color from Figma");

      const shapeRgb = figma.currentPage.selection[0].fills[0].color;
      if (shapeRgb.r != currentRgbValues[0] || shapeRgb.r != currentRgbValues[1] || shapeRgb.b != currentRgbValues[2]) {
        sendShapeColorToUI(shapeRgb);
      } 

    }
    else if (currentFillOrStroke == "stroke" && changeProperty == "strokes") {
      console.log("Change stroke color from Figma");
      
      const shapeRgb = figma.currentPage.selection[0].strokes[0].color;
      if (shapeRgb.r != currentRgbValues[0] || shapeRgb.r != currentRgbValues[1] || shapeRgb.b != currentRgbValues[2]) {
        sendShapeColorToUI(shapeRgb);
      } 
    }
  }

  if (itsAMe) {
    itsAMe = false;
  }
});

figma.ui.onmessage = (msg) => {
  if (msg.type == "update shape color") {
    // console.log("BACKEND: update shape color");

    // We use this variable to prevent the triggering of figma.on "documentchange".
    itsAMe = true;
    
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
      sendShapeColorToUI(figma.currentPage.selection[0].fills[0].color);
    }
    else if (msg.fillOrStroke == "stroke") {
      sendShapeColorToUI(figma.currentPage.selection[0].strokes[0].color);
    }
  }
}

