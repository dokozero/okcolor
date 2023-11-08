const L = [
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
function F() {
  var a, M, N, R, T;
  const o = figma.currentPage.selection, e = {
    newColorsRgba: {
      parentFill: null,
      fill: null,
      stroke: null
    },
    uiMessageCode: null,
    nodeType: null
  };
  let l = !0, n = !0;
  if (!o[0])
    return e.uiMessageCode = "no_selection", e;
  for (const t of o)
    if (!L.includes(t.type))
      return e.uiMessageCode = "not_supported_type", e.nodeType = t.type, e;
  const f = o[0], s = f.fills[0], r = f.strokes[0];
  if (!s && !r)
    return e.uiMessageCode = "no_color_in_shape", e;
  if ((s == null ? void 0 : s.type) !== "SOLID" && (r == null ? void 0 : r.type) !== "SOLID")
    return e.uiMessageCode = "no_solid_color", e;
  if (((a = f.parent) == null ? void 0 : a.type) !== "GROUP" || ((M = f.parent) == null ? void 0 : M.type) !== "PAGE") {
    let t = f.parent;
    for (; t; )
      if (t.fills && ((N = t.fills) == null ? void 0 : N.length) !== 0) {
        t.fills[0].type === "SOLID" && (e.newColorsRgba.parentFill = {
          r: t.fills[0].color.r,
          g: t.fills[0].color.g,
          b: t.fills[0].color.b
        });
        break;
      } else if (t.parent)
        t = t.parent;
      else
        break;
  }
  if (o.length > 1) {
    e.newColorsRgba.parentFill && (e.newColorsRgba.parentFill = null);
    let t = 0, S = 0;
    for (const w of o)
      ((R = w.fills[0]) == null ? void 0 : R.type) === "SOLID" && t++, ((T = w.strokes[0]) == null ? void 0 : T.type) === "SOLID" && S++;
    if (o.length !== t && o.length !== S)
      return e.uiMessageCode = "not_all_shapes_have_fill_or_stroke", e;
    o.length !== t ? l = !1 : o.length !== S && (n = !1);
  }
  return (s == null ? void 0 : s.type) === "SOLID" && l && (e.newColorsRgba.fill = {
    r: s.color.r,
    g: s.color.g,
    b: s.color.b,
    a: s.opacity
  }), (r == null ? void 0 : r.type) === "SOLID" && n && (e.newColorsRgba.stroke = {
    r: r.color.r,
    g: r.color.g,
    b: r.color.b,
    a: r.opacity
  }), e;
}
const g = {
  okhsvl: {
    colorCodes: 564,
    noColorCodes: 435
  },
  oklch: {
    contrastAndColorCodes: 680,
    contrastAndNoColorCodes: 550,
    noContrastAndColorCodes: 647,
    noContrastAndNoColorCodes: 517
  }
};
function _(o) {
  const { currentColorModel: e, isColorCodeInputsOpen: l, isContrastInputOpen: n } = o;
  return ["okhsv", "okhsl"].includes(e) ? l ? g.okhsvl.colorCodes : g.okhsvl.noColorCodes : ["oklch", "oklchCss"].includes(e) ? n ? l ? g.oklch.contrastAndColorCodes : g.oklch.contrastAndNoColorCodes : l ? g.oklch.noContrastAndColorCodes : g.oklch.noContrastAndNoColorCodes : g.oklch.contrastAndColorCodes;
}
function h(o) {
  figma.ui.postMessage({ type: o.type, data: o.data });
}
function H(o, e, l) {
  var s;
  let n;
  const f = e + "s";
  for (const r of figma.currentPage.selection) {
    let a;
    if (l === "bg") {
      for (a = r.parent; a && !(a.type !== "GROUP" && ((s = a.fills) == null ? void 0 : s.length) !== 0); )
        if (a.parent)
          a = a.parent;
        else
          break;
      n = JSON.parse(JSON.stringify(a.fills));
    } else
      n = JSON.parse(JSON.stringify(r[f]));
    n[0].color.r = o.r, n[0].color.g = o.g, n[0].color.b = o.b, n[0].opacity = o.a, l === "bg" ? a.fills = n : r[f] = n;
  }
}
let i = "fill", k, C, p, d, b, u, y, I = !1, c = {
  parentFill: null,
  fill: null,
  stroke: null
};
const J = ["fills", "fillStyleId", "strokes", "strokeStyleId", "strokeWeight", "textStyleId"], m = () => {
  const o = _({
    currentColorModel: C,
    isColorCodeInputsOpen: y,
    isContrastInputOpen: p
  });
  figma.ui.resize(240, o);
}, A = () => {
  const o = F();
  return o.uiMessageCode ? (h({
    type: "displayUiMessage",
    data: {
      uiMessageCode: o.uiMessageCode,
      nodeType: o.nodeType
    }
  }), "uiMessageCode sent") : (c = JSON.parse(JSON.stringify(o.newColorsRgba)), "colorsRgba updated");
}, D = async () => {
  figma.editorType === "figma" ? k = await figma.clientStorage.getAsync("currentFileColorProfile") || "rgb" : figma.editorType === "figjam" && (k = "rgb"), p = await figma.clientStorage.getAsync("isContrastInputOpen") || !1, y = await figma.clientStorage.getAsync("isColorCodeInputsOpen") || !1, b = await figma.clientStorage.getAsync("currentContrastMethod") || "apca", C = await figma.clientStorage.getAsync("currentColorModel") || "oklchCss", C === "okhsv" || C === "okhsl" ? (d = !1, u = !1) : (d = await figma.clientStorage.getAsync("lockRelativeChroma") || !1, u = await figma.clientStorage.getAsync("lockContrast") || !1);
  const o = _({
    currentColorModel: C,
    isColorCodeInputsOpen: y,
    isContrastInputOpen: p
  });
  figma.showUI(__html__, { width: 240, height: o, themeColors: !0 });
};
D();
const G = async () => {
  h({
    type: "syncLocalStorageValues",
    data: {
      figmaEditorType: figma.editorType,
      currentFileColorProfile: k,
      isContrastInputOpen: p,
      lockRelativeChroma: d,
      currentContrastMethod: b,
      lockContrast: u,
      isColorCodeInputsOpen: y,
      currentColorModel: C
    }
  }), A() !== "uiMessageCode sent" && (i = c.fill ? "fill" : "stroke", h({
    type: "syncNewShape",
    data: {
      currentFillOrStroke: i,
      colorsRgba: c,
      lockRelativeChroma: d,
      lockContrast: u
    }
  }));
}, E = () => {
  A() !== "uiMessageCode sent" && (i = c.fill ? "fill" : "stroke", h({
    type: "syncNewShape",
    data: {
      currentFillOrStroke: i,
      colorsRgba: c,
      lockRelativeChroma: d,
      lockContrast: u
    }
  }));
}, P = (o) => {
  if (I || o.documentChanges[0].type !== "PROPERTY_CHANGE")
    return;
  if (o.documentChanges[0].properties.some((l) => J.includes(l))) {
    const l = JSON.parse(JSON.stringify(c));
    if (A() === "uiMessageCode sent")
      return;
    JSON.stringify(l) !== JSON.stringify(c) && (i === "fill" && !c.fill ? i = "stroke" : i === "stroke" && !c.stroke && (i = "fill")), h({
      type: "syncNewShape",
      data: {
        currentFillOrStroke: i,
        colorsRgba: c,
        lockRelativeChroma: d,
        lockContrast: u
      }
    });
  }
};
figma.on("selectionchange", E);
figma.on("documentchange", P);
figma.on("close", () => {
  figma.off("selectionchange", E), figma.off("documentchange", P);
});
let O;
figma.ui.onmessage = (o) => {
  let e;
  switch (o.type) {
    case "triggerInit":
      G();
      break;
    case "updateShapeColor":
      e = o.data, I = !0, H(e.newColorRgba, i, e.currentBgOrFg), O && clearTimeout(O), O = setTimeout(() => {
        I = !1;
      }, 500);
      break;
    case "syncCurrentFileColorProfile":
      e = o.data, k = e.currentFileColorProfile, figma.clientStorage.setAsync("currentFileColorProfile", e.currentFileColorProfile);
      break;
    case "syncCurrentFillOrStroke":
      e = o.data, i = e.currentFillOrStroke;
      break;
    case "syncCurrentColorModel":
      e = o.data, C = e.currentColorModel, figma.clientStorage.setAsync("currentColorModel", e.currentColorModel), m();
      break;
    case "syncIsContrastInputOpen":
      e = o.data, p = e.isContrastInputOpen, figma.clientStorage.setAsync("isContrastInputOpen", p), m();
      break;
    case "syncLockRelativeChroma":
      e = o.data, d = e.lockRelativeChroma, figma.clientStorage.setAsync("lockRelativeChroma", e.lockRelativeChroma);
      break;
    case "syncCurrentContrastMethod":
      e = o.data, b = e.currentContrastMethod, figma.clientStorage.setAsync("currentContrastMethod", e.currentContrastMethod);
      break;
    case "syncLockContrast":
      e = o.data, u = e.lockContrast, figma.clientStorage.setAsync("lockContrast", e.lockContrast);
      break;
    case "syncIsColorCodeInputsOpen":
      e = o.data, y = e.isColorCodeInputsOpen, figma.clientStorage.setAsync("isColorCodeInputsOpen", y), m();
      break;
  }
};
