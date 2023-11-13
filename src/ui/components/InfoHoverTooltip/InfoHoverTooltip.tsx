import { useEffect, useRef } from 'react'
import { consoleLogInfos } from '../../../constants'
import InfoIcon from '../icons/InfoIcon/InfoIcon'

type Props = {
  text: string
  position: 'left' | 'center' | 'right'
  width: number
}

/**
 * @param position for better results use an even value.
 */
export default function InfoHoverTooltip(props: Props) {
  if (consoleLogInfos.includes('Component renders')) {
    console.log('Component render — InfoHoverTooltip')
  }

  const { text, position = 'center', width } = props

  const tooltip = useRef<HTMLDivElement>(null)

  useEffect(() => {
    tooltip.current!.style.width = `${width}px`

    let marginLeft = '0px'
    if (position === 'left') marginLeft = `${-(width / 10)}px`
    else if (position === 'center') marginLeft = `${-(width / 2) + 8}px`
    else if (position === 'right') marginLeft = `${-width + 36}px`

    tooltip.current!.style.marginLeft = marginLeft
  }, [])

  return (
    <div className="c-info-hover-tooltip">
      <div ref={tooltip} className={'c-info-hover-tooltip__tooltip' + ` c-info-hover-tooltip__tooltip--${position}`}>
        <p>{text}</p>
      </div>

      <InfoIcon />
    </div>
  )
}
