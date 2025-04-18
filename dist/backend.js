const J = [
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
], U = ["GROUP", "FRAME", "COMPONENT"];
function G() {
  var p, l, L, _, P, E;
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
    if (!J.includes(o.type))
      return e.uiMessageCode = "not_supported_type", e.nodeType = o.type, e;
  const r = t[0];
  (l = (p = r.fills[0]) == null ? void 0 : p.boundVariables) != null && l.color && console.log("True");
  const n = r.fills[0], s = r.strokes[0];
  if (!n && !s)
    return e.uiMessageCode = "no_color_in_shape", e;
  if ((n == null ? void 0 : n.type) !== "SOLID" && (s == null ? void 0 : s.type) !== "SOLID")
    return e.uiMessageCode = "no_solid_color", e;
  if (U.includes((L = r.parent) == null ? void 0 : L.type) && t.length === 1) {
    let o = r.parent;
    for (; o; )
      if (o.fills && ((_ = o.fills) == null ? void 0 : _.length) !== 0) {
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
    let o = 0, m = 0;
    for (const H of t)
      ((P = H.fills[0]) == null ? void 0 : P.type) === "SOLID" && o++, ((E = H.strokes[0]) == null ? void 0 : E.type) === "SOLID" && m++;
    if (t.length !== o && t.length !== m)
      return e.uiMessageCode = "not_all_shapes_have_fill_or_stroke", e;
    t.length !== o ? i = !1 : t.length !== m && (g = !1);
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
const d = {
  okhsvl: {
    colorCodes: 572,
    noColorCodes: 440
  },
  oklch: {
    contrastAndColorCodes: 639,
    contrastAndNoColorCodes: 507,
    noContrastAndColorCodes: 607,
    noContrastAndNoColorCodes: 475
  }
};
function F(t) {
  const { currentColorModel: e, isColorCodeInputsOpen: i, isContrastInputOpen: g } = t;
  return ["okhsv", "okhsl"].includes(e) ? i ? d.okhsvl.colorCodes : d.okhsvl.noColorCodes : ["oklch"].includes(e) ? g ? i ? d.oklch.contrastAndColorCodes : d.oklch.contrastAndNoColorCodes : i ? d.oklch.noContrastAndColorCodes : d.oklch.noContrastAndNoColorCodes : d.oklch.contrastAndColorCodes;
}
function S(t) {
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
let A, a = "fill", O, C, h, u, M, f, k, y = "", w, R = !1, c = {
  parentFill: null,
  fill: null,
  stroke: null
};
const Y = ["fills", "fillStyleId", "strokes", "strokeStyleId", "strokeWeight", "textStyleId", "paint"], b = () => {
  const t = F({
    currentColorModel: C,
    isColorCodeInputsOpen: k,
    isContrastInputOpen: h
  });
  figma.ui.resize(260, t);
}, N = () => {
  const t = G();
  return t.uiMessageCode ? (S({
    type: "displayUiMessage",
    data: {
      uiMessageCode: t.uiMessageCode,
      nodeType: t.nodeType
    }
  }), "uiMessageCode sent") : (c = JSON.parse(JSON.stringify(t.newColorsRgba)), "colorsRgba updated");
}, T = () => {
  var t;
  return (t = figma.currentPage) != null && t.selection[0] ? figma.currentPage.selection[0].id : "";
}, B = async () => {
  switch (figma.root.documentColorProfile) {
    case "SRGB":
    case "LEGACY":
      O = "rgb";
      break;
    case "DISPLAY_P3":
      O = "p3";
      break;
    default:
      O = "rgb";
      break;
  }
  const t = await figma.clientStorage.getAsync("userSettings") || '{"oklchHlDecimalPrecision": 1, "useSimplifiedChroma": false, "oklchInputOrder": "lch", "useHardwareAcceleration": true}';
  A = JSON.parse(t), h = await figma.clientStorage.getAsync("isContrastInputOpen") || !1, k = await figma.clientStorage.getAsync("isColorCodeInputsOpen") || !1, M = await figma.clientStorage.getAsync("currentContrastMethod") || "apca", C = await figma.clientStorage.getAsync("currentColorModel") || "oklch", w = await figma.clientStorage.getAsync("oklchRenderMode") || "square", C === "oklchCss" && (C = "oklch"), ["okhsv", "okhsl"].includes(C) ? (u = !1, f = !1) : (u = await figma.clientStorage.getAsync("lockRelativeChroma") || !1, f = await figma.clientStorage.getAsync("lockContrast") || !1);
  const e = F({
    currentColorModel: C,
    isColorCodeInputsOpen: k,
    isContrastInputOpen: h
  });
  figma.showUI(__html__, { width: 260, height: e, themeColors: !0 });
};
B();
const V = async () => {
  S({
    type: "syncLocalStorageValues",
    data: {
      newFigmaEditorType: figma.editorType,
      newUserSettings: A,
      newCurrentFileColorProfile: O,
      newIsContrastInputOpen: h,
      newLockRelativeChroma: u,
      newCurrentContrastMethod: M,
      newLockContrast: f,
      newIsColorCodeInputsOpen: k,
      newCurrentColorModel: C,
      newOklchRenderMode: w
    }
  }), N() !== "uiMessageCode sent" && (a = c.fill ? "fill" : "stroke", y = T(), S({
    type: "syncNewShape",
    data: {
      selectionId: y,
      newCurrentFillOrStroke: a,
      newColorsRgba: c,
      newLockRelativeChroma: u,
      newLockContrast: f
    }
  }));
}, D = () => {
  N() !== "uiMessageCode sent" && (a = c.fill ? "fill" : "stroke", y = T(), S({
    type: "syncNewShape",
    data: {
      selectionId: y,
      newCurrentFillOrStroke: a,
      newColorsRgba: c,
      newLockRelativeChroma: u,
      newLockContrast: f
    }
  }));
}, W = (t) => {
  if (R || t.documentChanges[0].type !== "PROPERTY_CHANGE" && t.documentChanges[0].type !== "STYLE_PROPERTY_CHANGE" || !t.documentChanges[0].properties.some((g) => Y.includes(g)))
    return;
  const i = JSON.parse(JSON.stringify(c));
  N() !== "uiMessageCode sent" && (JSON.stringify(i) !== JSON.stringify(c) && (a === "fill" && !c.fill ? a = "stroke" : a === "stroke" && !c.stroke && (a = "fill")), y = T(), S({
    type: "syncNewShape",
    data: {
      selectionId: y,
      newCurrentFillOrStroke: a,
      newColorsRgba: c,
      newLockRelativeChroma: u,
      newLockContrast: f
    }
  }));
};
figma.on("selectionchange", D);
figma.on("documentchange", W);
figma.on("close", () => {
  figma.off("selectionchange", D), figma.off("documentchange", W);
});
let I;
figma.ui.onmessage = (t) => {
  let e;
  switch (t.type) {
    case "triggerInit":
      V();
      break;
    case "updateShapeColor":
      e = t.data, R = !0, v({
        newColorRgba: e.newColorRgba,
        currentFillOrStroke: a,
        currentBgOrFg: e.newCurrentBgOrFg
      }), I && clearTimeout(I), I = setTimeout(() => {
        R = !1;
      }, 500);
      break;
    case "SyncUserSettings":
      e = t.data, A = e.newUserSettings, figma.clientStorage.setAsync("userSettings", JSON.stringify(e.newUserSettings));
      break;
    case "syncCurrentFillOrStroke":
      e = t.data, a = e.newCurrentFillOrStroke;
      break;
    case "syncCurrentColorModel":
      e = t.data, C = e.newCurrentColorModel, figma.clientStorage.setAsync("currentColorModel", e.newCurrentColorModel), b();
      break;
    case "syncIsContrastInputOpen":
      e = t.data, h = e.newIsContrastInputOpen, figma.clientStorage.setAsync("isContrastInputOpen", h), b();
      break;
    case "syncLockRelativeChroma":
      e = t.data, u = e.newLockRelativeChroma, figma.clientStorage.setAsync("lockRelativeChroma", e.newLockRelativeChroma);
      break;
    case "syncCurrentContrastMethod":
      e = t.data, M = e.newCurrentContrastMethod, figma.clientStorage.setAsync("currentContrastMethod", e.newCurrentContrastMethod);
      break;
    case "syncLockContrast":
      e = t.data, f = e.newLockContrast, figma.clientStorage.setAsync("lockContrast", e.newLockContrast);
      break;
    case "syncIsColorCodeInputsOpen":
      e = t.data, k = e.newIsColorCodeInputsOpen, figma.clientStorage.setAsync("isColorCodeInputsOpen", k), b();
      break;
    case "syncOklchRenderMode":
      e = t.data, w = e.newOklchRenderMode, figma.clientStorage.setAsync("oklchRenderMode", w);
      break;
  }
};
