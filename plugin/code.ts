// @ts-nochec k

/*
** VARIABLES DECLARATIONS
*/

let shapeFillStrokeInfo = {
  "hasFill": false,
  "hasStroke": false
};
let currentFillOrStroke: string;
let currentRgbValues: number[] = [];
let opacityValue: number;

// We use this variable to prevent the triggering of figma.on "documentchange".
let itsAMe: boolean = false;

/*
** HELPER FUNCTIONS
*/

function getSelection() {

  if (figma.currentPage.selection[0] === undefined) return;

  let notSupportedNodeTypes = [
    "BOOLEAN_OPERATION",
    "CODE_BLOCK",
    "COMPONENT",
    "COMPONENT_SET",
    "CONNECTOR",
    "DOCUMENT",
    "ELLIPSE",
    "EMBED",
    "GROUP",
    "INSTANCE",
    "LINK_UNFURL",
    "MEDIA",
    "PAGE",
    "POLYGON",
    "SHAPE_WITH_TEXT",
    "SLICE",
    "STAMP",
    "STAR",
    "STICKY",
    "WIDGET"
  ];

  // We don't support some node types like groups as it would be too complicated to change color of potentially lot of nested shape's colors.
  if (!notSupportedNodeTypes.includes(figma.currentPage.selection[0].type)) {
    return figma.currentPage.selection;
  }
  else {
    return;
  }

}

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

function updateShapeFillStrokeInfo(selection: any) {
  // Get infos if shape has fill and or stroke

  if (selection.fills[0] !== undefined) {
    shapeFillStrokeInfo.hasFill = true;
  }
  else {
    shapeFillStrokeInfo.hasFill = false;
  }

  if (selection.strokes[0] !== undefined) {
    shapeFillStrokeInfo.hasStroke = true;
  }
  else {
    shapeFillStrokeInfo.hasStroke = false;
  }
}

// TODO remove null case?
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

  figma.ui.postMessage({"shapeFillStrokeInfo": shapeFillStrokeInfo, "message": "new shape fill stroke info"});
}

function sendUiMessageCodeToUI(uiMessageCode: string) {
  // console.log("send UiMessageCode To UI");

  figma.ui.postMessage({"message": "Display UI Message", "uiMessageCode": uiMessageCode});
}



/* 
** INIT
*/

figma.showUI(__html__, {width: 280, height: 470, themeColors: false});

function init() {

  let selection = getSelection();

  // To send the color of the shape on launch
  if (selection !== undefined) {
    // console.log('selected on launch');

    updateShapeFillStrokeInfo(selection[0]);

    let allShapesHaveFillOrStroke: boolean = true;

    if (selection.length > 1) {
      allShapesHaveFillOrStroke = doesAllShapesHaveFillOrStroke(selection);
    }
    
    if (allShapesHaveFillOrStroke) {
      if (shapeFillStrokeInfo.hasFill) {
        currentFillOrStroke = "fill";
        sendNewShapeColorToUI(selection[0].fills[0]);
      }
      else {
        currentFillOrStroke = "stroke";
        sendNewShapeColorToUI(selection[0].strokes[0]);
      }
    }
    else {
      currentFillOrStroke = "fill";
      sendUiMessageCodeToUI("notAllShapesHaveFillOrStroke");
    }
    
  }
  else {
    currentFillOrStroke = "fill";
    sendUiMessageCodeToUI("noSelection");
  }
}

init();



/* 
** UPDATES FROM FIGMA
*/

// If user change shape selection.
figma.on("selectionchange", () => {
  console.log('BACKEND: selection change');
  
  let selection = getSelection();

  if (selection !== undefined) {

    updateShapeFillStrokeInfo(selection[0]);

    let allShapesHaveFillOrStroke: boolean = true;

    if (selection.length > 1) {
      allShapesHaveFillOrStroke = doesAllShapesHaveFillOrStroke(selection);
    }

    if (allShapesHaveFillOrStroke) {
      if (currentFillOrStroke == "fill") {
        if (shapeFillStrokeInfo.hasFill) {
          sendNewShapeColorToUI(selection[0].fills[0]);
        }
        else {
          currentFillOrStroke = "stroke";
          sendNewShapeColorToUI(selection[0].strokes[0]);
        }
      }
      else if (currentFillOrStroke == "stroke") {
        if (shapeFillStrokeInfo.hasStroke) {
          sendNewShapeColorToUI(selection[0].strokes[0]);
        }
        else {
          currentFillOrStroke = "fill";
          sendNewShapeColorToUI(selection[0].fills[0]);
        }
      }
    }
    else {
      sendUiMessageCodeToUI("notAllShapesHaveFillOrStroke");
    }

  }
  else {
    sendUiMessageCodeToUI("noSelection");
  }
});

// If user change property of selected shape.
figma.on("documentchange", (event) => {
  console.log('BACKEND: document change');

  let selection = getSelection();

  if (selection !== undefined) {
    const changeType = event.documentChanges[0].type;
    
    if (changeType == "PROPERTY_CHANGE" && !itsAMe) {

      // We get the updated property only if the changeType is PROPERTY_CHANGE.
      const changeProperty = event.documentChanges[0].properties[0];

      let allShapesHaveFillOrStroke: boolean = true;

      if (figma.currentPage.selection.length > 1) {
        allShapesHaveFillOrStroke = doesAllShapesHaveFillOrStroke(figma.currentPage.selection);
      }
      
      if (allShapesHaveFillOrStroke) {
        
        // We test if user has added a fill or a stroke to an already selected shape, if yes we need to update the UI and activate the fill/stroke selector accordingly.

        updateShapeFillStrokeInfo(selection[0]);
        let oldShapeFillStrokeInfo = Object.assign({}, shapeFillStrokeInfo);

        // TODO check if changeType tells if added fill or stroke.
        if (JSON.stringify(oldShapeFillStrokeInfo) !== JSON.stringify(shapeFillStrokeInfo)) {
          sendNewShapeFillStrokeInfoToUI();
          return;
        }

        // This is to change the color in the plugin if the user change it from Figma.
        if (currentFillOrStroke == "fill" && changeProperty == "fills") {
          console.log("Change fill color from Figma");
          const shapeColor = selection[0].fills[0];
          if (shapeColor.color.r != currentRgbValues[0] || shapeColor.color.r != currentRgbValues[1] || shapeColor.color.b != currentRgbValues[2]) {
            sendNewShapeColorToUI(shapeColor);
          }
        }
        else if (currentFillOrStroke == "stroke" && changeProperty == "strokes") {
          console.log("Change stroke color from Figma");
          const shapeColor = selection[0].strokes[0];
          if (shapeColor.color.r != currentRgbValues[0] || shapeColor.color.r != currentRgbValues[1] || shapeColor.color.b != currentRgbValues[2]) {
            sendNewShapeColorToUI(shapeColor);
          } 
        }
      }
    }

    if (itsAMe) {
      itsAMe = false;
    }
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

