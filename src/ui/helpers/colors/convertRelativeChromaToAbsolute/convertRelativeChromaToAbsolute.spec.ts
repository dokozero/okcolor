import { describe, expect, test } from 'vitest'
import convertRelativeChromaToAbsolute from './convertRelativeChromaToAbsolute'

describe('convertRelativeChromaToAbsolute()', () => {
  test('0.134', () => {
    expect(
      convertRelativeChromaToAbsolute({
        h: 260,
        y: 55,
        relativeChroma: 50,
        fileColorProfile: 'p3'
      })
    ).toBe(0.134)
  })
})
