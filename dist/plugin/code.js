"use strict";let r="fill",a,k=!1,e={hasFillStroke:{fill:!1,stroke:!1},colors:{fill:{rgba:[255,255,255,0]},stroke:{rgba:[255,255,255,0]}}};const C=function(){e.hasFillStroke.fill=!1,e.hasFillStroke.stroke=!1,e.colors.fill.rgba=[255,255,255,0],e.colors.stroke.rgba=[255,255,255,0]},h=function(){var g,n;C();const o=["BOOLEAN_OPERATION","COMPONENT","ELLIPSE","FRAME","INSTANCE","LINE","POLYGON","RECTANGLE","STAR","TEXT","VECTOR","SHAPE_WITH_TEXT","HIGHLIGHT"],s=figma.currentPage.selection;if(!s[0])return c("noSelection"),!1;for(const i of s)if(!o.includes(i.type))return c("notSupportedType",i.type),!1;const l=s[0].fills[0],t=s[0].strokes[0];if(!l&&!t)return c("noColorInShape"),!1;if((l==null?void 0:l.type)!=="SOLID"&&(t==null?void 0:t.type)!=="SOLID")return c("noSolidColor"),!1;if((l==null?void 0:l.type)==="SOLID"&&(e.hasFillStroke.fill=!0,e.colors.fill.rgba[0]=l.color.r*255,e.colors.fill.rgba[1]=l.color.g*255,e.colors.fill.rgba[2]=l.color.b*255,e.colors.fill.rgba[3]=Math.round(l.opacity*100)),(t==null?void 0:t.type)==="SOLID"&&(e.hasFillStroke.stroke=!0,e.colors.stroke.rgba[0]=t.color.r*255,e.colors.stroke.rgba[1]=t.color.g*255,e.colors.stroke.rgba[2]=t.color.b*255,e.colors.stroke.rgba[3]=Math.round(t.opacity*100)),s.length>1){let i=0,f=0;for(const S of s)((g=S.fills[0])==null?void 0:g.type)==="SOLID"&&i++,((n=S.strokes[0])==null?void 0:n.type)==="SOLID"&&f++;if(s.length!==i&&s.length!==f)return c("notAllShapesHaveFillOrStroke"),!1;f<i?e.hasFillStroke.stroke=!1:i<f&&(e.hasFillStroke.fill=!1)}return!0},d=function(){figma.ui.postMessage({message:"init",currentColorModel:a})},u=function(o=!1){figma.ui.postMessage({message:"newShapeColor",shapeInfos:e,currentFillOrStroke:r,shouldRenderColorPickerCanvas:o})},c=function(o,s=""){figma.ui.postMessage({message:"displayUIMessage",UIMessageCode:o,nodeType:s})};figma.showUI(__html__,{width:240,height:346,themeColors:!0});const y=async function(){a=await figma.clientStorage.getAsync("currentColorModel"),a!=="okhsv"&&a!=="okhsl"&&a!=="oklch"&&(a="okhsl"),d(),h()&&(e.hasFillStroke.fill?r="fill":r="stroke",u(!0))};y();figma.on("selectionchange",()=>{r="fill",h()&&(r==="fill"&&!e.hasFillStroke.fill?r="stroke":r==="stroke"&&!e.hasFillStroke.stroke&&(r="fill"),u(!0))});figma.on("documentchange",o=>{if(k)return;if(o.documentChanges[0].type==="PROPERTY_CHANGE"){const l=o.documentChanges[0].properties[0];if(l==="fills"||l==="strokes"){let t=Object.assign({},e.hasFillStroke);if(!h())return;if(JSON.stringify(t)!==JSON.stringify(e.hasFillStroke)){r==="fill"&&!e.hasFillStroke.fill?r="stroke":r==="stroke"&&!e.hasFillStroke.stroke&&(r="fill"),u(!0);return}r==="fill"&&l==="strokes"||r==="stroke"&&l==="fills"?u():u(!0)}}});let p;figma.ui.onmessage=o=>{if(o.type==="updateShapeColor"){k=!0;const s=o.newColor[0]/255,l=o.newColor[1]/255,t=o.newColor[2]/255,g=o.newColor[3]/100;let n;const i=r+"s";for(const f of figma.currentPage.selection)i in f&&(n=JSON.parse(JSON.stringify(f[i])),n[0].color.r=s,n[0].color.g=l,n[0].color.b=t,n[0].opacity=g,f[i]=n);p&&clearTimeout(p),p=setTimeout(()=>{k=!1},500)}else o.type==="syncCurrentFillOrStroke"?r=o.currentFillOrStroke:o.type==="syncCurrentColorModel"&&figma.clientStorage.setAsync("currentColorModel",o.currentColorModel)};
