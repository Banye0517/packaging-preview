import type { ProjectAction } from '../app/projectReducer'
import { BOX_FACES, type BoxFace } from '../app/types'
import {
  DEFAULT_FINISH_PARAMETERS,
  FINISH_KINDS,
  type FinishState,
  type FinishKind,
  type FinishParameterKey,
  type FinishTransformKey,
} from './finishTypes'

const FINISH_COPY: Record<FinishKind, { label: string; description: string }> = {
  'gold-foil': { label: '烫金', description: '金色金属反射' },
  'silver-foil': { label: '烫银', description: '银色金属反射' },
  holographic: { label: '镭射', description: '银色彩虹金属光泽' },
  'spot-uv': { label: 'UV亮膜', description: '原图色彩亮膜高光' },
  'emboss-deboss': { label: '击凸/压凹', description: '立体模压纹理' },
}

const FACE_LABELS: Record<BoxFace, string> = {
  top: '顶部', left: '左侧', front: '正面', right: '右侧', back: '背面', bottom: '底部',
}

const PARAMETER_COPY: Record<FinishParameterKey, { label: string; min: number; max: number; step: number; suffix: string }> = {
  roughness: { label: '表面粗糙度', min: 0, max: 1, step: 0.01, suffix: '' },
  grain: { label: '箔面细纹', min: 0, max: 100, step: 1, suffix: '%' },
  normalStrength: { label: '微表面法线', min: 0, max: 100, step: 1, suffix: '%' },
  iridescence: { label: '虹彩强度', min: 0, max: 100, step: 1, suffix: '%' },
  gloss: { label: '亮膜强度', min: 0, max: 100, step: 1, suffix: '%' },
  relief: { label: '凹凸强度', min: -5, max: 5, step: 0.05, suffix: 'mm' },
}

interface FinishPanelProps<Face extends BoxFace> {
  value: FinishState<Face>
  scope?: 'box-finish' | 'pouch-finish'
  faces?: readonly Face[]
  faceLabels?: Record<Face, string>
  errors: Partial<Record<FinishKind, Partial<Record<Face, string>>>>
  onAction: (action: ProjectAction) => void
  onUpload?: (kind: FinishKind, face: Face, file: File) => void
}

