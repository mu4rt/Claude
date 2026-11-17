import type { FabricImage, FabricObject } from 'fabric'
import { create } from 'zustand'
import { DEFAULT_BACKGROUND, DEFAULT_DOC } from '../editor/constants'
import type { BackgroundSpec, DocSize, LayerInfo } from '../editor/types'

export type LeftTab = 'size' | 'text' | 'images' | 'shapes' | 'background' | 'layers'

export interface UploadItem {
  id: string
  name: string
  url: string
  width: number
  height: number
}

export interface Toast {
  id: number
  kind: 'info' | 'success' | 'error'
  message: string
}

export interface BusyState {
  label: string
  /** 0…1; bilinmiyorsa belirsiz ilerleme çubuğu gösterilir */
  progress?: number
}

interface EditorState {
  /** Editör tuvale bağlandı mı? */
  ready: boolean
  selection: FabricObject[]
  /** Seçili nesnenin özellikleri her değiştiğinde artar; paneller buna abone olur */
  tick: number
  layers: LayerInfo[]
  canUndo: boolean
  canRedo: boolean
  zoom: number
  doc: DocSize
  background: BackgroundSpec

  leftTab: LeftTab | null
  uploads: UploadItem[]
  cropTarget: FabricImage | null
  exportOpen: boolean
  busy: BusyState | null
  toasts: Toast[]

  setLeftTab: (tab: LeftTab | null) => void
  addUpload: (item: UploadItem) => void
  removeUpload: (id: string) => void
  openCrop: (image: FabricImage | null) => void
  setExportOpen: (open: boolean) => void
  setBusy: (busy: BusyState | null) => void
  toast: (message: string, kind?: Toast['kind']) => void
  dismissToast: (id: number) => void
}

let toastId = 1

export const useEditorStore = create<EditorState>((set, get) => ({
  ready: false,
  selection: [],
  tick: 0,
  layers: [],
  canUndo: false,
  canRedo: false,
  zoom: 1,
  doc: DEFAULT_DOC,
  background: DEFAULT_BACKGROUND,

  leftTab: 'text',
  uploads: [],
  cropTarget: null,
  exportOpen: false,
  busy: null,
  toasts: [],

  setLeftTab: (leftTab) => set({ leftTab }),
  addUpload: (item) => set({ uploads: [item, ...get().uploads] }),
  removeUpload: (id) => set({ uploads: get().uploads.filter((u) => u.id !== id) }),
  openCrop: (cropTarget) => set({ cropTarget }),
  setExportOpen: (exportOpen) => set({ exportOpen }),
  setBusy: (busy) => set({ busy }),
  toast: (message, kind = 'info') => {
    const id = toastId++
    set({ toasts: [...get().toasts, { id, kind, message }] })
    setTimeout(() => get().dismissToast(id), kind === 'error' ? 7000 : 3500)
  },
  dismissToast: (id) => set({ toasts: get().toasts.filter((t) => t.id !== id) }),
}))

export const toast = (message: string, kind?: Toast['kind']) =>
  useEditorStore.getState().toast(message, kind)
