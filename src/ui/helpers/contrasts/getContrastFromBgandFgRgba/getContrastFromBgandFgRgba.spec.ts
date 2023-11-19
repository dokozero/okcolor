import { describe, expect, test } from 'vitest'
import getContrastFromBgandFgRgba from './getContrastFromBgandFgRgba'

describe('getContrastFromBgandFgRgba()', () => {
  test('-33', () => {
    expect(
      getContrastFromBgandFgRgba({
        fg: {
          r: 0.25,
          g: 0.5,
          b: 0.75,
          a: 1
        },
        bg: {
          r: 0,
          g: 0,
          b: 0
        },
        currentContrastMethod: 'apca',
        currentFileColorProfile: 'p3'
      })
    ).toStrictEqual(-33)
  })

  test('-33', () => {
    expect(
      getContrastFromBgandFgRgba({
        fg: {
          r: 0.25,
          g: 0.5,
          b: 0.75,
          a: 1
        },
        bg: {
          r: 0,
          g: 0,
          b: 0
        },
        currentContrastMethod: 'wcag',
        currentFileColorProfile: 'p3'
      })
    ).toStrictEqual(-5)
  })
})
