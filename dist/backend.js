"use strict";const _=["BOOLEAN_OPERATION","COMPONENT","ELLIPSE","FRAME","INSTANCE","LINE","POLYGON","RECTANGLE","STAR","TEXT","VECTOR","SHAPE_WITH_TEXT","HIGHLIGHT"];function E(){var u,p,f,n;const o=figma.currentPage.selection,e={newColorsRgba:{parentFill:null,fill:null,stroke:null},uiMessageCode:null,nodeType:null};if(!o[0])return e.uiMessageCode="no_selection",e;for(const s of o)if(!_.includes(s.type))return e.uiMessageCode="not_supported_type",e.nodeType=s.type,e;const l=o[0],r=l.fills[0],t=l.strokes[0];if(!r&&!t)return e.uiMessageCode="no_color_in_shape",e;if((r==null?void 0:r.type)!=="SOLID"&&(t==null?void 0:t.type)!=="SOLID")return e.uiMessageCode="no_solid_color",e;if((r==null?void 0:r.type)==="SOLID"&&(e.newColorsRgba.fill={r:r.color.r*255,g:r.color.g*255,b:r.color.b*255,a:Math.round(r.opacity*100)}),(t==null?void 0:t.type)==="SOLID"&&(e.newColorsRgba.stroke={r:t.color.r*255,g:t.color.g*255,b:t.color.b*255,a:Math.round(t.opacity*100)}),(u=l.parent)!=null&&u.fills){let s=l.parent;for(;s;)if(s.fills&&((p=s==null?void 0:s.fills)==null?void 0:p.length)!==0){e.newColorsRgba.parentFill={r:s.fills[0].color.r*255,g:s.fills[0].color.g*255,b:s.fills[0].color.b*255};break}else if(s.parent)s=s.parent;else break}if(o.length>1){e.newColorsRgba.parentFill&&(e.newColorsRgba.parentFill=null);let s=0,A=0;for(const M of o)((f=M.fills[0])==null?void 0:f.type)==="SOLID"&&s++,((n=M.strokes[0])==null?void 0:n.type)==="SOLID"&&A++;if(o.length!==s&&o.length!==A)return e.uiMessageCode="not_all_shapes_have_fill_or_stroke",e}return e}const c={okhsvl:{colorCodes:564,noColorCodes:435},oklch:{contrastAndColorCodes:680,contrastAndNoColorCodes:550,noContrastAndColorCodes:647,noContrastAndNoColorCodes:517}};function R(o){const{currentColorModel:e,isColorCodeInputsOpen:l,isContrastInputOpen:r}=o;return["okhsv","okhsl"].includes(e)?l?c.okhsvl.colorCodes:c.okhsvl.noColorCodes:["oklch","oklchCss"].includes(e)?r?l?c.oklch.contrastAndColorCodes:c.oklch.contrastAndNoColorCodes:l?c.oklch.noContrastAndColorCodes:c.oklch.noContrastAndNoColorCodes:c.oklch.contrastAndColorCodes}function y(o){figma.ui.postMessage({type:o.type,data:o.data})}function P(o,e,l){var p;const r={r:o.r/255,g:o.g/255,b:o.b/255,a:o.a/100};let t;const u=e+"s";for(const f of figma.currentPage.selection){let n;if(l==="bg"){for(n=f.parent;n&&((p=n.fills)==null?void 0:p.length)===0;)if(n.parent)n=n.parent;else break;t=JSON.parse(JSON.stringify(n.fills))}else t=JSON.parse(JSON.stringify(f[u]));t[0].color.r=r.r,t[0].color.g=r.g,t[0].color.b=r.b,t[0].opacity=r.a,l==="bg"?n.fills=t:f[u]=t}}let a="fill",m,g,C,S,T,O,d,b=!1,i={parentFill:null,fill:null,stroke:null};const L=["fills","fillStyleId","strokes","strokeStyleId","strokeWeight","textStyleId"],h=()=>{const o=R({currentColorModel:g,isColorCodeInputsOpen:d,isContrastInputOpen:C});figma.ui.resize(240,o)},I=()=>{const o=E();return o.uiMessageCode?(y({type:"displayUiMessage",data:{uiMessageCode:o.uiMessageCode,nodeType:o.nodeType}}),"uiMessageCode sent"):(i=JSON.parse(JSON.stringify(o.newColorsRgba)),"colorsRgba updated")},F=async()=>{figma.editorType==="figma"?m=await figma.clientStorage.getAsync("fileColorProfile")||"rgb":figma.editorType==="figjam"&&(m="rgb"),C=await figma.clientStorage.getAsync("isContrastInputOpen")||!1,d=await figma.clientStorage.getAsync("isColorCodeInputsOpen")||!1,T=await figma.clientStorage.getAsync("currentContrastMethod")||"apca",g=await figma.clientStorage.getAsync("currentColorModel")||"oklchCss",g==="okhsv"||g==="okhsl"?(S=!1,O=!1):(S=await figma.clientStorage.getAsync("lockRelativeChroma")||!1,O=await figma.clientStorage.getAsync("lockContrast")||!1);const o=R({currentColorModel:g,isColorCodeInputsOpen:d,isContrastInputOpen:C});figma.showUI(__html__,{width:240,height:o,themeColors:!0})};F();const H=async()=>{y({type:"syncLocalStorageValues",data:{figmaEditorType:figma.editorType,fileColorProfile:m,isContrastInputOpen:C,lockRelativeChroma:S,currentContrastMethod:T,lockContrast:O,isColorCodeInputsOpen:d,currentColorModel:g}}),I()!=="uiMessageCode sent"&&(a=i.fill?"fill":"stroke",y({type:"syncCurrentFillOrStrokeAndColorsRgba",data:{currentFillOrStroke:a,colorsRgba:i}}))},N=()=>{I()!=="uiMessageCode sent"&&(a=i.fill?"fill":"stroke",y({type:"syncCurrentFillOrStrokeAndColorsRgba",data:{currentFillOrStroke:a,colorsRgba:i}}))},w=o=>{if(b||o.documentChanges[0].type!=="PROPERTY_CHANGE")return;if(o.documentChanges[0].properties.some(l=>L.includes(l))){const l=JSON.parse(JSON.stringify(i));if(I()==="uiMessageCode sent")return;JSON.stringify(l)!==JSON.stringify(i)&&(a==="fill"&&!i.fill?a="stroke":a==="stroke"&&!i.stroke&&(a="fill")),y({type:"syncCurrentFillOrStrokeAndColorsRgba",data:{currentFillOrStroke:a,colorsRgba:i}})}};figma.on("selectionchange",N);figma.on("documentchange",w);figma.on("close",()=>{figma.off("selectionchange",N),figma.off("documentchange",w)});let k;figma.ui.onmessage=o=>{let e;switch(o.type){case"triggerInit":H();break;case"updateShapeColor":e=o.data,b=!0,P(e.newColorRgba,a,e.currentBgOrFg),k&&clearTimeout(k),k=setTimeout(()=>{b=!1},500);break;case"syncFileColorProfile":e=o.data,figma.clientStorage.setAsync("fileColorProfile",e.fileColorProfile);break;case"syncCurrentFillOrStroke":e=o.data,a=e.currentFillOrStroke;break;case"syncCurrentColorModel":e=o.data,g=e.currentColorModel,h(),figma.clientStorage.setAsync("currentColorModel",e.currentColorModel);break;case"syncIsContrastInputOpen":e=o.data,C=e.isContrastInputOpen,h(),figma.clientStorage.setAsync("isContrastInputOpen",C);break;case"syncLockRelativeChroma":e=o.data,figma.clientStorage.setAsync("lockRelativeChroma",e.lockRelativeChroma);break;case"syncCurrentContrastMethod":e=o.data,figma.clientStorage.setAsync("currentContrastMethod",e.currentContrastMethod);break;case"syncLockContrast":e=o.data,figma.clientStorage.setAsync("lockContrast",e.lockContrast);break;case"syncIsColorCodeInputsOpen":e=o.data,d=e.isColorCodeInputsOpen,h(),figma.clientStorage.setAsync("isColorCodeInputsOpen",d);break}};
