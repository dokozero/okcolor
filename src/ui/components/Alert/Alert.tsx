import { useEffect, useState } from 'react'
import { consoleLogInfos } from '../../../constants'
import { $currentColorModel } from '../../stores/colors/currentColorModel/currentColorModel'
import CrossIcon from '../icons/CrossIcon/CrossIcon'
import { useStore } from '@nanostores/react'

export default function Alert() {
  if (consoleLogInfos.includes('Component renders')) {
    console.log('Component render — Alert')
  }

  const currentColorModel = useStore($currentColorModel)
  const [showAlert, setShowAlert] = useState(false)

  useEffect(() => {
    setShowAlert(currentColorModel === 'okhsl' || currentColorModel === 'okhsv')
  }, [currentColorModel])

  useEffect(() => {
    // Don't show the alert when the plugin start.
    setShowAlert(false)

    const handleKeyDown = (event: KeyboardEvent) => {
      if ($currentColorModel.get() === 'oklch') return
      if (event.key !== 'Escape') return

      setShowAlert(false)
    }

    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [])

  return (
    <div onClick={() => setShowAlert(false)} className={`c-alert${showAlert ? ' c-alert--active' : ''}`}>
      <div
        onClick={(e) => {
          e.stopPropagation()
        }}
        className="c-alert__box"
      >
        <div className="c-alert__header">
          <div className="c-alert__title">Legacy color model</div>

          <div onClick={() => setShowAlert(false)} className="c-alert__close-icon">
            <CrossIcon />
          </div>
        </div>

        <div className="c-alert__content">
          <p>
            Please use OkLCH, {$currentColorModel.get() === 'okhsl' ? 'OkHSL' : 'OkHSV'} has fewer features and will be removed. Email me at:
            contact@dokozero.design if you still need it.
          </p>
        </div>

        <div className="c-alert__buttons-container">
          <button onClick={() => setShowAlert(false)} className="c-alert__button">
            Got it
          </button>
        </div>
      </div>
    </div>
  )
}
