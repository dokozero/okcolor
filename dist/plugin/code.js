"use strict";let s="fill",n,u,p=!1,o={hasFillStroke:{fill:!1,stroke:!1},colors:{fill:{rgba:[255,255,255,0]},stroke:{rgba:[255,255,255,0]}}};const S=["BOOLEAN_OPERATION","COMPONENT","ELLIPSE","FRAME","INSTANCE","LINE","POLYGON","RECTANGLE","STAR","TEXT","VECTOR","SHAPE_WITH_TEXT","HIGHLIGHT"],d=["fills","fillStyleId","strokes","strokeWeight"],y=function(){o.hasFillStroke.fill=!1,o.hasFillStroke.stroke=!1,o.colors.fill.rgba=[255,255,255,0],o.colors.stroke.rgba=[255,255,255,0]},k=function(){var a,h;y();const e=figma.currentPage.selection;if(!e[0])return c("noSelection"),!1;for(const t of e)if(!S.includes(t.type))return c("notSupportedType",t.type),!1;const r=e[0].fills[0],l=e[0].strokes[0];if(!r&&!l)return c("noColorInShape"),!1;if((r==null?void 0:r.type)!=="SOLID"&&(l==null?void 0:l.type)!=="SOLID")return c("noSolidColor"),!1;if((r==null?void 0:r.type)==="SOLID"&&(o.hasFillStroke.fill=!0,o.colors.fill.rgba[0]=r.color.r*255,o.colors.fill.rgba[1]=r.color.g*255,o.colors.fill.rgba[2]=r.color.b*255,o.colors.fill.rgba[3]=Math.round(r.opacity*100)),(l==null?void 0:l.type)==="SOLID"&&(o.hasFillStroke.stroke=!0,o.colors.stroke.rgba[0]=l.color.r*255,o.colors.stroke.rgba[1]=l.color.g*255,o.colors.stroke.rgba[2]=l.color.b*255,o.colors.stroke.rgba[3]=Math.round(l.opacity*100)),e.length>1){let t=0,i=0;for(const f of e)((a=f.fills[0])==null?void 0:a.type)==="SOLID"&&t++,((h=f.strokes[0])==null?void 0:h.type)==="SOLID"&&i++;if(e.length!==t&&e.length!==i)return c("notAllShapesHaveFillOrStroke"),!1;i<t?o.hasFillStroke.stroke=!1:t<i&&(o.hasFillStroke.fill=!1)}return!0},I=function(){figma.ui.postMessage({message:"init",data:{currentColorModel:n,showCssColorCodes:u}})},C=function(e=!1){figma.ui.postMessage({message:"newShapeColor",shapeInfos:o,currentFillOrStroke:s,shouldRenderColorPickerCanvas:e})},c=function(e,r=""){figma.ui.postMessage({message:"displayUIMessage",UIMessageCode:e,nodeType:r})};figma.on("selectionchange",()=>{s="fill",k()&&(s==="fill"&&!o.hasFillStroke.fill?s="stroke":s==="stroke"&&!o.hasFillStroke.stroke&&(s="fill"),C(!0))});figma.on("documentchange",e=>{if(p)return;if(e.documentChanges[0].type==="PROPERTY_CHANGE"){const l=e.documentChanges[0].properties[0];if(d.includes(l)){let a=Object.assign({},o.hasFillStroke);if(!k())return;if(JSON.stringify(a)!==JSON.stringify(o.hasFillStroke)){s==="fill"&&!o.hasFillStroke.fill?s="stroke":s==="stroke"&&!o.hasFillStroke.stroke&&(s="fill"),C(!0);return}s==="fill"&&l==="strokes"||s==="stroke"&&l==="fills"?C():C(!0)}}});let g;figma.ui.onmessage=e=>{if(e.type==="init")O();else if(e.type==="updateShapeColor"){p=!0;const r=e.newColor[0]/255,l=e.newColor[1]/255,a=e.newColor[2]/255,h=e.newColor[3]/100;let t;const i=s+"s";for(const f of figma.currentPage.selection)i in f&&(t=JSON.parse(JSON.stringify(f[i])),t[0].color.r=r,t[0].color.g=l,t[0].color.b=a,t[0].opacity=h,f[i]=t);g&&clearTimeout(g),g=setTimeout(()=>{p=!1},500)}else e.type==="syncCurrentFillOrStroke"?s=e.currentFillOrStroke:e.type==="syncCurrentColorModel"?figma.clientStorage.setAsync("currentColorModel",e.currentColorModel):e.type==="syncShowCssColorCodes"&&(e.showCssColorCodes?figma.ui.resize(240,520):figma.ui.resize(240,392),figma.clientStorage.setAsync("showCssColorCodes",e.showCssColorCodes))};figma.showUI(__html__,{width:240,height:392,themeColors:!0});const O=async function(){n=await figma.clientStorage.getAsync("currentColorModel"),n!=="okhsv"&&n!=="okhsl"&&n!=="oklch"&&n!=="oklchCss"&&(n="oklchCss"),u=await figma.clientStorage.getAsync("showCssColorCodes"),u===void 0&&(u=!1),u&&figma.ui.resize(240,490),I(),k()&&(o.hasFillStroke.fill?s="fill":s="stroke",C(!0))};
