import { describe, expect, test } from 'vitest'
import convertAbsoluteChromaToRelative from './convertAbsoluteChromaToRelative'

describe('convertAbsoluteChromaToRelative()', () => {
  test('75', () => {
    expect(
      convertAbsoluteChromaToRelative({
        colorHxy: {
          h: 260,
          x: 0.2,
          y: 55
        },
        fileColorProfile: 'p3'
      })
    ).toStrictEqual(75)
  })
})
