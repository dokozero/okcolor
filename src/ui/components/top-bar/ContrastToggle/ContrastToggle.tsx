import { useStore } from '@nanostores/react'
import { consoleLogInfos } from '../../../../constants'
import ContrastIcon from '../../icons/ContrastIcon/ContrastIcon'
import { $isContrastInputOpen, setIsContrastInputOpenWithSideEffects } from '../../../stores/contrasts/isContrastInputOpen/isContrastInputOpen'
import { $currentColorModel } from '../../../stores/colors/currentColorModel/currentColorModel'

const handleIsContrastInputOpen = () => {
  setIsContrastInputOpenWithSideEffects({ newIsContrastInputOpen: !$isContrastInputOpen.get() })
}

export default function ContrastToggle() {
  if (consoleLogInfos.includes('Component renders')) {
    console.log('Component render — ContrastToggle')
  }

  const isContrastInputOpen = useStore($isContrastInputOpen)
  const currentColorModel = useStore($currentColorModel)

  return (
    <div
      className={
        'c-contrast-toggle' +
        (isContrastInputOpen ? ' c-contrast-toggle--active' : '') +
        (['okhsv', 'okhsl'].includes(currentColorModel) ? ' c-contrast-toggle--deactivated' : '')
      }
      onClick={handleIsContrastInputOpen}
    >
      <ContrastIcon />
    </div>
  )
}
