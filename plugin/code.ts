// @ts-nochec k

/*
** VARIABLES DECLARATIONS
*/

let currentFillOrStroke = "fill";

// We use this variable to prevent the triggering of figma.on "documentchange".
let itsAMe = false;

let shapeInfos = {
  hasFillStroke: {
    fill: false,
    stroke: false
  },
  colors: {
    fill: {
      r: 255,
      g: 255,
      b: 255,
      opacity: 0,
    },
    stroke: {
      r: 255,
      g: 255,
      b: 255,
      opacity: 0
    }
  }
}


/*
** HELPER FUNCTIONS
*/

// TODO remove null case?
function updateShapeInfos(firstSelection: SceneNode) {

  if (firstSelection.fills[0] !== undefined) {
    shapeInfos.hasFillStroke.fill = true;
    shapeInfos.colors.fill.r = firstSelection.fills[0].color.r * 255;
    shapeInfos.colors.fill.g = firstSelection.fills[0].color.g * 255;
    shapeInfos.colors.fill.b = firstSelection.fills[0].color.b * 255;
    shapeInfos.colors.fill.opacity = Math.round(firstSelection.fills[0].opacity * 100);
  }
  else {
    shapeInfos.hasFillStroke.fill = false;
  }

  if (firstSelection.strokes[0] !== undefined) {
    shapeInfos.hasFillStroke.stroke = true;
    shapeInfos.colors.stroke.r = firstSelection.strokes[0].color.r * 255;
    shapeInfos.colors.stroke.g = firstSelection.strokes[0].color.g * 255;
    shapeInfos.colors.stroke.b = firstSelection.strokes[0].color.b * 255;
    shapeInfos.colors.stroke.opacity = Math.round(firstSelection.strokes[0].opacity * 100);
  }
  else {
    shapeInfos.hasFillStroke.stroke = false;
  }

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
    sendUIMessageCodeToUI("noSelection");
    return false;
  }
 
  // We use this for loop to either check if one thing is selected or multiple as use can for example select a group a shape, in that case we should block the plugin from being used.
  for (const node of figma.currentPage.selection) {
    // We don't support some node types like groups as it would be too complicated to change color of potentially lot of nested shape's colors.
    if (notSupportedNodeTypes.includes(node.type)) {
      sendUIMessageCodeToUI("notSupportedType");
      return false;
    }
  }

  if (figma.currentPage.selection[0].fills[0] === undefined && figma.currentPage.selection[0].strokes[0] === undefined) {
    sendUIMessageCodeToUI("noColorInShape");
    return false;
  }

  if (figma.currentPage.selection[0].fills[0] !== undefined) {
    if (figma.currentPage.selection[0].fills[0].type != "SOLID") {
      sendUIMessageCodeToUI("noSolidColor");
      return false;
    }
  }

  if (figma.currentPage.selection[0].strokes[0] !== undefined) {
    if (figma.currentPage.selection[0].strokes[0].type != "SOLID") {
      sendUIMessageCodeToUI("noSolidColor");
      return false;
    }
  }


  
  // If user has selected multiple shapes, we test if they all have at least all a fill or a stroke.
  // For example user has selected 3 shapes and 2 of them have only a stroke and the other only a fill, we don't allow the plugin to be used.
  if (figma.currentPage.selection.length > 1) {
    let fills: number = 0;
    let strokes: number = 0;
    
    for (const node of figma.currentPage.selection) {
      if (node.fills[0] !== undefined) fills++;
      if (node.strokes[0] !== undefined) strokes++;
    }
  
    if (figma.currentPage.selection.length != fills && figma.currentPage.selection.length != strokes) {
      sendUIMessageCodeToUI("notAllShapesHaveFillOrStroke");
      return false;
    }

  }

  return true;
}



/* 
** UPDATES TO FRONTEND
*/

function sendNewShapeColorToUI(shouldRenderColorPickerCanvas = false) {
  // console.log("BACKEND: send New Shape Color To UI");
  // figma.ui.postMessage({"shapeFillStrokeInfo": shapeFillStrokeInfo, "rgbValues": currentRgbValues, "opacityValue": opacityValue, "message": "new shape color"});
  figma.ui.postMessage({"shapeInfos": shapeInfos, "currentFillOrStroke": currentFillOrStroke, "shouldRenderColorPickerCanvas": shouldRenderColorPickerCanvas, "message": "new shape color"});
}

function sendUIMessageCodeToUI(UIMessageCode: string) {
  // console.log("send UIMessageCode To UI");
  figma.ui.postMessage({"message": "Display UI Message", "UIMessageCode": UIMessageCode});
}



/* 
** INIT
*/

figma.showUI(__html__, {width: 240, height: 360, themeColors: true});

// To send the color of the shape on launch
function init() {

  if(!isSelectionValid()) return;

  let firstSelection: SceneNode = figma.currentPage.selection[0];
  
  updateShapeInfos(firstSelection);

  if (shapeInfos.hasFillStroke.fill) { currentFillOrStroke = "fill"; }
  else { currentFillOrStroke = "stroke"; }

  sendNewShapeColorToUI(true);
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
  
  updateShapeInfos(firstSelection);

  if (currentFillOrStroke == "fill" && !shapeInfos.hasFillStroke.fill) { currentFillOrStroke = "stroke"; }
  else if (currentFillOrStroke == "stroke" && !shapeInfos.hasFillStroke.stroke) { currentFillOrStroke = "fill"; }

  sendNewShapeColorToUI(true);

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
      let oldHasFillStroke = Object.assign({}, shapeInfos.hasFillStroke);
      updateShapeInfos(firstSelection);

      if (JSON.stringify(oldHasFillStroke) !== JSON.stringify(shapeInfos.hasFillStroke)) {
        if (currentFillOrStroke == "fill" && !shapeInfos.hasFillStroke.fill) {
          currentFillOrStroke = "stroke"; 
        }
        else if (currentFillOrStroke == "stroke" && !shapeInfos.hasFillStroke.stroke) {
          currentFillOrStroke = "fill";
        }
      }

      if ((currentFillOrStroke == "fill" && changeProperty == "strokes") || (currentFillOrStroke == "stroke" && changeProperty == "fills")) {
        sendNewShapeColorToUI();
      }
      else {
        sendNewShapeColorToUI(true);
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
  if (msg.type == "Update shape color") {
    // console.log("BACKEND: update shape color");

    itsAMe = true;
    
    for (const node of figma.currentPage.selection) {
      let copyNode;

      if ("fills" in node && currentFillOrStroke == "fill") { copyNode = JSON.parse(JSON.stringify(node.fills)); }
      else if ("strokes" in node && currentFillOrStroke == "stroke") { copyNode = JSON.parse(JSON.stringify(node.strokes)); }

      copyNode[0].color.r = msg.newColor.r / 255;
      copyNode[0].color.g = msg.newColor.g / 255;
      copyNode[0].color.b = msg.newColor.b / 255;
      copyNode[0].opacity = msg.newColor.opacity / 100;

      if ("fills" in node && currentFillOrStroke == "fill") { node.fills = copyNode; }
      else if ("strokes" in node && currentFillOrStroke == "stroke") { node.strokes = copyNode; }
    }

  }
  else if (msg.type == "Sync currentFillOrStroke") {
    currentFillOrStroke = msg.currentFillOrStroke;
  }
}

