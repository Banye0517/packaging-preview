interface CameraPanelProps {
  autoRotate: boolean
  onAutoRotateChange: (enabled: boolean) => void
}

export function CameraPanel({ autoRotate, onAutoRotateChange }: CameraPanelProps) {
  return (
    <>
      <p className="eyebrow">CAMERA</p>
      <h1>相机控制</h1>
      <p className="panel-description">拖拽旋转，滚轮或双指缩放包装盒。</p>
      <label className="toggle-row">
        <span>自动旋转</span>
        <input
          type="checkbox"
          checked={autoRotate}
          onChange={(event) => onAutoRotateChange(event.currentTarget.checked)}
        />
      </label>
    </>
  )
}
