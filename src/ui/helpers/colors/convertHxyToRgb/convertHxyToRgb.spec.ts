import { describe, expect, test } from 'vitest'
import convertHxyToRgb from './convertHxyToRgb'

describe('convertHxyToRgb()', () => {
  test('{ r: 52.338633322256705, g: 103.54006565421317, b: 219.53797256427202 }', () => {
    expect(
      convertHxyToRgb({
        colorHxy: {
          h: 260,
          x: 0.2 * 100,
          y: 55
        },
        originColorModel: 'oklchCss',
        colorSpace: 'p3'
      })
    ).toStrictEqual({
      r: 52.338633322256705,
      g: 103.54006565421317,
      b: 219.53797256427202
    })
  })
})
