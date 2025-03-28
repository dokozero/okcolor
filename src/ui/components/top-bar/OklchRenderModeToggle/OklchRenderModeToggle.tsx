import { useStore } from '@nanostores/react'
import { consoleLogInfos } from '../../../../constants'
import { $currentColorModel } from '../../../stores/colors/currentColorModel/currentColorModel'
import { $figmaEditorType } from '../../../stores/figmaEditorType/figmaEditorType'
import { $isTransitionRunning, $oklchRenderMode, setOklchRenderMode } from '../../../stores/oklchRenderMode/oklchRenderMode'
import { useEffect } from 'react'
import TriangleOklchIcon from '../../icons/TriangleOklchIcon/TriangleOklchIcon'
import SquareOklchIcon from '../../icons/SquareOklchIcon/SquareOklchIcon'
import { $uiMessage } from '../../../stores/uiMessage/uiMessage'

const handleOklchRenderMode = () => {
  if ($currentColorModel.get() !== 'oklch') return
  if ($isTransitionRunning.get()) return

  if ($oklchRenderMode.get() === 'square') {
    setOklchRenderMode('triangle')
  } else {
    setOklchRenderMode('square')
  }
}

export default function OklchRenderModeToggle() {
  if (consoleLogInfos.includes('Component renders')) {
    console.log('Component render — OklchRenderModeToggle')
  }

  const figmaEditorType = useStore($figmaEditorType)
  const currentColorModel = useStore($currentColorModel)
  const oklchRenderMode = useStore($oklchRenderMode)

  useEffect(() => {
    document.addEventListener('keydown', (event) => {
      if (!['t', 'T', 's', 'S'].includes(event.key)) return

      // We test if document.activeElement?.tagName is an input because we don't want to trigger this code if user type "c" while he's in one of them.
      if ($uiMessage.get().show || document.activeElement?.tagName === 'INPUT') return

      handleOklchRenderMode()
    })
  }, [])

  return (
    <div
      className={
        'c-oklch-render-mode-toggle' +
        (figmaEditorType === 'figjam' || ['okhsv', 'okhsl'].includes(currentColorModel) ? ' c-oklch-render-mode-toggle--deactivated' : '')
      }
      onClick={handleOklchRenderMode}
    >
      <div
        className={`c-oklch-render-mode-toggle__element ${oklchRenderMode === 'square' ? 'c-oklch-render-mode-toggle__element--active' : ''}`}
        style={{ color: 'white', fontWeight: oklchRenderMode === 'square' ? 'bold' : 'normal' }}
      >
        <SquareOklchIcon />
      </div>
      <div
        className={`c-oklch-render-mode-toggle__element ${oklchRenderMode === 'triangle' ? 'c-oklch-render-mode-toggle__element--active' : ''}`}
        style={{ color: 'white', fontWeight: oklchRenderMode === 'triangle' ? 'bold' : 'normal' }}
      >
        <TriangleOklchIcon />
      </div>
    </div>
  )
}
