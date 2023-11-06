import { describe, expect, test } from 'vitest'
import roundWithDecimal from './roundWithDecimal'

describe('roundWithDecimal()', () => {
  test('10.5', () => {
    expect(roundWithDecimal(10.51, 1)).toBe(10.5)
  })

  test('10.3', () => {
    expect(roundWithDecimal(10.25, 1)).toBe(10.3)
  })
})
