const U = [
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
], D = ["GROUP", "FRAME", "COMPONENT"];
function G() {
  var p, l, L, P, T, E;
  const t = figma.currentPage.selection, e = {
    newColorsRgba: {
      parentFill: null,
      fill: null,
      stroke: null
    },
    uiMessageCode: null,
    nodeType: null
  };
  let i = !0, g = !0;
  if (!t[0])
    return e.uiMessageCode = "no_selection", e;
  for (const o of t)
    if (!U.includes(o.type))
      return e.uiMessageCode = "not_supported_type", e.nodeType = o.type, e;
  const r = t[0];
  (l = (p = r.fills[0]) == null ? void 0 : p.boundVariables) != null && l.color && console.log("True");
  const n = r.fills[0], s = r.strokes[0];
  if (!n && !s)
    return e.uiMessageCode = "no_color_in_shape", e;
  if ((n == null ? void 0 : n.type) !== "SOLID" && (s == null ? void 0 : s.type) !== "SOLID")
    return e.uiMessageCode = "no_solid_color", e;
  if (D.includes((L = r.parent) == null ? void 0 : L.type) && t.length === 1) {
    let o = r.parent;
    for (; o; )
      if (o.fills && ((P = o.fills) == null ? void 0 : P.length) !== 0) {
        if (o.fills[0].type !== "SOLID")
          break;
        e.newColorsRgba.parentFill = {
          r: o.fills[0].color.r,
          g: o.fills[0].color.g,
          b: o.fills[0].color.b
        };
        break;
      } else if (o.parent)
        o = o.parent;
      else
        break;
  }
  if (t.length > 1) {
    let o = 0, O = 0;
    for (const _ of t)
      ((T = _.fills[0]) == null ? void 0 : T.type) === "SOLID" && o++, ((E = _.strokes[0]) == null ? void 0 : E.type) === "SOLID" && O++;
    if (t.length !== o && t.length !== O)
      return e.uiMessageCode = "not_all_shapes_have_fill_or_stroke", e;
    t.length !== o ? i = !1 : t.length !== O && (g = !1);
  }
  return (n == null ? void 0 : n.type) === "SOLID" && i && (e.newColorsRgba.fill = {
    r: n.color.r,
    g: n.color.g,
    b: n.color.b,
    a: n.opacity
  }), (s == null ? void 0 : s.type) === "SOLID" && g && (e.newColorsRgba.stroke = {
    r: s.color.r,
    g: s.color.g,
    b: s.color.b,
    a: s.opacity
  }), e;
}
const u = {
  okhsvl: {
    colorCodes: 564,
    noColorCodes: 435
  },
  oklch: {
    contrastAndColorCodes: 681,
    contrastAndNoColorCodes: 552,
    noContrastAndColorCodes: 647,
    noContrastAndNoColorCodes: 516
  }
};
function F(t) {
  const { currentColorModel: e, isColorCodeInputsOpen: i, isContrastInputOpen: g } = t;
  return ["okhsv", "okhsl"].includes(e) ? i ? u.okhsvl.colorCodes : u.okhsvl.noColorCodes : ["oklch"].includes(e) ? g ? i ? u.oklch.contrastAndColorCodes : u.oklch.contrastAndNoColorCodes : i ? u.oklch.noContrastAndColorCodes : u.oklch.noContrastAndNoColorCodes : u.oklch.contrastAndColorCodes;
}
function w(t) {
  figma.ui.postMessage({ type: t.type, data: t.data });
}
function v(t) {
  var s;
  const { newColorRgba: e, currentFillOrStroke: i, currentBgOrFg: g } = t;
  let r;
  const n = i + "s";
  for (const p of figma.currentPage.selection) {
    let l;
    if (g === "bg") {
      for (l = p.parent; l && !(l.type !== "GROUP" && ((s = l.fills) == null ? void 0 : s.length) !== 0); )
        if (l.parent)
          l = l.parent;
        else
          break;
      r = JSON.parse(JSON.stringify(l.fills));
    } else
      r = JSON.parse(JSON.stringify(p[n]));
    r[0].color.r = e.r, r[0].color.g = e.g, r[0].color.b = e.b, r[0].opacity = e.a, g === "bg" ? l.fills = r : p[n] = r;
  }
}
let A, a = "fill", S, C, h, f, R, d, k, y = "", I = !1, c = {
  parentFill: null,
  fill: null,
  stroke: null
};
const W = ["fills", "fillStyleId", "strokes", "strokeStyleId", "strokeWeight", "textStyleId", "paint"], m = () => {
  const t = F({
    currentColorModel: C,
    isColorCodeInputsOpen: k,
    isContrastInputOpen: h
  });
  figma.ui.resize(240, t);
}, M = () => {
  const t = G();
  return t.uiMessageCode ? (w({
    type: "displayUiMessage",
    data: {
      uiMessageCode: t.uiMessageCode,
      nodeType: t.nodeType
    }
  }), "uiMessageCode sent") : (c = JSON.parse(JSON.stringify(t.newColorsRgba)), "colorsRgba updated");
}, N = () => {
  var t;
  return (t = figma.currentPage) != null && t.selection[0] ? figma.currentPage.selection[0].id : "";
}, Y = async () => {
  switch (figma.root.documentColorProfile) {
    case "SRGB":
    case "LEGACY":
      S = "rgb";
      break;
    case "DISPLAY_P3":
      S = "p3";
      break;
    default:
      S = "rgb";
      break;
  }
  const t = await figma.clientStorage.getAsync("userSettings") || '{"oklchHlDecimalPrecision": 1, "useSimplifiedChroma": false, "oklchInputOrder": "lch", "useHardwareAcceleration": true}';
  A = JSON.parse(t), h = await figma.clientStorage.getAsync("isContrastInputOpen") || !1, k = await figma.clientStorage.getAsync("isColorCodeInputsOpen") || !1, R = await figma.clientStorage.getAsync("currentContrastMethod") || "apca", C = await figma.clientStorage.getAsync("currentColorModel") || "oklch", C === "oklchCss" && (C = "oklch"), ["okhsv", "okhsl"].includes(C) ? (f = !1, d = !1) : (f = await figma.clientStorage.getAsync("lockRelativeChroma") || !1, d = await figma.clientStorage.getAsync("lockContrast") || !1);
  const e = F({
    currentColorModel: C,
    isColorCodeInputsOpen: k,
    isContrastInputOpen: h
  });
  figma.showUI(__html__, { width: 240, height: e, themeColors: !0 });
};
Y();
const B = async () => {
  w({
    type: "syncLocalStorageValues",
    data: {
      newFigmaEditorType: figma.editorType,
      newUserSettings: A,
      newCurrentFileColorProfile: S,
      newIsContrastInputOpen: h,
      newLockRelativeChroma: f,
      newCurrentContrastMethod: R,
      newLockContrast: d,
      newIsColorCodeInputsOpen: k,
      newCurrentColorModel: C
    }
  }), M() !== "uiMessageCode sent" && (a = c.fill ? "fill" : "stroke", y = N(), w({
    type: "syncNewShape",
    data: {
      selectionId: y,
      newCurrentFillOrStroke: a,
      newColorsRgba: c,
      newLockRelativeChroma: f,
      newLockContrast: d
    }
  }));
}, H = () => {
  M() !== "uiMessageCode sent" && (a = c.fill ? "fill" : "stroke", y = N(), w({
    type: "syncNewShape",
    data: {
      selectionId: y,
      newCurrentFillOrStroke: a,
      newColorsRgba: c,
      newLockRelativeChroma: f,
      newLockContrast: d
    }
  }));
}, J = (t) => {
  if (I || t.documentChanges[0].type !== "PROPERTY_CHANGE" && t.documentChanges[0].type !== "STYLE_PROPERTY_CHANGE" || !t.documentChanges[0].properties.some((g) => W.includes(g)))
    return;
  const i = JSON.parse(JSON.stringify(c));
  M() !== "uiMessageCode sent" && (JSON.stringify(i) !== JSON.stringify(c) && (a === "fill" && !c.fill ? a = "stroke" : a === "stroke" && !c.stroke && (a = "fill")), y = N(), w({
    type: "syncNewShape",
    data: {
      selectionId: y,
      newCurrentFillOrStroke: a,
      newColorsRgba: c,
      newLockRelativeChroma: f,
      newLockContrast: d
    }
  }));
};
figma.on("selectionchange", H);
figma.on("documentchange", J);
figma.on("close", () => {
  figma.off("selectionchange", H), figma.off("documentchange", J);
});
let b;
figma.ui.onmessage = (t) => {
  let e;
  switch (t.type) {
    case "triggerInit":
      B();
      break;
    case "updateShapeColor":
      e = t.data, I = !0, v({
        newColorRgba: e.newColorRgba,
        currentFillOrStroke: a,
        currentBgOrFg: e.newCurrentBgOrFg
      }), b && clearTimeout(b), b = setTimeout(() => {
        I = !1;
      }, 500);
      break;
    case "SyncUserSettings":
      e = t.data, A = e.newUserSettings, figma.clientStorage.setAsync("userSettings", JSON.stringify(e.newUserSettings));
      break;
    case "syncCurrentFileColorProfile":
      e = t.data, S = e.newCurrentFileColorProfile, figma.clientStorage.setAsync("currentFileColorProfile", e.newCurrentFileColorProfile);
      break;
    case "syncCurrentFillOrStroke":
      e = t.data, a = e.newCurrentFillOrStroke;
      break;
    case "syncCurrentColorModel":
      e = t.data, C = e.newCurrentColorModel, figma.clientStorage.setAsync("currentColorModel", e.newCurrentColorModel), m();
      break;
    case "syncIsContrastInputOpen":
      e = t.data, h = e.newIsContrastInputOpen, figma.clientStorage.setAsync("isContrastInputOpen", h), m();
      break;
    case "syncLockRelativeChroma":
      e = t.data, f = e.newLockRelativeChroma, figma.clientStorage.setAsync("lockRelativeChroma", e.newLockRelativeChroma);
      break;
    case "syncCurrentContrastMethod":
      e = t.data, R = e.newCurrentContrastMethod, figma.clientStorage.setAsync("currentContrastMethod", e.newCurrentContrastMethod);
      break;
    case "syncLockContrast":
      e = t.data, d = e.newLockContrast, figma.clientStorage.setAsync("lockContrast", e.newLockContrast);
      break;
    case "syncIsColorCodeInputsOpen":
      e = t.data, k = e.newIsColorCodeInputsOpen, figma.clientStorage.setAsync("isColorCodeInputsOpen", k), m();
      break;
  }
};
