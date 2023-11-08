import { describe, expect, test } from 'vitest'
import filterNewContrast from './filterNewContrast'
import { setCurrentContrastMethod } from '../../../stores/contrasts/currentContrastMethod/currentContrastMethod'

describe('filterNewContrast()', () => {
  test('7', () => {
    setCurrentContrastMethod('apca')
    expect(filterNewContrast(4)).toStrictEqual(7)
  })
  test('-7', () => {
    setCurrentContrastMethod('apca')
    expect(filterNewContrast(-4)).toStrictEqual(-7)
  })
  test('1', () => {
    setCurrentContrastMethod('wcag')
    expect(filterNewContrast(0)).toStrictEqual(1)
  })
  test('-1', () => {
    setCurrentContrastMethod('wcag')
    expect(filterNewContrast(-1)).toStrictEqual(-1)
  })
})
