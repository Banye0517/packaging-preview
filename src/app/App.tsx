import { useReducer, useRef, useState } from 'react'

import { FaceGrid } from '../artwork/FaceGrid'
import { PouchArtworkGrid } from '../artwork/PouchArtworkGrid'
import { readImageDataUrl } from '../artwork/readImageDataUrl'
import { validateImage } from '../artwork/validateImage'
import { BoxPanel } from '../box/BoxPanel'
import { CameraPanel } from '../camera/CameraPanel'
import { ProjectToolbar } from '../shell/ProjectToolbar'
import { BoxScene, type BoxSceneHandle } from '../scene/BoxScene'
import {
  PreviewControls,
  type CameraCommand,
} from '../scene/PreviewControls'
import {
  SettingsPanel,
  type SettingsTabId,
} from '../shell/SettingsPanel'
import { decodeProject, encodeProject } from '../project/codec'
import { dataUrlToBlob, type PngExportSelection } from '../export/transparentPng'
import { InnerPackagingArtworkUploader } from '../innerPackaging/InnerPackagingArtworkUploader'
import { InnerPackaging1Panel } from '../innerPackaging/InnerPackaging1Panel'
import { InnerPackaging2ArtworkUploader } from '../innerPackaging/InnerPackaging2ArtworkUploader'
import { HangingTissueArtworkUploader } from '../hangingTissue/HangingTissueArtworkUploader'
import { HangingTissuePanel } from '../hangingTissue/HangingTissuePanel'
import { PouchPanel } from '../pouch/PouchPanel'
import { FinishPanel } from '../finish/FinishPanel'
import type { FinishKind } from '../finish/finishTypes'
import { createProjectHistory, projectHistoryReducer } from './projectHistory'
import type {
  BoxFace,
  HangingTissueFace,
  PackagingType,
  PouchClosure,
  PouchFace,
  PouchState,
} from './types'

