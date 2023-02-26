// @ts-nochec k

/*
** VARIABLES DECLARATIONS
*/

let currentFillOrStroke = "fill";

// We use this variable to prevent the triggering of figma.on "documentchange".
let itsAMe = false;

let shapeInfosDefault = {
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

let shapeInfos = JSON.parse(JSON.stringify(shapeInfosDefault));


/*
** HELPER FUNCTIONS
*/


function updateShapeInfos(): boolean {

  shapeInfos = JSON.parse(JSON.stringify(shapeInfosDefault));
 
  let notSupportedNodeTypes = [
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

  const selection = figma.currentPage.selection;

  if (!selection[0]) {
    sendUIMessageCodeToUI("noSelection");
    return false;
  }

  // We use this for loop to either check if one thing is selected or multiple as use can for example select a group a shape, in that case we should block the plugin from being used.
  for (const node of selection) {
    // We don't support some node types like groups as it would be too complicated to change color of potentially lot of nested shape's colors.
    if (notSupportedNodeTypes.includes(node.type)) {
      sendUIMessageCodeToUI("notSupportedType", node.type);
      return false;
    }
  }

  const selectionFill = selection[0].fills[0];
  const selectionStroke = selection[0].strokes[0];

  if (!selectionFill && !selectionStroke) {
    sendUIMessageCodeToUI("noColorInShape");
    return false;
  }

  // We the following 3 conditions, we allow for example to modify the color of a shape that have a gradient on its stroke and a solid fill or vice versa.
  if (selectionFill?.type !== "SOLID" && selectionStroke?.type !== "SOLID") {
    sendUIMessageCodeToUI("noSolidColor");
    return false;
  }

  if (selectionFill?.type === "SOLID") {
    shapeInfos.hasFillStroke.fill = true;

    shapeInfos.colors.fill.r = selectionFill.color.r * 255;
    shapeInfos.colors.fill.g = selectionFill.color.g * 255;
    shapeInfos.colors.fill.b = selectionFill.color.b * 255;
    shapeInfos.colors.fill.opacity = Math.round(selectionFill.opacity * 100);
  }

  if (selectionStroke?.type === "SOLID") {
    shapeInfos.hasFillStroke.stroke = true;

    shapeInfos.colors.stroke.r = selectionStroke.color.r * 255;
    shapeInfos.colors.stroke.g = selectionStroke.color.g * 255;
    shapeInfos.colors.stroke.b = selectionStroke.color.b * 255;
    shapeInfos.colors.stroke.opacity = Math.round(selectionStroke.opacity * 100);
  }


  // If user select multiple shape and not all of them have a stroke of a fill or if it's case but one of them is a gradient, we block the plugin.
  if (selection.length > 1) {
    let fillsCount = 0;
    let strokesCount = 0;
    
    for (const node of selection) {
      if (node.fills[0]?.type === "SOLID") fillsCount++;
      if (node.strokes[0]?.type === "SOLID") strokesCount++;
    }
  
    if (selection.length !== fillsCount && selection.length !== strokesCount) {
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

function sendUIMessageCodeToUI(UIMessageCode: string, nodeType: string = "") {
  // console.log("send UIMessageCode To UI");
  figma.ui.postMessage({"message": "Display UI Message", "UIMessageCode": UIMessageCode, "nodeType": nodeType});
}



/* 
** INIT
*/

figma.showUI(__html__, {width: 240, height: 346, themeColors: true});

// To send the color of the shape on launch
function init() {

  if (!updateShapeInfos()) return;

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
  
  if (!updateShapeInfos()) return;

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
     
      // We test if user has added a fill or a stroke to an already selected shape, if yes we need to update the UI and activate the fill/stroke selector accordingly.
      let oldHasFillStroke = Object.assign({}, shapeInfos.hasFillStroke);
 
      if (!updateShapeInfos()) return;

      if (JSON.stringify(oldHasFillStroke) !== JSON.stringify(shapeInfos.hasFillStroke)) {
        if (currentFillOrStroke == "fill" && !shapeInfos.hasFillStroke.fill) {
          currentFillOrStroke = "stroke";
        }
        else if (currentFillOrStroke == "stroke" && !shapeInfos.hasFillStroke.stroke) {
          currentFillOrStroke = "fill";
        }
        sendNewShapeColorToUI(true);
        return;
      }

      if ((currentFillOrStroke == "fill" && changeProperty == "strokes") || (currentFillOrStroke == "stroke" && changeProperty == "fills")) {
        // To avoid rendering color picker canvas if for example user is changing stroke color while the fill is selected in plugin's UI.
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

