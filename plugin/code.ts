import { pickerSize, debugMode } from "../ui/utils/constants";

/*
** VARIABLES DECLARATIONS
*/

let currentFillOrStroke = "fill";
let currentColorModel: string;

// We use this variable to prevent the triggering of figma.on "documentchange".
let itsAMe = false;

type RgbaColor = [number, number, number, number];

interface ShapeInfos {
  hasFillStroke: {
    fill: boolean;
    stroke: boolean;
  };
  colors: {
    [key: string]: { rgba: RgbaColor; }
  };
}

let shapeInfos: ShapeInfos = {
  hasFillStroke: {
    fill: false,
    stroke: false
  },
  colors: {
    fill: {
      rgba: [255, 255, 255, 0]
    },
    stroke: {
      rgba: [255, 255, 255, 0]
    }
  }
}



/*
** HELPER FUNCTIONS
*/

const shapeInfosResetDefault = function() {
  if (debugMode) { console.log("PLUGIN: shapeInfosResetDefault()"); }

  shapeInfos.hasFillStroke.fill = false,
  shapeInfos.hasFillStroke.stroke = false,
  shapeInfos.colors.fill.rgba = [255, 255, 255, 0],
  shapeInfos.colors.stroke.rgba = [255, 255, 255, 0]
};