export function FinishPanel<Face extends BoxFace = BoxFace>({
  value,
  scope = 'box-finish',
  faces,
  faceLabels,
  errors,
  onAction,
  onUpload,
}: FinishPanelProps<Face>) {
  const activeFaces = (faces ?? BOX_FACES) as readonly Face[]
  const labels = (faceLabels ?? FACE_LABELS) as Record<Face, string>
  const kind = value.selectedKind
  const layer = value.layers[kind]
  const copy = FINISH_COPY[kind]
  const selectedMask = layer.masks[value.selectedFace]

  return (
    <>
      <div className="finish-heading">
        <div><p className="eyebrow">FINISH</p><h1>表面工艺</h1></div>
        <span>多工艺叠加</span>
      </div>
      <div className="finish-kind-grid" role="tablist" aria-label="工艺图层">
        {FINISH_KINDS.map((item) => (
          <button key={item} type="button" role="tab" aria-selected={kind === item}
            onClick={() => onAction({ type: `${scope}/select-kind`, kind: item } as ProjectAction)}>
            <i className={`finish-swatch finish-swatch--${item}`} aria-hidden="true" />
            <span><strong>{FINISH_COPY[item].label}</strong><small>{FINISH_COPY[item].description}</small></span>
          </button>
        ))}
      </div>
      <label className="finish-toggle">
        <span><strong>显示{copy.label}</strong><small>只控制当前图层，不影响其他工艺</small></span>
        <input type="checkbox" checked={layer.enabled}
          aria-label={`显示${copy.label}`}
          onChange={(event) => onAction({ type: `${scope}/enabled-set`, kind, value: event.currentTarget.checked } as ProjectAction)} />
      </label>
      <section className="finish-parameter-card" aria-label="工艺材质参数">
        <div className="finish-card-heading"><strong>✣ 工艺材质参数</strong><button type="button" aria-label="恢复当前工艺默认参数"
          onClick={() => onAction({ type: `${scope}/parameter-reset`, kind } as ProjectAction)}>↶</button></div>
        {Object.keys(DEFAULT_FINISH_PARAMETERS[kind]).map((key) => {
          const parameterKey = key as FinishParameterKey
          const config = PARAMETER_COPY[parameterKey]
          const parameterValue = layer.parameters[parameterKey] ?? 0
          return <label className="finish-control" key={key}>
            <span>{config.label}</span>
            <input type="number" min={config.min} max={config.max} step={config.step} value={parameterValue}
              aria-label={`${config.label}数值`}
              onChange={(event) => onAction({ type: `${scope}/parameter-set`, kind, key: parameterKey, value: event.currentTarget.valueAsNumber } as ProjectAction)} />
            <em>{config.suffix}</em>
            <input type="range" min={config.min} max={config.max} step={config.step} value={parameterValue}
              aria-label={config.label}
              onChange={(event) => onAction({ type: `${scope}/parameter-set`, kind, key: parameterKey, value: event.currentTarget.valueAsNumber } as ProjectAction)} />
          </label>
        })}
      </section>
      <h2 className="finish-mask-title">{copy.label}蒙版</h2>
      <p className="panel-description">上传黑白蒙版：黑色为工艺区域，白色保持原印刷效果。</p>
      <div className="finish-face-grid">
        {activeFaces.map((face) => {
          const mask = layer.masks[face]
          const inputId = `${scope}-${kind}-${face}`
          return <article className={`finish-face${value.selectedFace === face ? ' is-selected' : ''}`} key={face}>
            {mask ? <button type="button" className="finish-face-select" aria-label={`选择${labels[face]}${copy.label}蒙版`}
              onClick={() => onAction({ type: `${scope}/select-face`, face } as ProjectAction)}>
              <strong>{labels[face]}</strong><img src={mask.asset.previewUrl} alt="" />
            </button> : <label className="finish-face-select" htmlFor={inputId}>
              <strong>{labels[face]}</strong><span>＋</span>
            </label>}
            <input id={inputId} hidden type="file" accept="image/png,image/jpeg,image/webp"
              aria-label={`上传${labels[face]}${copy.label}蒙版`}
              onChange={(event) => { const file = event.currentTarget.files?.[0]; if (file) onUpload?.(kind, face, file); event.currentTarget.value = '' }} />
            {mask ? <button type="button" aria-label={`移除${labels[face]}${copy.label}蒙版`}
              onClick={() => onAction({ type: `${scope}/mask-remove`, kind, face } as ProjectAction)}>移除</button> : null}
            {errors[kind]?.[face] ? <p className="face-error">{errors[kind]?.[face]}</p> : null}
          </article>
        })}
      </div>
      {selectedMask ? <FinishTransformControls scope={scope} label={labels[value.selectedFace]} kind={kind} face={value.selectedFace} value={selectedMask.transform} onAction={onAction} /> : null}
      <button type="button" className="finish-clear" onClick={() => onAction({ type: `${scope}/masks-clear`, kind } as ProjectAction)}>清空当前工艺层</button>
    </>
  )
}

function FinishTransformControls<Face extends BoxFace>({ scope, label, kind, face, value, onAction }: {
  scope: 'box-finish' | 'pouch-finish'
  label: string
  kind: FinishKind
  face: Face
  value: { scale: number; offsetX: number; offsetY: number; rotation: number }
  onAction: (action: ProjectAction) => void
}) {
  const controls: Array<{ key: FinishTransformKey; label: string; min: number; max: number; suffix: string }> = [
    { key: 'scale', label: '工艺贴图缩放', min: 50, max: 300, suffix: '%' },
    { key: 'offsetX', label: '工艺水平位置', min: -100, max: 100, suffix: '%' },
    { key: 'offsetY', label: '工艺垂直位置', min: -100, max: 100, suffix: '%' },
    { key: 'rotation', label: '工艺贴图旋转', min: -180, max: 180, suffix: '°' },
  ]
  return <section className="texture-transform-controls" aria-label="工艺贴图变换">
    <div className="texture-transform-heading"><strong>{label}蒙版调整</strong>
      <button type="button" onClick={() => onAction({ type: `${scope}/mask-transform-reset`, kind, face } as ProjectAction)}>重置工艺贴图</button></div>
    {controls.map((control) => <label className="texture-slider" key={control.key}>
      <span>{control.label.replace('工艺贴图', '')}</span>
      <input type="range" min={control.min} max={control.max} value={value[control.key]} aria-label={control.label}
        onChange={(event) => onAction({ type: `${scope}/mask-transform-set`, kind, face, key: control.key, value: event.currentTarget.valueAsNumber } as ProjectAction)} />
      <span className="texture-number"><input type="number" min={control.min} max={control.max} value={value[control.key]}
        aria-label={`${control.label}数值`} onChange={(event) => onAction({ type: `${scope}/mask-transform-set`, kind, face, key: control.key, value: event.currentTarget.valueAsNumber } as ProjectAction)} /><span>{control.suffix}</span></span>
    </label>)}
  </section>
}
