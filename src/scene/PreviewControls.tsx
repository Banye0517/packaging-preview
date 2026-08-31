export type CameraCommand = 'fit' | 'front' | 'reset'

interface PreviewControlsProps {
  onCommand: (command: CameraCommand) => void
}

export function PreviewControls({ onCommand }: PreviewControlsProps) {
  return (
    <div className="preview-controls" aria-label="预览控制">
      <button type="button" onClick={() => onCommand('fit')}>适合视图</button>
      <button type="button" onClick={() => onCommand('front')}>正视图</button>
      <button type="button" onClick={() => onCommand('reset')}>重置相机</button>
    </div>
  )
}
