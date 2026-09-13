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
import { ExportFrameOverlay } from '../export/ExportFrameOverlay'
import {
  DEFAULT_EXPORT_PRESET_ID,
  getExportPreset,
  type ExportPresetId,
} from '../export/exportFrame'
import { InnerPackagingArtworkUploader } from '../innerPackaging/InnerPackagingArtworkUploader'
import { InnerPackaging1Panel } from '../innerPackaging/InnerPackaging1Panel'
import { InnerPackaging2ArtworkUploader } from '../innerPackaging/InnerPackaging2ArtworkUploader'
import { HangingTissueArtworkUploader } from '../hangingTissue/HangingTissueArtworkUploader'
import { HangingTissuePanel } from '../hangingTissue/HangingTissuePanel'
import { FaceTissueArtworkUploader } from '../faceTissue/FaceTissueArtworkUploader'
import { FaceTissuePanel } from '../faceTissue/FaceTissuePanel'
import { WetTissueArtworkUploader } from '../wetTissue/WetTissueArtworkUploader'
import { WetTissuePanel } from '../wetTissue/WetTissuePanel'
import { PouchPanel } from '../pouch/PouchPanel'
import { FinishPanel } from '../finish/FinishPanel'
import { CompositionControls } from '../composition/CompositionControls'
import type { FinishKind } from '../finish/finishTypes'
import { createProjectHistory, projectHistoryReducer } from './projectHistory'
import { getSelectedInstance } from './projectReducer'
import type {
  BoxFace,
  HangingTissueFace,
  ArtworkTransform,
  PouchClosure,
  PouchFace,
  PouchState,
  WetTissueArtworkSlot,
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
  const [faceTissueError, setFaceTissueError] = useState<string>()
  const [washTissueError, setWashTissueError] = useState<string>()
  const [wetTissueErrors, setWetTissueErrors] = useState<Partial<Record<WetTissueArtworkSlot, string>>>({})
  const [finishErrors, setFinishErrors] = useState<Partial<Record<FinishKind, Partial<Record<BoxFace, string>>>>>({})
  const [pouchFinishErrors, setPouchFinishErrors] = useState<Partial<Record<FinishKind, Partial<Record<PouchFace, string>>>>>({})
  const [cameraCommand, setCameraCommand] = useState<{
    type: CameraCommand
    nonce: number
  } | null>(null)
  const [showHelp, setShowHelp] = useState(false)
  const [exportPresetId, setExportPresetId] = useState<ExportPresetId>(DEFAULT_EXPORT_PRESET_ID)
  const [pedestalNotice, setPedestalNotice] = useState<string | null>(null)
  const openInputRef = useRef<HTMLInputElement>(null)
  const boxSceneRef = useRef<BoxSceneHandle>(null)
  const rootProject = history.present
  const selectedInstance = getSelectedInstance(rootProject)
  const project = { ...rootProject, ...selectedInstance }
  const exportPreset = getExportPreset(exportPresetId)

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
        referenceDimensions: {
          width: project.hangingTissue.width,
          height: project.hangingTissue.height,
          depth: project.hangingTissue.depth,
        },
      } })
      setHangingTissueErrors((current) => ({ ...current, [face]: undefined }))
    } catch (error) {
      setHangingTissueErrors((current) => ({
        ...current, [face]: error instanceof Error ? error.message : '图片读取失败',
      }))
    }
  }

  async function handleFaceTissueArtworkUpload(file: File) {
    try {
      const metadata = await validateImage(file)
      const previewUrl = await readImageDataUrl(file)
      commit({ type: 'commit', action: {
        type: 'face-tissue/artwork-set',
        asset: { id: crypto.randomUUID(), name: file.name, previewUrl, ...metadata },
      } })
      setFaceTissueError(undefined)
    } catch (error) {
      setFaceTissueError(error instanceof Error ? error.message : '图片读取失败')
    }
  }

  async function handleWashTissueArtworkUpload(file: File) {
    try {
      const metadata = await validateImage(file)
      const previewUrl = await readImageDataUrl(file)
      commit({ type: 'commit', action: {
        type: 'wash-tissue/artwork-set',
        asset: { id: crypto.randomUUID(), name: file.name, previewUrl, ...metadata },
      } })
      setWashTissueError(undefined)
    } catch (error) {
      setWashTissueError(error instanceof Error ? error.message : '图片读取失败')
    }
  }

  async function handleWetTissueUpload(slot: WetTissueArtworkSlot, file: File) {
    try {
      const metadata = await validateImage(file)
      const previewUrl = await readImageDataUrl(file)
      commit({ type: 'commit', action: {
        type: 'wet-tissue/artwork-set', slot,
        asset: { id: crypto.randomUUID(), name: file.name, previewUrl, ...metadata },
      } })
      setWetTissueErrors((current) => ({ ...current, [slot]: undefined }))
    } catch (error) {
      setWetTissueErrors((current) => ({
        ...current, [slot]: error instanceof Error ? error.message : '图片读取失败',
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

  function handleFaceTissueArtworkRemove() {
    commit({ type: 'commit', action: { type: 'face-tissue/artwork-remove' } })
    setFaceTissueError(undefined)
  }

  function handleWashTissueArtworkRemove() {
    commit({ type: 'commit', action: { type: 'wash-tissue/artwork-remove' } })
    setWashTissueError(undefined)
  }

  function handleWetTissueRemove(slot: WetTissueArtworkSlot) {
    commit({ type: 'commit', action: { type: 'wet-tissue/artwork-remove', slot } })
    setWetTissueErrors((current) => ({ ...current, [slot]: undefined }))
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
    const savedProject = { ...rootProject, name }
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
      setFaceTissueError(undefined)
      setWashTissueError(undefined)
      setWetTissueErrors({})
      setFinishErrors({})
      setPouchFinishErrors({})
      setExportPresetId(DEFAULT_EXPORT_PRESET_ID)
    } catch (error) {
      window.alert(error instanceof Error ? error.message : '项目文件读取失败')
    }
  }

  function handleExport(selection: PngExportSelection) {
    const png = boxSceneRef.current?.exportTransparentPng(selection)
    if (!png) return
    downloadFile(
      dataUrlToBlob(png),
      `${name || '未命名包装'}-${selection.width}x${selection.height}-${selection.includeShadow ? '带投影' : '无投影'}.png`,
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
            setFaceTissueError(undefined)
            setWashTissueError(undefined)
            setWetTissueErrors({})
            setFinishErrors({})
            setPouchFinishErrors({})
            setExportPresetId(DEFAULT_EXPORT_PRESET_ID)
          }
        }}
        onOpen={() => openInputRef.current?.click()}
        onSave={handleSave}
        onHelp={() => setShowHelp(true)}
        exportPreset={exportPreset}
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
            project={rootProject}
            command={cameraCommand}
            exportPreset={exportPreset}
            onSelectInstance={(id) => commit({ type: 'commit', action: { type: 'instance/select', id } })}
            onPedestalFallback={setPedestalNotice}
          />
          <ExportFrameOverlay
            presetId={exportPresetId}
            onChange={setExportPresetId}
            pedestal={rootProject.pedestal}
            onPedestalPresetChange={(value) => commit({ type: 'commit', action: { type: 'pedestal/preset-set', value } })}
            onPedestalColorChange={(value) => commit({ type: 'commit', action: { type: 'pedestal/color-set', value } })}
          />
          <div className="preview-copy preview-copy--overlay">
            <span>3D PREVIEW</span>
            <p>所有图片仅在当前浏览器本地处理</p>
          </div>
          {pedestalNotice ? <div className="pedestal-notice" role="status">{pedestalNotice}</div> : null}
          <PreviewControls onCommand={handleCameraCommand} />
        </section>
        <SettingsPanel activeTab={activeTab} onTabChange={setActiveTab}>
          <CompositionControls
            instances={rootProject.instances}
            selectedId={rootProject.selectedInstanceId}
            layout={rootProject.layout}
            onAdd={(packagingType) => commit({ type: 'commit', action: { type: 'instance/add', packagingType, id: crypto.randomUUID() } })}
            onSelect={(id) => commit({ type: 'commit', action: { type: 'instance/select', id } })}
            onRemove={(id) => commit({ type: 'commit', action: { type: 'instance/remove', id } })}
            onLayout={(value) => commit({ type: 'commit', action: { type: 'layout/set', value } })}
          />
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
                      : project.packagingType === 'face-tissue'
                        ? '面纸印刷贴图'
                        : project.packagingType === 'wash-tissue'
                          ? '洗脸巾印刷贴图'
                        : project.packagingType === 'wet-tissue'
                          ? '湿纸巾印刷贴图'
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
                        : project.packagingType === 'face-tissue'
                        ? '上传一张按照原始 UV 模板制作的完整贴图，覆盖前、后、上、下主体面。'
                        : project.packagingType === 'wash-tissue'
                          ? '上传一张按照原始 UV 模板制作的完整贴图，主体按模型原始 UV 自动贴合。'
                          : project.packagingType === 'wet-tissue'
                            ? '上传纸盒和盖子两张完整 UV 贴图；图片按模型原始 UV 自动贴合。'
                            : '分别上传正面、背面、左侧、右侧设计图；图片按模型实际表面自动贴合。'}
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
              ) : project.packagingType === 'face-tissue' ? (
                <FaceTissueArtworkUploader
                  value={project.faceTissue}
                  error={faceTissueError}
                  defaultOpen
                  onUpload={handleFaceTissueArtworkUpload}
                  onRemove={handleFaceTissueArtworkRemove}
                  onTransformChange={(key: keyof ArtworkTransform, value) => commit({
                    type: 'commit',
                    action: { type: 'face-tissue/transform-set', key, value },
                  })}
                  onTransformReset={() => commit({
                    type: 'commit',
                    action: { type: 'face-tissue/transform-reset' },
                  })}
                />
              ) : project.packagingType === 'wash-tissue' ? (
                <FaceTissueArtworkUploader
                  value={project.washTissue}
                  error={washTissueError}
                  label="洗脸巾图稿（完整 UV）"
                  transformAriaLabel="洗脸巾贴图变换"
                  transformTitle="洗脸巾贴图调整"
                  onUpload={handleWashTissueArtworkUpload}
                  onRemove={handleWashTissueArtworkRemove}
                  onTransformChange={(key, value) => commit({
                    type: 'commit',
                    action: { type: 'wash-tissue/transform-set', key, value },
                  })}
                  onTransformReset={() => commit({
                    type: 'commit',
                    action: { type: 'wash-tissue/transform-reset' },
                  })}
                />
              ) : project.packagingType === 'wet-tissue' ? (
                <WetTissueArtworkUploader
                  value={project.wetTissue}
                  errors={wetTissueErrors}
                  onUpload={handleWetTissueUpload}
                  onRemove={handleWetTissueRemove}
                  onSelectArtwork={(slot) => commit({ type: 'commit', action: { type: 'wet-tissue/select-artwork', slot } })}
                  onTransformChange={(slot, key, value) => commit({ type: 'commit', action: { type: 'wet-tissue/transform-set', slot, key, value } })}
                  onTransformReset={(slot) => commit({ type: 'commit', action: { type: 'wet-tissue/transform-reset', slot } })}
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
              ) : project.packagingType === 'face-tissue' ? (
                <FaceTissuePanel
                  value={project.faceTissue}
                  onChange={(key, value) => commit({
                    type: 'commit',
                    action: { type: 'face-tissue/set', key, value },
                  })}
                  onRotationChange={(value) => commit({
                    type: 'commit',
                    action: { type: 'face-tissue/rotation-set', value },
                  })}
                  onTopSheetChange={(value) => commit({
                    type: 'commit',
                    action: { type: 'face-tissue/set-top-sheet', value },
                  })}
                />
              ) : project.packagingType === 'wash-tissue' ? (
                <FaceTissuePanel
                  value={project.washTissue}
                  title="洗脸巾设置"
                  eyebrow="WASH TISSUE DIMENSIONS"
                  description="主体图稿使用完整 UV，顶部平面保留模型结构材质。"
                  topSheetLabel="显示顶部纸张"
                  topSheetAriaLabel="顶部纸张"
                  rotationName="wash-tissue-model-rotation"
                  showRadius={false}
                  onChange={(key, value) => {
                    if (key !== 'radius') commit({ type: 'commit', action: { type: 'wash-tissue/set', key, value } })
                  }}
                  onRotationChange={(value) => commit({
                    type: 'commit',
                    action: { type: 'wash-tissue/rotation-set', value },
                  })}
                  onTopSheetChange={(value) => commit({
                    type: 'commit',
                    action: { type: 'wash-tissue/set-top-sheet', value },
                  })}
                />
              ) : project.packagingType === 'wet-tissue' ? (
                <WetTissuePanel
                  value={project.wetTissue}
                  onChange={(key, value) => commit({ type: 'commit', action: { type: 'wet-tissue/set', key, value } })}
                  onRotationChange={(value) => commit({ type: 'commit', action: { type: 'wet-tissue/rotation-set', value } })}
                  onModelStateChange={(value) => commit({ type: 'commit', action: { type: 'wet-tissue/set-model-state', value } })}
                  onTopSheetChange={(value) => commit({ type: 'commit', action: { type: 'wet-tissue/set-top-sheet', value } })}
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
              lightingIntensity={project.camera.lightingIntensity}
              onAutoRotateChange={(value) =>
                commit({
                  type: 'commit',
                  action: { type: 'camera/autoRotate', value },
                })
              }
              onLightingIntensityChange={(value) =>
                commit({
                  type: 'commit',
                  action: { type: 'camera/lightingIntensity', value },
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
                    : project.packagingType === 'face-tissue'
                      ? '面纸暂不支持表面工艺。'
                      : project.packagingType === 'wet-tissue'
                        ? '湿纸巾暂不支持表面工艺。'
                        : project.packagingType === 'wash-tissue'
                          ? '洗脸巾暂不支持表面工艺。'
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
            <p>六面盒型上传六张图；自立袋和内包装2上传正背面；悬挂抽纸上传正背左右；内包装1、面纸和洗脸巾上传一张完整 UV 图；湿纸巾上传纸盒和盖子两张完整 UV 图。左侧可拖拽旋转并用滚轮缩放。</p>
            <p>保存会下载包含当前全部包装状态的本地项目文件；导出会下载当前 3D 画面的 PNG。</p>
            <button type="button" onClick={() => setShowHelp(false)}>知道了</button>
          </section>
        </div>
      ) : null}
    </div>
  )
}
