export const PICKER_SIZE = 240
// We use a different value for the slider as they take less room.
export const SLIDER_SIZE = 148

export const RES_PICKER_FACTOR_OKHSLV = 0.5
export const RES_PICKER_FACTOR_OKLCH = 0.25

export const RES_PICKER_SIZE_OKHSLV = PICKER_SIZE / RES_PICKER_FACTOR_OKHSLV
export const RES_PICKER_SIZE_OKLCH = PICKER_SIZE / RES_PICKER_FACTOR_OKLCH

export const OKLCH_CHROMA_SCALE = 2.7

export const MAX_CHROMA_P3 = 0.37

// Set to true to be able to run the index.html from dist/ in the browser (usefull for debugging, especially the rendering of color picker).
export const dontUseBackend = false

// prettier-ignore
// Comment the line you don't want.
export const consoleLogInfos = [
  // 'Store updates',
  // 'Component renders',
  ''
]
