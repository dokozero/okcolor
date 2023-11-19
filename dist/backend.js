const H = [
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
], J = ["GROUP", "FRAME", "COMPONENT"];
function U() {
  var p, l, T, L;
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
    if (!H.includes(o.type))
      return e.uiMessageCode = "not_supported_type", e.nodeType = o.type, e;
  const s = t[0], r = s.fills[0], n = s.strokes[0];
  if (!r && !n)
    return e.uiMessageCode = "no_color_in_shape", e;
  if ((r == null ? void 0 : r.type) !== "SOLID" && (n == null ? void 0 : n.type) !== "SOLID")
    return e.uiMessageCode = "no_solid_color", e;
  if (J.includes((p = s.parent) == null ? void 0 : p.type) && t.length === 1) {
    let o = s.parent;
    for (; o; )
      if (o.fills && ((l = o.fills) == null ? void 0 : l.length) !== 0) {
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
    for (const P of t)
      ((T = P.fills[0]) == null ? void 0 : T.type) === "SOLID" && o++, ((L = P.strokes[0]) == null ? void 0 : L.type) === "SOLID" && O++;
    if (t.length !== o && t.length !== O)
      return e.uiMessageCode = "not_all_shapes_have_fill_or_stroke", e;
    t.length !== o ? i = !1 : t.length !== O && (g = !1);
  }
  return (r == null ? void 0 : r.type) === "SOLID" && i && (e.newColorsRgba.fill = {
    r: r.color.r,
    g: r.color.g,
    b: r.color.b,
    a: r.opacity
  }), (n == null ? void 0 : n.type) === "SOLID" && g && (e.newColorsRgba.stroke = {
    r: n.color.r,
    g: n.color.g,
    b: n.color.b,
    a: n.opacity
  }), e;
}
const f = {
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
function E(t) {
  const { currentColorModel: e, isColorCodeInputsOpen: i, isContrastInputOpen: g } = t;
  return ["okhsv", "okhsl"].includes(e) ? i ? f.okhsvl.colorCodes : f.okhsvl.noColorCodes : ["oklch"].includes(e) ? g ? i ? f.oklch.contrastAndColorCodes : f.oklch.contrastAndNoColorCodes : i ? f.oklch.noContrastAndColorCodes : f.oklch.noContrastAndNoColorCodes : f.oklch.contrastAndColorCodes;
}
function S(t) {
  figma.ui.postMessage({ type: t.type, data: t.data });
}
function D(t) {
  var n;
  const { newColorRgba: e, currentFillOrStroke: i, currentBgOrFg: g } = t;
  let s;
  const r = i + "s";
  for (const p of figma.currentPage.selection) {
    let l;
    if (g === "bg") {
      for (l = p.parent; l && !(l.type !== "GROUP" && ((n = l.fills) == null ? void 0 : n.length) !== 0); )
        if (l.parent)
          l = l.parent;
        else
          break;
      s = JSON.parse(JSON.stringify(l.fills));
    } else
      s = JSON.parse(JSON.stringify(p[r]));
    s[0].color.r = e.r, s[0].color.g = e.g, s[0].color.b = e.b, s[0].opacity = e.a, g === "bg" ? l.fills = s : p[r] = s;
  }
}
let A, a = "fill", w, C, h, u, R, d, y, k = "", b = !1, c = {
  parentFill: null,
  fill: null,
  stroke: null
};
const G = ["fills", "fillStyleId", "strokes", "strokeStyleId", "strokeWeight", "textStyleId", "paint"], m = () => {
  const t = E({
    currentColorModel: C,
    isColorCodeInputsOpen: y,
    isContrastInputOpen: h
  });
  figma.ui.resize(240, t);
}, M = () => {
  const t = U();
  return t.uiMessageCode ? (S({
    type: "displayUiMessage",
    data: {
      uiMessageCode: t.uiMessageCode,
      nodeType: t.nodeType
    }
  }), "uiMessageCode sent") : (c = JSON.parse(JSON.stringify(t.newColorsRgba)), "colorsRgba updated");
}, N = () => {
  var t;
  return (t = figma.currentPage) != null && t.selection[0] ? figma.currentPage.selection[0].id : "";
}, v = async () => {
  figma.editorType === "figma" ? w = await figma.clientStorage.getAsync("currentFileColorProfile") || "rgb" : figma.editorType === "figjam" && (w = "rgb");
  const t = await figma.clientStorage.getAsync("userSettings") || '{"oklchHlDecimalPrecision": 1, "useSimplifiedChroma": false, "oklchInputOrder": "lch", "useHardwareAcceleration": true}';
  A = JSON.parse(t), h = await figma.clientStorage.getAsync("isContrastInputOpen") || !1, y = await figma.clientStorage.getAsync("isColorCodeInputsOpen") || !1, R = await figma.clientStorage.getAsync("currentContrastMethod") || "apca", C = await figma.clientStorage.getAsync("currentColorModel") || "oklch", C === "oklchCss" && (C = "oklch"), ["okhsv", "okhsl"].includes(C) ? (u = !1, d = !1) : (u = await figma.clientStorage.getAsync("lockRelativeChroma") || !1, d = await figma.clientStorage.getAsync("lockContrast") || !1);
  const e = E({
    currentColorModel: C,
    isColorCodeInputsOpen: y,
    isContrastInputOpen: h
  });
  figma.showUI(__html__, { width: 240, height: e, themeColors: !0 });
};
v();
const W = async () => {
  S({
    type: "syncLocalStorageValues",
    data: {
      newFigmaEditorType: figma.editorType,
      newUserSettings: A,
      newCurrentFileColorProfile: w,
      newIsContrastInputOpen: h,
      newLockRelativeChroma: u,
      newCurrentContrastMethod: R,
      newLockContrast: d,
      newIsColorCodeInputsOpen: y,
      newCurrentColorModel: C
    }
  }), M() !== "uiMessageCode sent" && (a = c.fill ? "fill" : "stroke", k = N(), S({
    type: "syncNewShape",
    data: {
      selectionId: k,
      newCurrentFillOrStroke: a,
      newColorsRgba: c,
      newLockRelativeChroma: u,
      newLockContrast: d
    }
  }));
}, _ = () => {
  M() !== "uiMessageCode sent" && (a = c.fill ? "fill" : "stroke", k = N(), S({
    type: "syncNewShape",
    data: {
      selectionId: k,
      newCurrentFillOrStroke: a,
      newColorsRgba: c,
      newLockRelativeChroma: u,
      newLockContrast: d
    }
  }));
}, F = (t) => {
  if (b || t.documentChanges[0].type !== "PROPERTY_CHANGE" && t.documentChanges[0].type !== "STYLE_PROPERTY_CHANGE" || !t.documentChanges[0].properties.some((g) => G.includes(g)))
    return;
  const i = JSON.parse(JSON.stringify(c));
  M() !== "uiMessageCode sent" && (JSON.stringify(i) !== JSON.stringify(c) && (a === "fill" && !c.fill ? a = "stroke" : a === "stroke" && !c.stroke && (a = "fill")), k = N(), S({
    type: "syncNewShape",
    data: {
      selectionId: k,
      newCurrentFillOrStroke: a,
      newColorsRgba: c,
      newLockRelativeChroma: u,
      newLockContrast: d
    }
  }));
};
figma.on("selectionchange", _);
figma.on("documentchange", F);
figma.on("close", () => {
  figma.off("selectionchange", _), figma.off("documentchange", F);
});
let I;
figma.ui.onmessage = (t) => {
  let e;
  switch (t.type) {
    case "triggerInit":
      W();
      break;
    case "updateShapeColor":
      e = t.data, b = !0, D({
        newColorRgba: e.newColorRgba,
        currentFillOrStroke: a,
        currentBgOrFg: e.newCurrentBgOrFg
      }), I && clearTimeout(I), I = setTimeout(() => {
        b = !1;
      }, 500);
      break;
    case "SyncUserSettings":
      e = t.data, A = e.newUserSettings, figma.clientStorage.setAsync("userSettings", JSON.stringify(e.newUserSettings));
      break;
    case "syncCurrentFileColorProfile":
      e = t.data, w = e.newCurrentFileColorProfile, figma.clientStorage.setAsync("currentFileColorProfile", e.newCurrentFileColorProfile);
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
      e = t.data, u = e.newLockRelativeChroma, figma.clientStorage.setAsync("lockRelativeChroma", e.newLockRelativeChroma);
      break;
    case "syncCurrentContrastMethod":
      e = t.data, R = e.newCurrentContrastMethod, figma.clientStorage.setAsync("currentContrastMethod", e.newCurrentContrastMethod);
      break;
    case "syncLockContrast":
      e = t.data, d = e.newLockContrast, figma.clientStorage.setAsync("lockContrast", e.newLockContrast);
      break;
    case "syncIsColorCodeInputsOpen":
      e = t.data, y = e.newIsColorCodeInputsOpen, figma.clientStorage.setAsync("isColorCodeInputsOpen", y), m();
      break;
  }
};
