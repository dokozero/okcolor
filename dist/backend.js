const F = [
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
function H() {
  var a, N, R, T, w;
  const t = figma.currentPage.selection, e = {
    newColorsRgba: {
      parentFill: null,
      fill: null,
      stroke: null
    },
    uiMessageCode: null,
    nodeType: null
  };
  let l = !0, n = !0;
  if (!t[0])
    return e.uiMessageCode = "no_selection", e;
  for (const o of t)
    if (!F.includes(o.type))
      return e.uiMessageCode = "not_supported_type", e.nodeType = o.type, e;
  const g = t[0], s = g.fills[0], r = g.strokes[0];
  if (!s && !r)
    return e.uiMessageCode = "no_color_in_shape", e;
  if ((s == null ? void 0 : s.type) !== "SOLID" && (r == null ? void 0 : r.type) !== "SOLID")
    return e.uiMessageCode = "no_solid_color", e;
  if ((((a = g.parent) == null ? void 0 : a.type) === "GROUP" || ((N = g.parent) == null ? void 0 : N.type) === "FRAME") && t.length === 1) {
    let o = g.parent;
    for (; o; )
      if (o.fills && ((R = o.fills) == null ? void 0 : R.length) !== 0) {
        o.fills[0].type === "SOLID" && (e.newColorsRgba.parentFill = {
          r: o.fills[0].color.r,
          g: o.fills[0].color.g,
          b: o.fills[0].color.b
        });
        break;
      } else if (o.parent)
        o = o.parent;
      else
        break;
  }
  if (t.length > 1) {
    let o = 0, k = 0;
    for (const _ of t)
      ((T = _.fills[0]) == null ? void 0 : T.type) === "SOLID" && o++, ((w = _.strokes[0]) == null ? void 0 : w.type) === "SOLID" && k++;
    if (t.length !== o && t.length !== k)
      return e.uiMessageCode = "not_all_shapes_have_fill_or_stroke", e;
    t.length !== o ? l = !1 : t.length !== k && (n = !1);
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
const d = {
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
function E(t) {
  const { currentColorModel: e, isColorCodeInputsOpen: l, isContrastInputOpen: n } = t;
  return ["okhsv", "okhsl"].includes(e) ? l ? d.okhsvl.colorCodes : d.okhsvl.noColorCodes : ["oklch"].includes(e) ? n ? l ? d.oklch.contrastAndColorCodes : d.oklch.contrastAndNoColorCodes : l ? d.oklch.noContrastAndColorCodes : d.oklch.noContrastAndNoColorCodes : d.oklch.contrastAndColorCodes;
}
function y(t) {
  figma.ui.postMessage({ type: t.type, data: t.data });
}
function J(t, e, l) {
  var s;
  let n;
  const g = e + "s";
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
      n = JSON.parse(JSON.stringify(r[g]));
    n[0].color.r = t.r, n[0].color.g = t.g, n[0].color.b = t.b, n[0].opacity = t.a, l === "bg" ? a.fills = n : r[g] = n;
  }
}
let I, i = "fill", S, f, p, u, b, C, h, A = !1, c = {
  parentFill: null,
  fill: null,
  stroke: null
};
const U = ["fills", "fillStyleId", "strokes", "strokeStyleId", "strokeWeight", "textStyleId"], m = () => {
  const t = E({
    currentColorModel: f,
    isColorCodeInputsOpen: h,
    isContrastInputOpen: p
  });
  figma.ui.resize(240, t);
}, M = () => {
  const t = H();
  return t.uiMessageCode ? (y({
    type: "displayUiMessage",
    data: {
      uiMessageCode: t.uiMessageCode,
      nodeType: t.nodeType
    }
  }), "uiMessageCode sent") : (c = JSON.parse(JSON.stringify(t.newColorsRgba)), "colorsRgba updated");
}, D = async () => {
  figma.editorType === "figma" ? S = await figma.clientStorage.getAsync("currentFileColorProfile") || "rgb" : figma.editorType === "figjam" && (S = "rgb");
  const t = await figma.clientStorage.getAsync("userSettings") || '{"useSimplifiedChroma": false, "oklchInputOrder": "lch", "useHardwareAcceleration": true}';
  I = JSON.parse(t), p = await figma.clientStorage.getAsync("isContrastInputOpen") || !1, h = await figma.clientStorage.getAsync("isColorCodeInputsOpen") || !1, b = await figma.clientStorage.getAsync("currentContrastMethod") || "apca", f = await figma.clientStorage.getAsync("currentColorModel") || "oklch", f === "oklchCss" && (f = "oklch"), ["okhsv", "okhsl"].includes(f) ? (u = !1, C = !1) : (u = await figma.clientStorage.getAsync("lockRelativeChroma") || !1, C = await figma.clientStorage.getAsync("lockContrast") || !1);
  const e = E({
    currentColorModel: f,
    isColorCodeInputsOpen: h,
    isContrastInputOpen: p
  });
  figma.showUI(__html__, { width: 240, height: e, themeColors: !0 });
};
D();
const G = async () => {
  y({
    type: "syncLocalStorageValues",
    data: {
      figmaEditorType: figma.editorType,
      userSettings: I,
      currentFileColorProfile: S,
      isContrastInputOpen: p,
      lockRelativeChroma: u,
      currentContrastMethod: b,
      lockContrast: C,
      isColorCodeInputsOpen: h,
      currentColorModel: f
    }
  }), M() !== "uiMessageCode sent" && (i = c.fill ? "fill" : "stroke", y({
    type: "syncNewShape",
    data: {
      currentFillOrStroke: i,
      colorsRgba: c,
      lockRelativeChroma: u,
      lockContrast: C
    }
  }));
}, P = () => {
  M() !== "uiMessageCode sent" && (i = c.fill ? "fill" : "stroke", y({
    type: "syncNewShape",
    data: {
      currentFillOrStroke: i,
      colorsRgba: c,
      lockRelativeChroma: u,
      lockContrast: C
    }
  }));
}, L = (t) => {
  if (A || t.documentChanges[0].type !== "PROPERTY_CHANGE")
    return;
  if (t.documentChanges[0].properties.some((l) => U.includes(l))) {
    const l = JSON.parse(JSON.stringify(c));
    if (M() === "uiMessageCode sent")
      return;
    JSON.stringify(l) !== JSON.stringify(c) && (i === "fill" && !c.fill ? i = "stroke" : i === "stroke" && !c.stroke && (i = "fill")), y({
      type: "syncNewShape",
      data: {
        currentFillOrStroke: i,
        colorsRgba: c,
        lockRelativeChroma: u,
        lockContrast: C
      }
    });
  }
};
figma.on("selectionchange", P);
figma.on("documentchange", L);
figma.on("close", () => {
  figma.off("selectionchange", P), figma.off("documentchange", L);
});
let O;
figma.ui.onmessage = (t) => {
  let e;
  switch (t.type) {
    case "triggerInit":
      G();
      break;
    case "updateShapeColor":
      e = t.data, A = !0, J(e.newColorRgba, i, e.currentBgOrFg), O && clearTimeout(O), O = setTimeout(() => {
        A = !1;
      }, 500);
      break;
    case "SyncUserSettings":
      e = t.data, I = e.userSettings, figma.clientStorage.setAsync("userSettings", JSON.stringify(e.userSettings));
      break;
    case "syncCurrentFileColorProfile":
      e = t.data, S = e.currentFileColorProfile, figma.clientStorage.setAsync("currentFileColorProfile", e.currentFileColorProfile);
      break;
    case "syncCurrentFillOrStroke":
      e = t.data, i = e.currentFillOrStroke;
      break;
    case "syncCurrentColorModel":
      e = t.data, f = e.currentColorModel, figma.clientStorage.setAsync("currentColorModel", e.currentColorModel), m();
      break;
    case "syncIsContrastInputOpen":
      e = t.data, p = e.isContrastInputOpen, figma.clientStorage.setAsync("isContrastInputOpen", p), m();
      break;
    case "syncLockRelativeChroma":
      e = t.data, u = e.lockRelativeChroma, figma.clientStorage.setAsync("lockRelativeChroma", e.lockRelativeChroma);
      break;
    case "syncCurrentContrastMethod":
      e = t.data, b = e.currentContrastMethod, figma.clientStorage.setAsync("currentContrastMethod", e.currentContrastMethod);
      break;
    case "syncLockContrast":
      e = t.data, C = e.lockContrast, figma.clientStorage.setAsync("lockContrast", e.lockContrast);
      break;
    case "syncIsColorCodeInputsOpen":
      e = t.data, h = e.isColorCodeInputsOpen, figma.clientStorage.setAsync("isColorCodeInputsOpen", h), m();
      break;
  }
};
