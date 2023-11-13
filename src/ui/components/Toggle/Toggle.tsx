import { consoleLogInfos } from '../../../constants'

type Props = {
  value: boolean
  setValue?: (value: boolean) => void
}

export default function Toggle(props: Props) {
  if (consoleLogInfos.includes('Component renders')) {
    console.log(`Component render — Toggle`)
  }

  const { value, setValue } = props

  const handleToggle = () => {
    if (setValue) setValue(!value)
  }

  return (
    <div className="c-toggle" onClick={handleToggle}>
      <div className={'c-toggle-element' + (value ? ' c-toggle-element--active' : '')}></div>
    </div>
  )
}
