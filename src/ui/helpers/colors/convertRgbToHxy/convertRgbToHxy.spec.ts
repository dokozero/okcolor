import { describe, expect, test } from 'vitest'
import convertRgbToHxy from './convertRgbToHxy'

describe('convertRgbToHxy()', () => {
  test('{ h: 244.8, x: 0.133961, y: 58.4 }', () => {
    expect(
      convertRgbToHxy({
        colorRgb: {
          r: 0.25,
          g: 0.5,
          b: 0.75
        },
        targetColorModel: 'oklch',
        colorSpace: 'p3'
      })
    ).toStrictEqual({
      h: 244.8,
      x: 0.133961,
      y: 58.4
    })
  })
})
