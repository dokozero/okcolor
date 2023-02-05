// @ts-nochec k

/*
** VARIABLES DECLARATIONS
*/

type ShapeFillStrokeInfo = {
  hasFill: boolean,
  hasStroke: boolean
};

let shapeFillStrokeInfo: ShapeFillStrokeInfo;

let currentFillOrStroke: string = "fill";
let currentRgbValues: number[] = [];
let opacityValue: number;

// We use this variable to prevent the triggering of figma.on "documentchange".
let itsAMe: boolean = false;


/*
** HELPER FUNCTIONS
*/

// In the case of multiple selected shapes, this is to test if they all have at least all a fill or a stroke. If not, we don't allow for color changes.
function doesAllShapesHaveFillOrStroke(selections: any) {

  let allShapesHaveFillOrStroke: boolean = false;

  let fills: number = 0;
  let strokes: number = 0;
  
  for (let i = 0; i < selections.length; i++) {
    if (selections[i].fills[0] !== undefined) {
      fills++;
    }
    if (selections[i].strokes[0] !== undefined) {
      strokes++;
    }
  }

  if (selections.length == fills || selections.length == strokes) {
    allShapesHaveFillOrStroke = true;
  }  

  return allShapesHaveFillOrStroke;

}

function updateShapeFillStrokeInfo(firstSelection: SceneNode) {
  // Get infos if shape has fill and or stroke

  let newShapeFillStrokeInfo: ShapeFillStrokeInfo = {
    hasFill: false,
    hasStroke: false
  }

  if (firstSelection.fills[0] !== undefined) newShapeFillStrokeInfo.hasFill = true;
  if (firstSelection.strokes[0] !== undefined) newShapeFillStrokeInfo.hasStroke = true;

  shapeFillStrokeInfo = newShapeFillStrokeInfo;
}

// TODO remove null case?
function getShapeColor(shapeColor: any) {
  currentRgbValues[0] = shapeColor.color.r * 255;
  currentRgbValues[1] = shapeColor.color.g * 255;
  currentRgbValues[2] = shapeColor.color.b * 255;
  opacityValue = Math.round(shapeColor.opacity * 100);
}

function isSelectionValid(): boolean {

  let notSupportedNodeTypes = [
    "BOOLEAN_OPERATION",
    "CODE_BLOCK",
    "COMPONENT_SET",
    "CONNECTOR",
    "DOCUMENT",
    "EMBED",
    "GROUP",
    "LINK_UNFURL",
    "MEDIA",
    "PAGE",
    "SHAPE_WITH_TEXT",
    "SLICE",
    "STAMP",
    "STICKY",
    "WIDGET"
  ];
  
  if (figma.currentPage.selection[0] === undefined) {
    sendUiMessageCodeToUI("noSelection");
    return false;
  }
  
  // We don't support some node types like groups as it would be too complicated to change color of potentially lot of nested shape's colors.
  if (notSupportedNodeTypes.includes(figma.currentPage.selection[0].type)) {
    sendUiMessageCodeToUI("notSupportedType");
    return false;
  }

  if (figma.currentPage.selection[0].fills[0] === undefined && figma.currentPage.selection[0].strokes[0] === undefined) {
    sendUiMessageCodeToUI("noColorInShape");
    return false;
  }
  
  // If user has selected multiple shapes, we test if they all have at least all a fill or a stroke.
  // For example user has selected 3 shapes and 2 of them have only a stroke and the other only a fill, we don't allow the plugin to be used.
  if (figma.currentPage.selection.length > 1) {
    let allShapesHaveFillOrStroke: boolean = doesAllShapesHaveFillOrStroke(figma.currentPage.selection);
    
    if (!allShapesHaveFillOrStroke) {
      sendUiMessageCodeToUI("notAllShapesHaveFillOrStroke");
      return false;
    }
  }

  return true;
}



/* 
** UPDATES TO FRONTEND
*/

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

function sendNewShapeFillStrokeInfoToUI() {
  // console.log("BACKEND: send New Shape Fill Stroke Info To UI");
  figma.ui.postMessage({"shapeFillStrokeInfo": shapeFillStrokeInfo, "message": "new shapeFillStrokeInfo"});
}

function sendUiMessageCodeToUI(uiMessageCode: string) {
  // console.log("send UiMessageCode To UI");
  figma.ui.postMessage({"message": "Display UI Message", "uiMessageCode": uiMessageCode});
}



