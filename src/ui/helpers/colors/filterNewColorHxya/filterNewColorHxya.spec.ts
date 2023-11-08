import { describe, expect, test } from 'vitest'
import filterNewColorHxya from './filterNewColorHxya'
import { setCurrentFileColorProfile } from '../../../stores/colors/currentFileColorProfile/currentFileColorProfile'

describe('filterNewColorHxya()', () => {
  test('{ h: 270, x: 0.3, y: 50, a: 0.97 }', () => {
    setCurrentFileColorProfile('p3')
    expect(
      filterNewColorHxya({
        newColorHxya: {
          h: 270,
          x: 0.3,
          y: 50,
          a: 0.9678
        },
        lockRelativeChroma: false,
        lockContrast: false
      })
    ).toStrictEqual({
      h: 270,
      x: 0.3,
      y: 50,
      a: 0.97
    })
  })
})
