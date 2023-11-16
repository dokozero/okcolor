const _ = [
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
], F = ["GROUP", "FRAME", "COMPONENT"];
function H() {
  var p, a, M, N;
  const t = figma.currentPage.selection, e = {
    newColorsRgba: {
      parentFill: null,
      fill: null,
      stroke: null
    },
    uiMessageCode: null,
    nodeType: null
  };
  let l = !0, C = !0;
  if (!t[0])
    return e.uiMessageCode = "no_selection", e;
  for (const o of t)
    if (!_.includes(o.type))
      return e.uiMessageCode = "not_supported_type", e.nodeType = o.type, e;
  const s = t[0], r = s.fills[0], n = s.strokes[0];
  if (!r && !n)
    return e.uiMessageCode = "no_color_in_shape", e;
  if ((r == null ? void 0 : r.type) !== "SOLID" && (n == null ? void 0 : n.type) !== "SOLID")
    return e.uiMessageCode = "no_solid_color", e;
  if (F.includes((p = s.parent) == null ? void 0 : p.type) && t.length === 1) {
    let o = s.parent;
    for (; o; )
      if (o.fills && ((a = o.fills) == null ? void 0 : a.length) !== 0) {
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
    let o = 0, w = 0;
    for (const L of t)
      ((M = L.fills[0]) == null ? void 0 : M.type) === "SOLID" && o++, ((N = L.strokes[0]) == null ? void 0 : N.type) === "SOLID" && w++;
    if (t.length !== o && t.length !== w)
      return e.uiMessageCode = "not_all_shapes_have_fill_or_stroke", e;
    t.length !== o ? l = !1 : t.length !== w && (C = !1);
  }
  return (r == null ? void 0 : r.type) === "SOLID" && l && (e.newColorsRgba.fill = {
    r: r.color.r,
    g: r.color.g,
    b: r.color.b,
    a: r.opacity
  }), (n == null ? void 0 : n.type) === "SOLID" && C && (e.newColorsRgba.stroke = {
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
function T(t) {
  const { currentColorModel: e, isColorCodeInputsOpen: l, isContrastInputOpen: C } = t;
  return ["okhsv", "okhsl"].includes(e) ? l ? f.okhsvl.colorCodes : f.okhsvl.noColorCodes : ["oklch"].includes(e) ? C ? l ? f.oklch.contrastAndColorCodes : f.oklch.contrastAndNoColorCodes : l ? f.oklch.noContrastAndColorCodes : f.oklch.noContrastAndNoColorCodes : f.oklch.contrastAndColorCodes;
}
function k(t) {
  figma.ui.postMessage({ type: t.type, data: t.data });
}
function J(t) {
  var n;
  const { newColorRgba: e, currentFillOrStroke: l, currentBgOrFg: C } = t;
  let s;
  const r = l + "s";
  for (const p of figma.currentPage.selection) {
    let a;
    if (C === "bg") {
      for (a = p.parent; a && !(a.type !== "GROUP" && ((n = a.fills) == null ? void 0 : n.length) !== 0); )
        if (a.parent)
          a = a.parent;
        else
          break;
      s = JSON.parse(JSON.stringify(a.fills));
    } else
      s = JSON.parse(JSON.stringify(p[r]));
    s[0].color.r = e.r, s[0].color.g = e.g, s[0].color.b = e.b, s[0].opacity = e.a, C === "bg" ? a.fills = s : p[r] = s;
  }
}
let I, i = "fill", S, g, h, u, A, d, y, b = !1, c = {
  parentFill: null,
  fill: null,
  stroke: null
};
const U = ["fills", "fillStyleId", "strokes", "strokeStyleId", "strokeWeight", "textStyleId"], O = () => {
  const t = T({
    currentColorModel: g,
    isColorCodeInputsOpen: y,
    isContrastInputOpen: h
  });
  figma.ui.resize(240, t);
}, R = () => {
  const t = H();
  return t.uiMessageCode ? (k({
    type: "displayUiMessage",
    data: {
      uiMessageCode: t.uiMessageCode,
      nodeType: t.nodeType
    }
  }), "uiMessageCode sent") : (c = JSON.parse(JSON.stringify(t.newColorsRgba)), "colorsRgba updated");
}, D = async () => {
  figma.editorType === "figma" ? S = await figma.clientStorage.getAsync("currentFileColorProfile") || "rgb" : figma.editorType === "figjam" && (S = "rgb");
  const t = await figma.clientStorage.getAsync("userSettings") || '{"oklchHlDecimalPrecision": 1, "useSimplifiedChroma": false, "oklchInputOrder": "lch", "useHardwareAcceleration": true}';
  I = JSON.parse(t), h = await figma.clientStorage.getAsync("isContrastInputOpen") || !1, y = await figma.clientStorage.getAsync("isColorCodeInputsOpen") || !1, A = await figma.clientStorage.getAsync("currentContrastMethod") || "apca", g = await figma.clientStorage.getAsync("currentColorModel") || "oklch", g === "oklchCss" && (g = "oklch"), ["okhsv", "okhsl"].includes(g) ? (u = !1, d = !1) : (u = await figma.clientStorage.getAsync("lockRelativeChroma") || !1, d = await figma.clientStorage.getAsync("lockContrast") || !1);
  const e = T({
    currentColorModel: g,
    isColorCodeInputsOpen: y,
    isContrastInputOpen: h
  });
  figma.showUI(__html__, { width: 240, height: e, themeColors: !0 });
};
D();
const v = async () => {
  k({
    type: "syncLocalStorageValues",
    data: {
      newFigmaEditorType: figma.editorType,
      newUserSettings: I,
      newCurrentFileColorProfile: S,
      newIsContrastInputOpen: h,
      newLockRelativeChroma: u,
      newCurrentContrastMethod: A,
      newLockContrast: d,
      newIsColorCodeInputsOpen: y,
      newCurrentColorModel: g
    }
  }), R() !== "uiMessageCode sent" && (i = c.fill ? "fill" : "stroke", k({
    type: "syncNewShape",
    data: {
      newCurrentFillOrStroke: i,
      newColorsRgba: c,
      newLockRelativeChroma: u,
      newLockContrast: d
    }
  }));
}, P = () => {
  R() !== "uiMessageCode sent" && (i = c.fill ? "fill" : "stroke", k({
    type: "syncNewShape",
    data: {
      newCurrentFillOrStroke: i,
      newColorsRgba: c,
      newLockRelativeChroma: u,
      newLockContrast: d
    }
  }));
}, E = (t) => {
  if (b || t.documentChanges[0].type !== "PROPERTY_CHANGE")
    return;
  if (t.documentChanges[0].properties.some((l) => U.includes(l))) {
    const l = JSON.parse(JSON.stringify(c));
    if (R() === "uiMessageCode sent")
      return;
    JSON.stringify(l) !== JSON.stringify(c) && (i === "fill" && !c.fill ? i = "stroke" : i === "stroke" && !c.stroke && (i = "fill")), k({
      type: "syncNewShape",
      data: {
        newCurrentFillOrStroke: i,
        newColorsRgba: c,
        newLockRelativeChroma: u,
        newLockContrast: d
      }
    });
  }
};
figma.on("selectionchange", P);
figma.on("documentchange", E);
figma.on("close", () => {
  figma.off("selectionchange", P), figma.off("documentchange", E);
});
let m;
figma.ui.onmessage = (t) => {
  let e;
  switch (t.type) {
    case "triggerInit":
      v();
      break;
    case "updateShapeColor":
      e = t.data, b = !0, J({
        newColorRgba: e.newColorRgba,
        currentFillOrStroke: i,
        currentBgOrFg: e.newCurrentBgOrFg
      }), m && clearTimeout(m), m = setTimeout(() => {
        b = !1;
      }, 500);
      break;
    case "SyncUserSettings":
      e = t.data, I = e.newUserSettings, figma.clientStorage.setAsync("userSettings", JSON.stringify(e.newUserSettings));
      break;
    case "syncCurrentFileColorProfile":
      e = t.data, S = e.newCurrentFileColorProfile, figma.clientStorage.setAsync("currentFileColorProfile", e.newCurrentFileColorProfile);
      break;
    case "syncCurrentFillOrStroke":
      e = t.data, i = e.newCurrentFillOrStroke;
      break;
    case "syncCurrentColorModel":
      e = t.data, g = e.newCurrentColorModel, figma.clientStorage.setAsync("currentColorModel", e.newCurrentColorModel), O();
      break;
    case "syncIsContrastInputOpen":
      e = t.data, h = e.newIsContrastInputOpen, figma.clientStorage.setAsync("isContrastInputOpen", h), O();
      break;
    case "syncLockRelativeChroma":
      e = t.data, u = e.newLockRelativeChroma, figma.clientStorage.setAsync("lockRelativeChroma", e.newLockRelativeChroma);
      break;
    case "syncCurrentContrastMethod":
      e = t.data, A = e.newCurrentContrastMethod, figma.clientStorage.setAsync("currentContrastMethod", e.newCurrentContrastMethod);
      break;
    case "syncLockContrast":
      e = t.data, d = e.newLockContrast, figma.clientStorage.setAsync("lockContrast", e.newLockContrast);
      break;
    case "syncIsColorCodeInputsOpen":
      e = t.data, y = e.newIsColorCodeInputsOpen, figma.clientStorage.setAsync("isColorCodeInputsOpen", y), O();
      break;
  }
};
