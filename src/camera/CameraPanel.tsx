interface CameraPanelProps {
  autoRotate: boolean
  lightingIntensity: number
  onAutoRotateChange: (enabled: boolean) => void
  onLightingIntensityChange: (value: number) => void
}

export function CameraPanel({
  autoRotate,
  lightingIntensity,
  onAutoRotateChange,
  onLightingIntensityChange,
}: CameraPanelProps) {
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
      <label className="lighting-control">
        <span className="lighting-control__header">
          <span>打光强度</span>
          <span className="lighting-control__number">
            <input
              aria-label="打光强度数值"
              type="number"
              min="-100"
              max="100"
              step="1"
              value={lightingIntensity}
              onChange={(event) => onLightingIntensityChange(Number(event.currentTarget.value))}
            />
            <span aria-hidden="true">%</span>
          </span>
        </span>
        <input
          aria-label="打光强度"
          type="range"
          min="-100"
          max="100"
          step="1"
          value={lightingIntensity}
          onChange={(event) => onLightingIntensityChange(Number(event.currentTarget.value))}
        />
        <span className="lighting-control__limits" aria-hidden="true">
          <span>减弱</span>
          <span>标准</span>
          <span>增强</span>
        </span>
      </label>
    </>
  )
}