export function App() {
  const [name, setName] = useState('未命名包装')
  const [activeTab, setActiveTab] = useState<SettingsTabId>('artwork')
  const [history, historyDispatch] = useReducer(
    projectHistoryReducer,
    undefined,
    createProjectHistory,
  )
  const [faceErrors, setFaceErrors] = useState<Partial<Record<BoxFace, string>>>({})
  const [pouchFaceErrors, setPouchFaceErrors] = useState<
    Partial<Record<PouchFace, string>>
  >({})
  const [innerPackagingArtworkError, setInnerPackagingArtworkError] = useState<string>()
  const [innerPackaging2Errors, setInnerPackaging2Errors] = useState<
    Partial<Record<PouchFace, string>>
  >({})
  const [hangingTissueErrors, setHangingTissueErrors] = useState<
    Partial<Record<HangingTissueFace, string>>
  >({})
  const [finishErrors, setFinishErrors] = useState<Partial<Record<FinishKind, Partial<Record<BoxFace, string>>>>>({})
  const [pouchFinishErrors, setPouchFinishErrors] = useState<Partial<Record<FinishKind, Partial<Record<PouchFace, string>>>>>({})
  const [cameraCommand, setCameraCommand] = useState<{
    type: CameraCommand
    nonce: number
  } | null>(null)
  const [showHelp, setShowHelp] = useState(false)
  const openInputRef = useRef<HTMLInputElement>(null)
  const boxSceneRef = useRef<BoxSceneHandle>(null)
  const project = history.present

  function commit(action: Parameters<typeof projectHistoryReducer>[1] & { type: 'commit' }) {
    historyDispatch(action)
  }

  async function handleFaceUpload(face: BoxFace, file: File) {
    try {
      const metadata = await validateImage(file)
      const previewUrl = await readImageDataUrl(file)

      commit({
        type: 'commit',
        action: {
          type: 'face/set',
          face,
          asset: {
            id: crypto.randomUUID(),
            name: file.name,
            previewUrl,
            ...metadata,
          },
        },
      })
      setFaceErrors((errors) => ({ ...errors, [face]: undefined }))
    } catch (error) {
      setFaceErrors((errors) => ({
        ...errors,
        [face]: error instanceof Error ? error.message : '图片读取失败',
      }))
    }
  }

  async function handlePouchFaceUpload(face: PouchFace, file: File) {
    try {
      const metadata = await validateImage(file)
      const previewUrl = await readImageDataUrl(file)
      commit({
        type: 'commit',
        action: {
          type: 'pouch/face-set',
          face,
          asset: {
            id: crypto.randomUUID(),
            name: file.name,
            previewUrl,
            ...metadata,
          },
        },
      })
      setPouchFaceErrors((errors) => ({ ...errors, [face]: undefined }))
    } catch (error) {
      setPouchFaceErrors((errors) => ({
        ...errors,
        [face]: error instanceof Error ? error.message : '图片读取失败',
      }))
    }
  }

  async function handleInnerPackagingArtworkUpload(file: File) {
    try {
      const metadata = await validateImage(file)
      const previewUrl = await readImageDataUrl(file)
      commit({
        type: 'commit',
        action: {
          type: 'inner-packaging-1/artwork-set',
          asset: {
            id: crypto.randomUUID(),
            name: file.name,
            previewUrl,
            ...metadata,
          },
        },
      })
      setInnerPackagingArtworkError(undefined)
    } catch (error) {
      setInnerPackagingArtworkError(
        error instanceof Error ? error.message : '图片读取失败',
      )
    }
  }

  async function handleInnerPackaging2Upload(face: PouchFace, file: File) {
    try {
      const metadata = await validateImage(file)
      const previewUrl = await readImageDataUrl(file)
      commit({
        type: 'commit',
        action: {
          type: 'inner-packaging-2/face-set',
          face,
          asset: {
            id: crypto.randomUUID(),
            name: file.name,
            previewUrl,
            ...metadata,
          },
        },
      })
      setInnerPackaging2Errors((current) => ({ ...current, [face]: undefined }))
    } catch (error) {
      setInnerPackaging2Errors((current) => ({
        ...current,
        [face]: error instanceof Error ? error.message : '图片读取失败',
      }))
    }
  }

  async function handleHangingTissueUpload(face: HangingTissueFace, file: File) {
    try {
      const metadata = await validateImage(file)
      const previewUrl = await readImageDataUrl(file)
      commit({ type: 'commit', action: {
        type: 'hanging-tissue/face-set', face,
        asset: { id: crypto.randomUUID(), name: file.name, previewUrl, ...metadata },
      } })
      setHangingTissueErrors((current) => ({ ...current, [face]: undefined }))
    } catch (error) {
      setHangingTissueErrors((current) => ({
        ...current, [face]: error instanceof Error ? error.message : '图片读取失败',
      }))
    }
  }

  async function handleFinishMaskUpload(kind: FinishKind, face: BoxFace, file: File) {
    try {
      const metadata = await validateImage(file)
      const previewUrl = await readImageDataUrl(file)
      commit({ type: 'commit', action: {
        type: 'box-finish/mask-set', kind, face,
        asset: { id: crypto.randomUUID(), name: file.name, previewUrl, ...metadata },
      } })
      setFinishErrors((current) => ({
        ...current,
        [kind]: { ...current[kind], [face]: undefined },
      }))
    } catch (error) {
      setFinishErrors((current) => ({
        ...current,
        [kind]: {
          ...current[kind],
          [face]: error instanceof Error ? error.message : '图片读取失败',
        },
      }))
    }
  }

  async function handlePouchFinishMaskUpload(kind: FinishKind, face: PouchFace, file: File) {
    try {
      const metadata = await validateImage(file)
      const previewUrl = await readImageDataUrl(file)
      commit({ type: 'commit', action: {
        type: 'pouch-finish/mask-set', kind, face,
        asset: { id: crypto.randomUUID(), name: file.name, previewUrl, ...metadata },
      } })
      setPouchFinishErrors((current) => ({
        ...current,
        [kind]: { ...current[kind], [face]: undefined },
      }))
    } catch (error) {
      setPouchFinishErrors((current) => ({
        ...current,
        [kind]: {
          ...current[kind],
          [face]: error instanceof Error ? error.message : '图片读取失败',
        },
      }))
    }
  }

  function handleFaceRemove(face: BoxFace) {
    commit({ type: 'commit', action: { type: 'face/remove', face } })
    setFaceErrors((errors) => ({ ...errors, [face]: undefined }))
  }

  function handlePouchFaceRemove(face: PouchFace) {
    commit({ type: 'commit', action: { type: 'pouch/face-remove', face } })
    setPouchFaceErrors((errors) => ({ ...errors, [face]: undefined }))
  }

  function handleInnerPackagingArtworkRemove() {
    commit({
      type: 'commit',
      action: { type: 'inner-packaging-1/artwork-remove' },
    })
    setInnerPackagingArtworkError(undefined)
  }

  function handleInnerPackaging2Remove(face: PouchFace) {
    commit({
      type: 'commit',
      action: { type: 'inner-packaging-2/face-remove', face },
    })
    setInnerPackaging2Errors((current) => ({ ...current, [face]: undefined }))
  }

  function handleHangingTissueRemove(face: HangingTissueFace) {
    commit({ type: 'commit', action: { type: 'hanging-tissue/face-remove', face } })
    setHangingTissueErrors((current) => ({ ...current, [face]: undefined }))
  }

  function handlePouchSettingChange(
    key: Exclude<keyof PouchState, 'faces'>,
    value: number | boolean | PouchClosure,
  ) {
    if (key === 'closure') {
      commit({
        type: 'commit',
        action: { type: 'pouch/set', key, value: value as PouchClosure },
      })
    } else if (key === 'roundedCorners') {
      commit({
        type: 'commit',
        action: { type: 'pouch/set', key, value: value as boolean },
      })
    } else {
      commit({
        type: 'commit',
        action: { type: 'pouch/set', key, value: value as number },
      })
    }
  }

  function handleCameraCommand(type: CameraCommand) {
    setCameraCommand((current) => ({ type, nonce: (current?.nonce ?? 0) + 1 }))
  }

  function downloadFile(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.append(link)
    link.click()
    link.remove()
    window.setTimeout(() => URL.revokeObjectURL(url), 1_000)
  }

  function handleSave() {
    const savedProject = { ...project, name }
    downloadFile(
      new Blob([encodeProject(savedProject)], { type: 'application/json' }),
      `${name || '未命名包装'}.boxlab.json`,
    )
  }

  async function handleOpen(file: File) {
    try {
      const nextProject = decodeProject(await file.text())
      historyDispatch({ type: 'load', project: nextProject })
      setName(nextProject.name)
      setFaceErrors({})
      setPouchFaceErrors({})
      setInnerPackagingArtworkError(undefined)
      setInnerPackaging2Errors({})
      setHangingTissueErrors({})
      setFinishErrors({})
      setPouchFinishErrors({})
    } catch (error) {
      window.alert(error instanceof Error ? error.message : '项目文件读取失败')
    }
  }

  function handleExport(selection: PngExportSelection) {
    const png = boxSceneRef.current?.exportTransparentPng(selection)
    if (!png) return
    downloadFile(
      dataUrlToBlob(png),
      `${name || '未命名包装'}-${selection.size}x${selection.size}-${selection.includeShadow ? '带投影' : '无投影'}.png`,
    )
  }

  return (
    <div className="app-shell">
      <ProjectToolbar
        name={name}
        onNameChange={setName}
        canUndo={history.past.length > 0}
        canRedo={history.future.length > 0}
        onUndo={() => historyDispatch({ type: 'undo' })}
        onRedo={() => historyDispatch({ type: 'redo' })}
        onNew={() => {
          if (window.confirm('新建项目会清空当前四种包装数据，确认继续？')) {
            historyDispatch({ type: 'reset' })
            setName('未命名包装')
            setFaceErrors({})
            setPouchFaceErrors({})
            setInnerPackagingArtworkError(undefined)
            setInnerPackaging2Errors({})
            setHangingTissueErrors({})
            setFinishErrors({})
            setPouchFinishErrors({})
          }
        }}
        onOpen={() => openInputRef.current?.click()}
        onSave={handleSave}
        onHelp={() => setShowHelp(true)}
        onExport={handleExport}
      />
      <input
        ref={openInputRef}
        className="sr-only"
        type="file"
        accept=".boxlab,.json,application/json"
        aria-label="打开 BoxLab 项目文件"
        onChange={(event) => {
          const file = event.currentTarget.files?.[0]
          if (file) void handleOpen(file)
          event.currentTarget.value = ''
        }}
      />
      <main className="workspace">
        <section className="preview-stage" aria-label="包装盒三维预览区">
          <BoxScene
            ref={boxSceneRef}
            project={project}
            command={cameraCommand}
          />
          <div className="preview-copy preview-copy--overlay">
            <span>3D PREVIEW</span>
            <p>所有图片仅在当前浏览器本地处理</p>
          </div>
          <PreviewControls onCommand={handleCameraCommand} />
        </section>
        <SettingsPanel activeTab={activeTab} onTabChange={setActiveTab}>
          {activeTab === 'artwork' ? (
            <>
              <p className="eyebrow">PRINT LAYERS</p>
              <h1>{project.packagingType === 'box'
                ? '六面印刷贴图'
                : project.packagingType === 'pouch'
                  ? '自立袋印刷贴图'
                  : project.packagingType === 'inner-packaging-1'
                    ? '内包装1印刷贴图'
                    : project.packagingType === 'inner-packaging-2'
                      ? '内包装2印刷贴图'
                      : '悬挂抽纸印刷贴图'}</h1>
              <p className="panel-description">
                {project.packagingType === 'box'
                  ? '分别上传前、后、左、右、上、下六个面的设计图。'
                  : project.packagingType === 'pouch'
                    ? '分别上传正面和背面设计图；底部风琴固定为白色。'
                    : project.packagingType === 'inner-packaging-1'
                      ? '上传一张按照原始 UV 模板制作的完整贴图，覆盖整只袋体。'
                      : project.packagingType === 'inner-packaging-2'
                        ? '分别上传正面和背面设计图；图片按模型原生 UV 映射。'
                        : '分别上传正面、背面、左侧、右侧设计图；图片按模型原生 UV 映射。'}
              </p>
              {project.packagingType === 'box' ? (
                <FaceGrid
                  faces={project.faces}
                  errors={faceErrors}
                  onUpload={handleFaceUpload}
                  onRemove={handleFaceRemove}
                />
              ) : project.packagingType === 'pouch' ? (
                <PouchArtworkGrid
                  faces={project.pouch.faces}
                  errors={pouchFaceErrors}
                  onUpload={handlePouchFaceUpload}
                  onRemove={handlePouchFaceRemove}
                />
              ) : project.packagingType === 'inner-packaging-1' ? (
                <InnerPackagingArtworkUploader
                  artwork={project.innerPackaging1.artwork}
                  error={innerPackagingArtworkError}
                  onUpload={handleInnerPackagingArtworkUpload}
                  onRemove={handleInnerPackagingArtworkRemove}
                  transform={project.innerPackaging1}
                  onTransformChange={(key, value) => commit({
                    type: 'commit',
                    action: {
                      type: 'inner-packaging-1/transform-set',
                      key,
                      value,
                    },
                  })}
                  onTransformReset={() => commit({
                    type: 'commit',
                    action: { type: 'inner-packaging-1/transform-reset' },
                  })}
                />
              ) : project.packagingType === 'inner-packaging-2' ? (
                <InnerPackaging2ArtworkUploader
                  value={project.innerPackaging2}
                  errors={innerPackaging2Errors}
                  onUpload={handleInnerPackaging2Upload}
                  onRemove={handleInnerPackaging2Remove}
                  onSelectFace={(face) => commit({
                    type: 'commit',
                    action: { type: 'inner-packaging-2/select-face', face },
                  })}
                  onTransformChange={(face, key, value) => commit({
                    type: 'commit',
                    action: {
                      type: 'inner-packaging-2/transform-set',
                      face,
                      key,
                      value,
                    },
                  })}
                  onTransformReset={(face) => commit({
                    type: 'commit',
                    action: { type: 'inner-packaging-2/transform-reset', face },
                  })}
                />
              ) : (
                <HangingTissueArtworkUploader
                  value={project.hangingTissue}
                  errors={hangingTissueErrors}
                  onUpload={handleHangingTissueUpload}
                  onRemove={handleHangingTissueRemove}
                  onSelectFace={(face) => commit({ type: 'commit', action: { type: 'hanging-tissue/select-face', face } })}
                  onTransformChange={(face, key, value) => commit({ type: 'commit', action: { type: 'hanging-tissue/transform-set', face, key, value } })}
                  onTransformReset={(face) => commit({ type: 'commit', action: { type: 'hanging-tissue/transform-reset', face } })}
                />
              )}
            </>
          ) : activeTab === 'box' ? (
            <>
              <PackagingTypeSwitch
                value={project.packagingType}
                onChange={(value) =>
                  commit({ type: 'commit', action: { type: 'packaging/type', value } })
                }
              />
              {project.packagingType === 'box' ? (
                <BoxPanel
                  box={project.box}
                  onChange={(key, value) =>
                    commit({ type: 'commit', action: { type: 'box/set', key, value } })
                  }
                />
              ) : project.packagingType === 'pouch' ? (
                <PouchPanel pouch={project.pouch} onChange={handlePouchSettingChange} />
              ) : project.packagingType === 'inner-packaging-1' ? (
                <InnerPackaging1Panel
                  value={project.innerPackaging1}
                  onChange={(key, value) => commit({
                    type: 'commit',
                    action: { type: 'inner-packaging-1/set', key, value },
                  })}
                  onRotationChange={(value) => commit({
                    type: 'commit',
                    action: { type: 'inner-packaging-1/rotation-set', value },
                  })}
                />
              ) : project.packagingType === 'inner-packaging-2' ? (
                <InnerPackaging1Panel
                  value={project.innerPackaging2}
                  title="内包装2设置"
                  onChange={(key, value) => commit({
                    type: 'commit',
                    action: { type: 'inner-packaging-2/set', key, value },
                  })}
                  onRotationChange={(value) => commit({
                    type: 'commit',
                    action: { type: 'inner-packaging-2/rotation-set', value },
                  })}
                />
              ) : (
                <HangingTissuePanel
                  value={project.hangingTissue}
                  onChange={(key, value) => commit({ type: 'commit', action: { type: 'hanging-tissue/set', key, value } })}
                  onRotationChange={(value) => commit({ type: 'commit', action: { type: 'hanging-tissue/rotation-set', value } })}
                  onPulledSheetChange={(value) => commit({ type: 'commit', action: { type: 'hanging-tissue/set-pulled-sheet', value } })}
                />
              )}
            </>
          ) : activeTab === 'camera' ? (
            <CameraPanel
              autoRotate={project.camera.autoRotate}
              onAutoRotateChange={(value) =>
                commit({
                  type: 'commit',
                  action: { type: 'camera/autoRotate', value },
                })
              }
            />
          ) : project.packagingType === 'box' ? (
            <FinishPanel
              value={project.boxFinish}
              errors={finishErrors}
              onUpload={handleFinishMaskUpload}
              onAction={(action) => commit({ type: 'commit', action })}
            />
          ) : project.packagingType === 'pouch' ? (
            <FinishPanel
              value={project.pouchFinish}
              scope="pouch-finish"
              faces={['front', 'back']}
              faceLabels={{ front: '正面', back: '背面' }}
              errors={pouchFinishErrors}
              onUpload={handlePouchFinishMaskUpload}
              onAction={(action) => commit({ type: 'commit', action })}
            />
          ) : (
            <div className="finish-unavailable">
              <p className="eyebrow">FINISH</p>
              <h1>表面工艺</h1>
              <p className="panel-description">
                {project.packagingType === 'inner-packaging-1'
                  ? '内包装1暂不支持表面工艺。'
                  : project.packagingType === 'inner-packaging-2'
                    ? '内包装2暂不支持表面工艺。'
                    : '悬挂抽纸暂不支持表面工艺。'}
              </p>
            </div>
          )}
        </SettingsPanel>
      </main>
      {showHelp ? (
        <div className="modal-backdrop" role="presentation">
          <section className="help-dialog" role="dialog" aria-modal="true" aria-label="使用帮助">
            <p className="eyebrow">QUICK GUIDE</p>
            <h2>使用帮助</h2>
            <p>六面盒型上传六张图；自立袋和内包装2上传正背面；悬挂抽纸上传正背左右；内包装1上传一张完整 UV 图。左侧可拖拽旋转并用滚轮缩放。</p>
            <p>保存会下载包含五种包装状态的本地项目文件；导出会下载当前 3D 画面的 PNG。</p>
            <button type="button" onClick={() => setShowHelp(false)}>知道了</button>
          </section>
        </div>
      ) : null}
    </div>
  )
}

function PackagingTypeSwitch({
  value,
  onChange,
}: {
  value: PackagingType
  onChange: (value: PackagingType) => void
}) {
  return (
    <fieldset className="packaging-type-switch">
      <legend>包装类型</legend>
      {([
        ['box', '六面盒型'],
        ['pouch', '自立袋'],
        ['inner-packaging-1', '内包装1'],
        ['inner-packaging-2', '内包装2'],
        ['hanging-tissue', '悬挂抽纸'],
      ] as const).map(([type, label]) => (
        <label key={type}>
          <input
            type="radio"
            name="packaging-type"
            value={type}
            checked={value === type}
            onChange={() => onChange(type)}
          />
          <span>{label}</span>
        </label>
      ))}
    </fieldset>
  )
}
