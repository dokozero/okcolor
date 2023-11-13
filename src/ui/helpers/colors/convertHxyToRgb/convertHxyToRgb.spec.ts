import { describe, expect, test } from 'vitest'
import convertHxyToRgb from './convertHxyToRgb'

describe('convertHxyToRgb()', () => {
  test('{ b: 0.8609332257422432, g: 0.40603947315377714, r: 0.20524954244022237 }', () => {
    expect(
      convertHxyToRgb({
        colorHxy: {
          h: 260,
          x: 0.2,
          y: 55
        },
        originColorModel: 'oklch',
        colorSpace: 'p3'
      })
    ).toStrictEqual({
      b: 0.8609332257422432,
      g: 0.40603947315377714,
      r: 0.20524954244022237
    })
  })
})
