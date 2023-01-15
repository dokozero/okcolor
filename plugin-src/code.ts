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


// Runs this code if the plugin is run in Figma
if (figma.editorType === 'figma') {

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
  




// If the plugins isn't run in Figma, run this code
}
// else {
//   // This plugin will open a window to prompt the user to enter a number, and
//   // it will then create that many shapes and connectors on the screen.

//   // This shows the HTML page in "ui.html".
//   figma.showUI(__html__);

//   // Calls to "parent.postMessage" from within the HTML page will trigger this
//   // callback. The callback will be passed the "pluginMessage" property of the
//   // posted message.
//   figma.ui.onmessage = msg => {
//     // One way of distinguishing between different types of messages sent from
//     // your HTML page is to use an object with a "type" property like this.
//     if (msg.type === 'create-shapes') {
//       const numberOfShapes = msg.count;
//       const nodes: SceneNode[] = [];
//       for (let i = 0; i < numberOfShapes; i++) {
//         const shape = figma.createShapeWithText();
//         // You can set shapeType to one of: 'SQUARE' | 'ELLIPSE' | 'ROUNDED_RECTANGLE' | 'DIAMOND' | 'TRIANGLE_UP' | 'TRIANGLE_DOWN' | 'PARALLELOGRAM_RIGHT' | 'PARALLELOGRAM_LEFT'
//         shape.shapeType = 'ROUNDED_RECTANGLE'
//         shape.x = i * (shape.width + 200);
//         shape.fills = [{type: 'SOLID', color: {r: 1, g: 0.5, b: 0}}];
//         figma.currentPage.appendChild(shape);
//         nodes.push(shape);
//       };

//       for (let i = 0; i < (numberOfShapes - 1); i++) {
//         const connector = figma.createConnector();
//         connector.strokeWeight = 8

//         connector.connectorStart = {
//           endpointNodeId: nodes[i].id,
//           magnet: 'AUTO',
//         };

//         connector.connectorEnd = {
//           endpointNodeId: nodes[i+1].id,
//           magnet: 'AUTO',
//         };
//       };

//       figma.currentPage.selection = nodes;
//       figma.viewport.scrollAndZoomIntoView(nodes);
//     }

//     // Make sure to close the plugin when you're done. Otherwise the plugin will
//     // keep running, which shows the cancel button at the bottom of the screen.
//     figma.closePlugin();
//   };
// };
