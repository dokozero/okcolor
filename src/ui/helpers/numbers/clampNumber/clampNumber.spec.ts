import { describe, expect, test } from 'vitest'
import clampNumber from './clampNumber'

describe('clampNumber()', () => {
  test('100', () => {
    expect(clampNumber(105, 0, 100)).toBe(100)
  })
})
