// @ts-nochec k

let shapeFillStrokeInfo = {
  "fill": false,
  "stroke": false
};
let currentFillOrStroke: string;
let currentRgbValues: number[] = [];
let opacityValue: number;

let itsAMe: boolean = false;

function getShapeFillStrokeInfo(selection) {
  // Get infos if shape has fill and or stroke

  if (selection.fills[0] !== undefined) {
    shapeFillStrokeInfo.fill = true;
  }
  else {
    shapeFillStrokeInfo.fill = false;
  }

  if (selection.strokes[0] !== undefined) {
    shapeFillStrokeInfo.stroke = true;
  }
  else {
    shapeFillStrokeInfo.stroke = false;
  }
}

function getShapeColor(shapeColor: any) {
  if (shapeColor !== null) {
    currentRgbValues[0] = shapeColor.color.r * 255;
    currentRgbValues[1] = shapeColor.color.g * 255;
    currentRgbValues[2] = shapeColor.color.b * 255;
    opacityValue = Math.round(shapeColor.opacity * 100);
  }
  else {
    currentRgbValues[0] = 255;
    currentRgbValues[1] = 255;
    currentRgbValues[2] = 255;
    opacityValue = 100;
  }
}

function sendNewShapeColorToUI(shapeColor: any) {
  // console.log("BACKEND: send New Shape Color To UI");

  getShapeColor(shapeColor);

  figma.ui.postMessage({"shapeFillStrokeInfo": shapeFillStrokeInfo, "rgbValues": currentRgbValues, "opacityValue": opacityValue, "message": "new shape color"});
}

// Difference with above function, this one send the other color of the shape (fill or stroke).
function sendCurrentShapeColorToUI(shapeColor: any) {
  // console.log("BACKEND: send Current Shape Color To UI");

  getShapeColor(shapeColor);

  figma.ui.postMessage({"rgbValues": currentRgbValues, "opacityValue": opacityValue, "message": "current shape color"});
}


figma.showUI(__html__, {width: 280, height: 470, themeColors: true});

// To send the color of the shape on launch
for (const node of figma.currentPage.selection) {
  // console.log('selected on launch');

  if (figma.currentPage.selection[0]) {

    getShapeFillStrokeInfo(figma.currentPage.selection[0]);

    if (shapeFillStrokeInfo.fill) {
      currentFillOrStroke = "fill";
      sendNewShapeColorToUI(figma.currentPage.selection[0].fills[0]);
    }
    else {
      currentFillOrStroke = "stroke";
      sendNewShapeColorToUI(figma.currentPage.selection[0].strokes[0]);
    }
    
  }
}

figma.on("selectionchange", () => {
  // console.log('BACKEND: selection change');

  if (figma.currentPage.selection[0]) {
    
    getShapeFillStrokeInfo(figma.currentPage.selection[0]);

    if (currentFillOrStroke == "fill") {
      if (shapeFillStrokeInfo.fill) {
        sendNewShapeColorToUI(figma.currentPage.selection[0].fills[0]);
      }
      else {
        currentFillOrStroke = "stroke";
        sendNewShapeColorToUI(figma.currentPage.selection[0].strokes[0]);
      }
    }
    else if (currentFillOrStroke == "stroke") {
      if (shapeFillStrokeInfo.stroke) {
        sendNewShapeColorToUI(figma.currentPage.selection[0].strokes[0]);
      }
      else {
        currentFillOrStroke = "fill";
        sendNewShapeColorToUI(figma.currentPage.selection[0].fills[0]);
      }
    }
    
  }
  else {
    sendNewShapeColorToUI(null);
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

      const shapeColor = figma.currentPage.selection[0].fills[0];
      if (shapeColor.color.r != currentRgbValues[0] || shapeColor.color.r != currentRgbValues[1] || shapeColor.color.b != currentRgbValues[2]) {
        sendNewShapeColorToUI(shapeColor);
      } 

    }
    else if (currentFillOrStroke == "stroke" && changeProperty == "strokes") {
      console.log("Change stroke color from Figma");
      
      const shapeColor = figma.currentPage.selection[0].strokes[0];
      if (shapeColor.color.r != currentRgbValues[0] || shapeColor.color.r != currentRgbValues[1] || shapeColor.color.b != currentRgbValues[2]) {
        sendNewShapeColorToUI(shapeColor);
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
  else if (msg.type == "update shape opacity") {
    // We use this variable to prevent the triggering of figma.on "documentchange".
    itsAMe = true;

    for (const node of figma.currentPage.selection) {
      if (msg.fillOrStroke == "fill") {
        if ("fills" in node) {
          const nodeFills = node.fills;
          let nodeFillsCopy = JSON.parse(JSON.stringify(nodeFills));

          nodeFillsCopy[0].opacity = msg.opacityValue / 100;
          node.fills = nodeFillsCopy;
        }
      }
      else if (msg.fillOrStroke == "stroke") {
        if ("strokes" in node) {
          const nodeStrokes = node.strokes;
          let nodeStrokesCopy = JSON.parse(JSON.stringify(nodeStrokes));

          nodeStrokesCopy[0].opacity = msg.opacityValue / 100;
          node.strokes = nodeStrokesCopy;
        }
      }
    }
  }
  else if (msg.type == "send me shape color") {
    // console.log("BACKEND: send shape color");

    currentFillOrStroke = msg.fillOrStroke;

    if (msg.fillOrStroke == "fill") {
      sendCurrentShapeColorToUI(figma.currentPage.selection[0].fills[0]);
    }
    else if (msg.fillOrStroke == "stroke") {
      sendCurrentShapeColorToUI(figma.currentPage.selection[0].strokes[0]);
    }
  }
}