/* 
** INIT
*/

figma.showUI(__html__, {width: 280, height: 470, themeColors: false});

// To send the color of the shape on launch
function init() {

  if(!isSelectionValid()) return;

  let firstSelection: SceneNode = figma.currentPage.selection[0];
  
  updateShapeFillStrokeInfo(firstSelection);

  if (shapeFillStrokeInfo.hasFill) {
    currentFillOrStroke = "fill";
    sendNewShapeColorToUI(firstSelection.fills[0]);
  }
  else {
    currentFillOrStroke = "stroke";
    sendNewShapeColorToUI(firstSelection.strokes[0]);
  }
}

init();



/* 
** UPDATES FROM FIGMA
*/

// If user change shape selection.
figma.on("selectionchange", () => {
  // console.log('BACKEND: selection change');
  
  if(!isSelectionValid()) return;

  let firstSelection: SceneNode = figma.currentPage.selection[0];
  
  updateShapeFillStrokeInfo(firstSelection);

  if (currentFillOrStroke == "fill") {
    if (shapeFillStrokeInfo.hasFill) {
      sendNewShapeColorToUI(firstSelection.fills[0]);
    }
    else {
      currentFillOrStroke = "stroke";
      sendNewShapeColorToUI(firstSelection.strokes[0]);
    }
  }
  else if (currentFillOrStroke == "stroke") {
    if (shapeFillStrokeInfo.hasStroke) {
      sendNewShapeColorToUI(firstSelection.strokes[0]);
    }
    else {
      currentFillOrStroke = "fill";
      sendNewShapeColorToUI(firstSelection.fills[0]);
    }
  }


});

// If user change property of selected shape.
figma.on("documentchange", (event) => {
  const changeType = event.documentChanges[0].type;
  
  if (changeType == "PROPERTY_CHANGE" && !itsAMe) {   
    
    const changeProperty = event.documentChanges[0].properties[0];
    
    // We don't run the code if for example the user has changed the rotation of the shape.
    if (changeProperty == "fills" || changeProperty == "strokes") {
      // console.log('BACKEND: document change');

      if(!isSelectionValid()) return;

      let firstSelection: SceneNode = figma.currentPage.selection[0];
        
      // We test if user has added a fill or a stroke to an already selected shape, if yes we need to update the UI and activate the fill/stroke selector accordingly.
      let oldShapeFillStrokeInfo = Object.assign({}, shapeFillStrokeInfo);
      updateShapeFillStrokeInfo(firstSelection);

      if (JSON.stringify(oldShapeFillStrokeInfo) !== JSON.stringify(shapeFillStrokeInfo)) {
        if (currentFillOrStroke == "fill" && !shapeFillStrokeInfo.hasFill) {
          currentFillOrStroke = "stroke";
          sendNewShapeColorToUI(firstSelection.strokes[0]);
        }
        else if (currentFillOrStroke == "stroke" && !shapeFillStrokeInfo.hasStroke) {
          currentFillOrStroke = "fill";
          sendNewShapeColorToUI(firstSelection.fills[0]);
        }
        sendNewShapeFillStrokeInfoToUI();
        return;
      }

      // This is to change the color in the plugin if the user change it from Figma.
      if (currentFillOrStroke == "fill" && changeProperty == "fills") {
        // console.log("Change fill color from Figma");
        const shapeColor = firstSelection.fills[0];
        if (shapeColor.color.r != currentRgbValues[0] || shapeColor.color.r != currentRgbValues[1] || shapeColor.color.b != currentRgbValues[2]) {
          sendNewShapeColorToUI(shapeColor);
        }
      }
      else if (currentFillOrStroke == "stroke" && changeProperty == "strokes") {
        // console.log("Change stroke color from Figma");
        const shapeColor = firstSelection.strokes[0];
        if (shapeColor.color.r != currentRgbValues[0] || shapeColor.color.r != currentRgbValues[1] || shapeColor.color.b != currentRgbValues[2]) {
          sendNewShapeColorToUI(shapeColor);
        } 
      }

    }

  }

  if (itsAMe) {
    itsAMe = false;
  }
});



/* 
** UPDATES FROM FRONTEND
*/

figma.ui.onmessage = (msg) => {
  if (msg.type == "update shape color") {
    // console.log("BACKEND: update shape color");

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

