import { describe, expect, test } from 'vitest'
import getNewXandYFromContrast from './getNewXandYFromContrast'
import { setCurrentContrastMethod } from '../../../stores/contrasts/currentContrastMethod/currentContrastMethod'
import { setCurrentFileColorProfile } from '../../../stores/colors/currentFileColorProfile/currentFileColorProfile'

describe('getNewXandYFromContrast()', () => {
  test('{x: 0.2, y: 57.4}', () => {
    setCurrentContrastMethod('apca')
    setCurrentFileColorProfile('p3')
    expect(
      getNewXandYFromContrast({
        h: 270,
        x: 0.2,
        targetContrast: -30,
        lockRelativeChroma: false,
        currentBgOrFg: 'fg',
        colorsRgba: {
          parentFill: {
            r: 0,
            g: 0,
            b: 0
          },
          fill: {
            r: 0,
            g: 0,
            b: 0,
            a: 1
          },
          stroke: null
        }
      })
    ).toStrictEqual({ x: 0.2, y: 57.4 })
  })
})
