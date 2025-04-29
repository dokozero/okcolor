// Set to false to be able to run the index.html from dist/ in the browser (usefull for debugging, especially the rendering of color picker).
export const useBackend = true

export const WINDOW_WIDTH = 260

export const PICKER_SIZE = WINDOW_WIDTH - 32

// We use a different value for the slider as they take less room.
export const SLIDER_SIZE = 161

export const OKLCH_CHROMA_SCALE = 2.7

export const MAX_CHROMA_P3 = 0.368

// prettier-ignore
// Comment the lines you don't want.
export const consoleLogInfos = [
  // 'Store updates',
  // 'Component renders',
  // 'App loading speed',
  // 'Color picker rendering speed',
  ''
]
