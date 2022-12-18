// @ts-nochec k

import { srgb_to_okhsl, srgb_to_okhsv, okhsl_to_srgb } from "../bottosson/colorconversion";

let currentFillOrStroke: string= "fill";

function setColorInUI(shape) {
  let r = shape[0].color.r * 255;
  let g = shape[0].color.g * 255;
  let b = shape[0].color.b * 255;

  let okhslResult = srgb_to_okhsl(r, g, b);
  let okhsvResult = srgb_to_okhsv(r, g, b);

  let colors = {
    "r": r,
    "g": g,
    "b": b,
    okhsl: {
      "hue": Math.floor(okhslResult[0] * 360),
      "saturation": Math.floor(okhslResult[1] * 100),
      "lightness": Math.floor(okhslResult[2] * 100)
    },
    okhsv: {
      "hue": Math.floor(okhsvResult[0] * 360),
      "saturation": Math.floor(okhsvResult[1] * 100),
      "value": Math.floor(okhsvResult[2] * 100)
    }
  }

  figma.ui.postMessage(colors);
}


// Runs this code if the plugin is run in Figma
if (figma.editorType === 'figma') {

  // figma.ui.onmessage = msg => {
  //   // One way of distinguishing between different types of messages sent from
  //   // your HTML page is to use an object with a "type" property like this.
  //   if (msg.type === 'create-shapes') {
  //     const nodes: SceneNode[] = [];
  //     for (let i = 0; i < msg.count; i++) {
  //       const rect = figma.createRectangle();
  //       rect.x = i * 150;
  //       rect.fills = [{type: 'SOLID', color: {r: 1, g: 0.5, b: 0}}];
  //       figma.currentPage.appendChild(rect);
  //       nodes.push(rect);
  //     }
  //     figma.currentPage.selection = nodes;
  //     figma.viewport.scrollAndZoomIntoView(nodes);
  //   }

  //   // Make sure to close the plugin when you're done. Otherwise the plugin will
  //   // keep running, which shows the cancel button at the bottom of the screen.
  //   figma.closePlugin();
  // };

  figma.showUI(__html__, {width: 280, height: 470});

  for (const node of figma.currentPage.selection) {
    // console.log('selected on launch');

    if (figma.currentPage.selection[0]) {
      setColorInUI(figma.currentPage.selection[0].fills);
    }
  }

  figma.on("selectionchange", () => {
    console.log('selection change');

    if (figma.currentPage.selection[0]) {
      if (currentFillOrStroke == "fill") {
        setColorInUI(figma.currentPage.selection[0].fills);
      }
      else if (currentFillOrStroke == "stroke") {
        setColorInUI(figma.currentPage.selection[0].strokes)
      }
      
    }
    else {
      let okhslReady = {
        "hue": 0,
        "saturation": 0,
        "lightness": 0
      }
    
      figma.ui.postMessage(okhslReady);
    }
  });

  figma.ui.onmessage = msg => {

    if (msg.type == "changeColor") {
      
      // console.log("changeColor");
      
      for (const node of figma.currentPage.selection) {

        function changeColor(nodeCopy) {
          if (msg.values.type == "hsl") {
            const hue = msg.values.hue / 360;
            const saturation = msg.values.saturation / 100;
            const lightness = msg.values.lightness / 100;

            const sRgbResult = okhsl_to_srgb(hue, saturation, lightness);

            const rgbInitials = ["r", "g", "b"];

            for (let i = 0; i < sRgbResult.length; i++) {
              if (sRgbResult[i] < 0) {
                nodeCopy[0].color[rgbInitials[i]] = 0;
              }
              else if (sRgbResult[i] > 255) {
                nodeCopy[0].color[rgbInitials[i]] = 1;
              }
              else {
                nodeCopy[0].color[rgbInitials[i]] = sRgbResult[i] / 255;
              }
            }
          }
          else if (msg.values.type == "rgb") {
            nodeCopy[0].color.r = msg.values.r;
            nodeCopy[0].color.g = msg.values.g;
            nodeCopy[0].color.b = msg.values.b;
          }

          return nodeCopy;    
        }

        if (msg.fillOrStroke == "fill") {
          if ("fills" in node) {
            const nodeFills = node.fills;
            let nodeFillsCopy = JSON.parse(JSON.stringify(nodeFills));
  
            node.fills = changeColor(nodeFillsCopy);
          }
        }
        else if (msg.fillOrStroke == "stroke") {
          if ("strokes" in node) {
            const nodeStrokes = node.strokes;
            let nodeStrokesCopy = JSON.parse(JSON.stringify(nodeStrokes));
  
            node.strokes = changeColor(nodeStrokesCopy);
          }
        }

      }
    }
    else if (msg.type == "updateUIColor") {

      // console.log("updateUIColor");

      currentFillOrStroke = msg.fillOrStroke;

      if (msg.fillOrStroke == "fill") {
        setColorInUI(figma.currentPage.selection[0].fills);
      }
      else if (msg.fillOrStroke == "stroke") {
        setColorInUI(figma.currentPage.selection[0].strokes);
      }
    }

    // figma.closePlugin();
  }
  




// If the plugins isn't run in Figma, run this code
} else {
  // This plugin will open a window to prompt the user to enter a number, and
  // it will then create that many shapes and connectors on the screen.

  // This shows the HTML page in "ui.html".
  figma.showUI(__html__);

  // Calls to "parent.postMessage" from within the HTML page will trigger this
  // callback. The callback will be passed the "pluginMessage" property of the
  // posted message.
  figma.ui.onmessage = msg => {
    // One way of distinguishing between different types of messages sent from
    // your HTML page is to use an object with a "type" property like this.
    if (msg.type === 'create-shapes') {
      const numberOfShapes = msg.count;
      const nodes: SceneNode[] = [];
      for (let i = 0; i < numberOfShapes; i++) {
        const shape = figma.createShapeWithText();
        // You can set shapeType to one of: 'SQUARE' | 'ELLIPSE' | 'ROUNDED_RECTANGLE' | 'DIAMOND' | 'TRIANGLE_UP' | 'TRIANGLE_DOWN' | 'PARALLELOGRAM_RIGHT' | 'PARALLELOGRAM_LEFT'
        shape.shapeType = 'ROUNDED_RECTANGLE'
        shape.x = i * (shape.width + 200);
        shape.fills = [{type: 'SOLID', color: {r: 1, g: 0.5, b: 0}}];
        figma.currentPage.appendChild(shape);
        nodes.push(shape);
      };

      for (let i = 0; i < (numberOfShapes - 1); i++) {
        const connector = figma.createConnector();
        connector.strokeWeight = 8

        connector.connectorStart = {
          endpointNodeId: nodes[i].id,
          magnet: 'AUTO',
        };

        connector.connectorEnd = {
          endpointNodeId: nodes[i+1].id,
          magnet: 'AUTO',
        };
      };

      figma.currentPage.selection = nodes;
      figma.viewport.scrollAndZoomIntoView(nodes);
    }

    // Make sure to close the plugin when you're done. Otherwise the plugin will
    // keep running, which shows the cancel button at the bottom of the screen.
    figma.closePlugin();
  };
};
