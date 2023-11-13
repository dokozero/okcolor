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
  var p, a, M, N, L;
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
    if (!F.includes(o.type))
      return e.uiMessageCode = "not_supported_type", e.nodeType = o.type, e;
  const r = t[0], n = r.fills[0], s = r.strokes[0];
  if (!n && !s)
    return e.uiMessageCode = "no_color_in_shape", e;
  if ((n == null ? void 0 : n.type) !== "SOLID" && (s == null ? void 0 : s.type) !== "SOLID")
    return e.uiMessageCode = "no_solid_color", e;
  if ((((p = r.parent) == null ? void 0 : p.type) === "GROUP" || ((a = r.parent) == null ? void 0 : a.type) === "FRAME") && t.length === 1) {
    let o = r.parent;
    for (; o; )
      if (o.fills && ((M = o.fills) == null ? void 0 : M.length) !== 0) {
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
    let o = 0, w = 0;
    for (const T of t)
      ((N = T.fills[0]) == null ? void 0 : N.type) === "SOLID" && o++, ((L = T.strokes[0]) == null ? void 0 : L.type) === "SOLID" && w++;
    if (t.length !== o && t.length !== w)
      return e.uiMessageCode = "not_all_shapes_have_fill_or_stroke", e;
    t.length !== o ? l = !1 : t.length !== w && (C = !1);
  }
  return (n == null ? void 0 : n.type) === "SOLID" && l && (e.newColorsRgba.fill = {
    r: n.color.r,
    g: n.color.g,
    b: n.color.b,
    a: n.opacity
  }), (s == null ? void 0 : s.type) === "SOLID" && C && (e.newColorsRgba.stroke = {
    r: s.color.r,
    g: s.color.g,
    b: s.color.b,
    a: s.opacity
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
function _(t) {
  const { currentColorModel: e, isColorCodeInputsOpen: l, isContrastInputOpen: C } = t;
  return ["okhsv", "okhsl"].includes(e) ? l ? f.okhsvl.colorCodes : f.okhsvl.noColorCodes : ["oklch"].includes(e) ? C ? l ? f.oklch.contrastAndColorCodes : f.oklch.contrastAndNoColorCodes : l ? f.oklch.noContrastAndColorCodes : f.oklch.noContrastAndNoColorCodes : f.oklch.contrastAndColorCodes;
}
function k(t) {
  figma.ui.postMessage({ type: t.type, data: t.data });
}
function J(t) {
  var s;
  const { newColorRgba: e, currentFillOrStroke: l, currentBgOrFg: C } = t;
  let r;
  const n = l + "s";
  for (const p of figma.currentPage.selection) {
    let a;
    if (C === "bg") {
      for (a = p.parent; a && !(a.type !== "GROUP" && ((s = a.fills) == null ? void 0 : s.length) !== 0); )
        if (a.parent)
          a = a.parent;
        else
          break;
      r = JSON.parse(JSON.stringify(a.fills));
    } else
      r = JSON.parse(JSON.stringify(p[n]));
    r[0].color.r = e.r, r[0].color.g = e.g, r[0].color.b = e.b, r[0].opacity = e.a, C === "bg" ? a.fills = r : p[n] = r;
  }
}
let b, i = "fill", S, g, h, u, A, d, y, I = !1, c = {
  parentFill: null,
  fill: null,
  stroke: null
};
const U = ["fills", "fillStyleId", "strokes", "strokeStyleId", "strokeWeight", "textStyleId"], O = () => {
  const t = _({
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
  const t = await figma.clientStorage.getAsync("userSettings") || '{"useSimplifiedChroma": false, "oklchInputOrder": "lch", "useHardwareAcceleration": true}';
  b = JSON.parse(t), h = await figma.clientStorage.getAsync("isContrastInputOpen") || !1, y = await figma.clientStorage.getAsync("isColorCodeInputsOpen") || !1, A = await figma.clientStorage.getAsync("currentContrastMethod") || "apca", g = await figma.clientStorage.getAsync("currentColorModel") || "oklch", g === "oklchCss" && (g = "oklch"), ["okhsv", "okhsl"].includes(g) ? (u = !1, d = !1) : (u = await figma.clientStorage.getAsync("lockRelativeChroma") || !1, d = await figma.clientStorage.getAsync("lockContrast") || !1);
  const e = _({
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
      newUserSettings: b,
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
}, E = () => {
  R() !== "uiMessageCode sent" && (i = c.fill ? "fill" : "stroke", k({
    type: "syncNewShape",
    data: {
      newCurrentFillOrStroke: i,
      newColorsRgba: c,
      newLockRelativeChroma: u,
      newLockContrast: d
    }
  }));
}, P = (t) => {
  if (I || t.documentChanges[0].type !== "PROPERTY_CHANGE")
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
figma.on("selectionchange", E);
figma.on("documentchange", P);
figma.on("close", () => {
  figma.off("selectionchange", E), figma.off("documentchange", P);
});
let m;
figma.ui.onmessage = (t) => {
  let e;
  switch (t.type) {
    case "triggerInit":
      v();
      break;
    case "updateShapeColor":
      e = t.data, I = !0, J({
        newColorRgba: e.newColorRgba,
        currentFillOrStroke: i,
        currentBgOrFg: e.newCurrentBgOrFg
      }), m && clearTimeout(m), m = setTimeout(() => {
        I = !1;
      }, 500);
      break;
    case "SyncUserSettings":
      e = t.data, b = e.newUserSettings, figma.clientStorage.setAsync("userSettings", JSON.stringify(e.newUserSettings));
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
