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
    // We test if setValue() exists because in some cases we can have the toggle action controlled by the onClick from the parent.
    if (setValue) setValue(!value)
  }

  return (
    <div className="c-toggle" onClick={handleToggle}>
      <div className={'c-toggle-element' + (value ? ' c-toggle-element--active' : '')}></div>
    </div>
  )
}