const updateShapeInfos = function(): boolean {
  if (debugMode) { console.log("PLUGIN: updateShapeInfos()"); }

  shapeInfosResetDefault();
 
  const supportedNodeTypes = [
    "BOOLEAN_OPERATION",
    "COMPONENT",
    "ELLIPSE",
    "FRAME",
    "INSTANCE",
    "LINE",
    "POLYGON",
    "RECTANGLE",
    "STAR",
    "TEXT",
    "VECTOR",
    "SHAPE_WITH_TEXT",
    "HIGHLIGHT"
  ];

  const selection = figma.currentPage.selection;

  if (!selection[0]) {
    sendUIMessageCodeToUI("noSelection");
    return false;
  }

  // We use this for loop to either check if one thing is selected or multiple as use can for example select a group a shape, in that case we should block the plugin from being used.
  for (const node of selection) {
    // We don't support some node types like groups as it would be too complicated to change color of potentially lot of nested shape's colors.
    if (!supportedNodeTypes.includes(node.type)) {
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

    shapeInfos.colors.fill.rgba[0] = selectionFill.color.r * 255;
    shapeInfos.colors.fill.rgba[1] = selectionFill.color.g * 255;
    shapeInfos.colors.fill.rgba[2] = selectionFill.color.b * 255;
    shapeInfos.colors.fill.rgba[3] = Math.round(selectionFill.opacity * 100);
  }

  if (selectionStroke?.type === "SOLID") {
    shapeInfos.hasFillStroke.stroke = true;

    shapeInfos.colors.stroke.rgba[0] = selectionStroke.color.r * 255;
    shapeInfos.colors.stroke.rgba[1] = selectionStroke.color.g * 255;
    shapeInfos.colors.stroke.rgba[2] = selectionStroke.color.b * 255;
    shapeInfos.colors.stroke.rgba[3] = Math.round(selectionStroke.opacity * 100);
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

    // If for example two shapes are selected with a fill but one of them have a stroke, we set update shaeInfos accordingly.
    if (strokesCount < fillsCount) { shapeInfos.hasFillStroke.stroke = false; }
    else if (fillsCount < strokesCount) { shapeInfos.hasFillStroke.fill = false; }
  }
  
  return true;

};



/* 
** UPDATES TO UI
*/

const sendInitToUI = function() {
  if (debugMode) { console.log("PLUGIN: sendInitToUI())"); }
  
  figma.ui.postMessage({"message": "init", "currentColorModel": currentColorModel});
};

const sendNewShapeColorToUI = function(shouldRenderColorPickerCanvas = false) {
  if (debugMode) { console.log(`PLUGIN: sendNewShapeColorToUI(${shouldRenderColorPickerCanvas})`); }
  
  figma.ui.postMessage({"message": "newShapeColor", "shapeInfos": shapeInfos, "currentFillOrStroke": currentFillOrStroke, "shouldRenderColorPickerCanvas": shouldRenderColorPickerCanvas});
};

const sendUIMessageCodeToUI = function(UIMessageCode: string, nodeType: string = "") {
  if (debugMode) { console.log(`PLUGIN: sendUIMessageCodeToUI(${UIMessageCode}, ${nodeType})`); }

  figma.ui.postMessage({"message": "displayUIMessage", "UIMessageCode": UIMessageCode, "nodeType": nodeType});
};



/* 
** INIT
*/

figma.showUI(__html__, {width: pickerSize, height: 346, themeColors: true});

// To send the color of the shape on launch
const init = async function() {
  if (debugMode) { console.log("PLUGIN: init()"); }

  // Get the currentColorModel value from the clientStorage and set it to "okhsl" if it's not in there.
  currentColorModel = await figma.clientStorage.getAsync("currentColorModel");

  // We could just test if currentColorModel is undefined (when user first launch the plugin) but with this test, if for any reason the currentColorModel value in the clientStorage is a different string than "okhsv", "okhsl" or "oklch", we set it to okhsl (could come from a Figma bug that change the value but it shouldn't occurs).
  if (currentColorModel !== "okhsv" && currentColorModel !== "okhsl" && currentColorModel !== "oklch") {
    currentColorModel = "okhsl";
  }

  sendInitToUI();

  if (!updateShapeInfos()) return;

  if (shapeInfos.hasFillStroke.fill) { currentFillOrStroke = "fill"; }
  else { currentFillOrStroke = "stroke"; }

  sendNewShapeColorToUI(true);
};

init();



/* 
** UPDATES FROM FIGMA
*/

// If user change shape selection.
figma.on("selectionchange", () => {
  if (debugMode) { console.log("PLUGIN: figma.on selectionchange"); }

  currentFillOrStroke = "fill";
  
  if (!updateShapeInfos()) return;

  if (currentFillOrStroke === "fill" && !shapeInfos.hasFillStroke.fill) { currentFillOrStroke = "stroke"; }
  else if (currentFillOrStroke === "stroke" && !shapeInfos.hasFillStroke.stroke) { currentFillOrStroke = "fill"; }

  sendNewShapeColorToUI(true);

});

// If user change property of selected shape.
figma.on("documentchange", (event) => {
  
  if (itsAMe) { return; }
  
  const changeType = event.documentChanges[0].type;
  
  if (changeType === "PROPERTY_CHANGE") {
    
    const changeProperty = event.documentChanges[0].properties[0];
    
    // We don't run the code if for example the user has changed the rotation of the shape.
    if (changeProperty === "fills" || changeProperty === "strokes") {

      if (debugMode) { console.log("PLUGIN: figma.on documentchange"); }
     
      // We test if user has added a fill or a stroke to an already selected shape, if yes we need to update the UI and activate the fill/stroke selector accordingly.
      let oldHasFillStroke = Object.assign({}, shapeInfos.hasFillStroke);
 
      if (!updateShapeInfos()) return;

      if (JSON.stringify(oldHasFillStroke) !== JSON.stringify(shapeInfos.hasFillStroke)) {
        if (currentFillOrStroke === "fill" && !shapeInfos.hasFillStroke.fill) {
          currentFillOrStroke = "stroke";
        }
        else if (currentFillOrStroke === "stroke" && !shapeInfos.hasFillStroke.stroke) {
          currentFillOrStroke = "fill";
        }
        sendNewShapeColorToUI(true);
        return;
      }

      if ((currentFillOrStroke === "fill" && changeProperty === "strokes") || (currentFillOrStroke === "stroke" && changeProperty === "fills")) {
        // To avoid rendering color picker canvas if for example user is changing stroke color while the fill is selected in plugin's UI.
        sendNewShapeColorToUI();
      }
      else {
        sendNewShapeColorToUI(true);
      }

    }

  }
});



/* 
** UPDATES FROM UI
*/

let timeoutId: number;

figma.ui.onmessage = (msg) => {
  if (debugMode) { console.log(`PLUGIN: figma.ui.onmessage - "${msg.type}"`); }

  if (msg.type === "updateShapeColor") {

    itsAMe = true;

    const newColor_r = msg.newColor[0] / 255;
    const newColor_g = msg.newColor[1] / 255;
    const newColor_b = msg.newColor[2] / 255;
    const newColor_opacity = msg.newColor[3] / 100;
    let copyNode;
    const type = currentFillOrStroke + "s";
    
    for (const node of figma.currentPage.selection) {
      if (type in node) {
        copyNode = JSON.parse(JSON.stringify(node[type]));
        
        copyNode[0].color.r = newColor_r;
        copyNode[0].color.g = newColor_g;
        copyNode[0].color.b = newColor_b;
        copyNode[0].opacity = newColor_opacity;

        node[type] = copyNode;
      }
    }

    // We reset itsAMe value to false here because if we do it on the documentchange callback, when we move the hue cursor on FFFFFF or 000000 in OkHSL, this callback is not executed so itsAMe would stay on true and if for example user delete the fill of the shape we would get an error.
    if (timeoutId) { clearTimeout(timeoutId); }
    timeoutId = setTimeout(() => { itsAMe = false; }, 500);

  }
  else if (msg.type === "syncCurrentFillOrStroke") {
    currentFillOrStroke = msg.currentFillOrStroke;
  }
  else if (msg.type === "syncCurrentColorModel") {
    figma.clientStorage.setAsync("currentColorModel", msg.currentColorModel);
  }
};