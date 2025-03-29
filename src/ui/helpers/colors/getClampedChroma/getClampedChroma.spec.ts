import { describe, expect, test } from 'vitest'
import getClampedChroma from './getClampedChroma'

describe('getClampedChroma()', () => {
  test('0.267529', () => {
    expect(
      getClampedChroma(
        {
          h: 260,
          x: 0.4,
          y: 55
        },
        'p3'
      )
    ).toStrictEqual(0.267529)
  })
})
