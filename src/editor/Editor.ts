import {
  ActiveSelection,
  BaseFabricObject,
  Canvas,
  FabricImage,
  FabricObject,
  Gradient,
  InteractiveFabricObject,
  Pattern,
  Point,
  Rect,
  Shadow,
  config,
  util,
  type TMat2D,
} from 'fabric'
import { AligningGuidelines } from 'fabric/extensions'
import {
  ACCENT,
  COLOR_SWATCHES,
  CUSTOM_PROPS,
  DEFAULT_BACKGROUND,
  DEFAULT_DOC,
  FIT_PADDING,
  MAX_DOC_SIDE,
  MAX_ZOOM,
  MIN_DOC_SIDE,
  MIN_ZOOM,
} from './constants'
import { applyFx, buildFilters, getFx } from './filters'
import { FONT_MAP, nearestWeight } from './fontCatalog'
import { ensureFont, onFontsLoaded } from './fonts'
import { History } from './history'
import {
  applyCrop,
  createImage,
  fitImageToDoc,
  initialImageScale,
  prepareImage,
  replaceImageSource,
  type CropRect,
} from './images'
import { StudioText } from './objects/StudioText'
import { SHAPE_LABELS, createShape } from './shapes'
import { createText, refreshText, updateTextCurve, type TextPreset } from './text'
import type {
  AlignMode,
  BackgroundSpec,
  DocSize,
  EditorEvents,
  ImageFx,
  LayerInfo,
  ShapeKind,
  Snapshot,
} from './types'
import { clamp, degToRad, isTypingTarget, rafThrottle, uid } from './utils'

/* -------------------------------------------------------------------------- */
/*  Fabric'in genel ayarları (bir kez)                                         */
/* -------------------------------------------------------------------------- */

let fabricConfigured = false

function configureFabric() {
  if (fabricConfigured) return
  fabricConfigured = true

  // Not: toObject() bu listeyi taban sınıftan okur; alt sınıfların kendi
  // `customProperties` listeleri (ör. StudioText) buna eklenir.
  BaseFabricObject.customProperties = CUSTOM_PROPS

  // Büyük metin/şekillerin yüksek çözünürlüklü dışa aktarımda bulanıklaşmaması
  // için nesne önbelleği sınırlarını yükselt.
  config.configure({ perfLimitSizeTotal: 4096 * 4096, maxCacheSideLimit: 8192 })

  Object.assign(InteractiveFabricObject.ownDefaults, {
    transparentCorners: false,
    cornerStyle: 'circle',
    cornerColor: '#ffffff',
    cornerStrokeColor: ACCENT,
    cornerSize: 11,
    touchCornerSize: 28,
    borderColor: ACCENT,
    borderScaleFactor: 1.5,
    padding: 0,
  })
}

/**
 * Hizalama kılavuzları yalnızca taşıma sırasında etkindir. Eklentinin ölçekleme
 * sırasındaki yapışması orantılı ölçeklemede küçük bir dikey düzeltmeyi yatayda
 * katlayarak uyguladığı için ince-uzun nesneler (metin) sıçrar; bu yüzden kapatıldı.
 */
class MoveGuidelines extends AligningGuidelines {
  scalingOrResizing() {}
}

const SHAPE_COLORS = [ACCENT, ...COLOR_SWATCHES.slice(2, 8)]

export const isText = (obj: unknown): obj is StudioText => obj instanceof StudioText
export const isImage = (obj: unknown): obj is FabricImage => obj instanceof FabricImage

const LOCK_FLAGS = [
  'lockMovementX',
  'lockMovementY',
  'lockRotation',
  'lockScalingX',
  'lockScalingY',
  'lockSkewingX',
  'lockSkewingY',
] as const

type Listener<T> = (payload: T) => void

export class Editor {
  readonly canvas: Canvas
  readonly history: History
  doc: DocSize = { ...DEFAULT_DOC }
  background: BackgroundSpec = DEFAULT_BACKGROUND

  private container: HTMLElement
  private listeners = new Map<keyof EditorEvents, Set<Listener<never>>>()
  private cleanups: (() => void)[] = []
  private guidelines: MoveGuidelines
  private artboardProxy = new Rect({ strokeWidth: 0 })
  private clipboard: FabricObject[] = []
  private pasteCount = 0
  private addCount = 0
  private shapeCount = 0
  private pendingFx = new Set<FabricImage>()
  private fxFrame = 0
  private spaceDown = false
  /** true iken görünüm, pencere boyutu değiştikçe tuvale sığdırılır */
  private autoFit = true
  /** Geri yükleme / toplu işlem sırasında UI olaylarını bastırır */
  private silent = 0
  private disposed = false
  private exporting = false

  constructor(container: HTMLElement) {
    configureFabric()
    this.container = container

    const el = document.createElement('canvas')
    container.appendChild(el)

    this.canvas = new Canvas(el, {
      width: Math.max(1, container.clientWidth),
      height: Math.max(1, container.clientHeight),
      preserveObjectStacking: true,
      controlsAboveOverlay: true,
      renderOnAddRemove: false,
      stopContextMenu: true,
      fireRightClick: false,
      fireMiddleClick: false,
      selectionColor: 'rgba(139,108,255,0.12)',
      selectionBorderColor: ACCENT,
      selectionLineWidth: 1,
      targetFindTolerance: 6,
    })

    this.history = new History({
      take: () => JSON.stringify(this.serialize()),
      restore: (state) => this.restore(JSON.parse(state) as Snapshot),
      onChange: (state) => this.emit('history', state),
    })

    this.guidelines = new MoveGuidelines(this.canvas, {
      margin: 6,
      width: 1,
      color: '#ff4d8d',
      getObjectsByTarget: (target) => this.snapTargets(target),
    })

    this.syncArtboard()
    this.applyBackground()
    this.bindCanvasEvents()
    this.bindDomEvents()
    this.fit()
    this.history.reset()
  }

  /* ------------------------------------------------------------------------ */
  /*  Olay yayıncısı                                                           */
  /* ------------------------------------------------------------------------ */

  on<K extends keyof EditorEvents>(event: K, listener: Listener<EditorEvents[K]>) {
    let set = this.listeners.get(event)
    if (!set) this.listeners.set(event, (set = new Set()))
    set.add(listener as Listener<never>)
    return () => {
      set.delete(listener as Listener<never>)
    }
  }

  private emit<K extends keyof EditorEvents>(event: K, payload?: EditorEvents[K]) {
    if (this.disposed) return
    this.listeners.get(event)?.forEach((listener) => (listener as Listener<unknown>)(payload))
  }

  private emitChange = rafThrottle(() => this.emit('change'))

  /* ------------------------------------------------------------------------ */
  /*  Kurulum / temizlik                                                       */
  /* ------------------------------------------------------------------------ */

  private bindCanvasEvents() {
    const c = this.canvas

    const onSelection = (e: object) => {
      const { deselected } = e as { deselected?: FabricObject[] }
      deselected?.forEach((obj) => this.bakeTextScale(obj))
      if (this.silent) return
      this.emit('selection', c.getActiveObjects())
    }
    c.on('selection:created', onSelection)
    c.on('selection:updated', onSelection)
    c.on('selection:cleared', onSelection)

    c.on('object:modified', ({ target }) => {
      if (target) this.bakeTextScale(target)
      this.history.commit()
      this.emit('change')
    })

    const live = () => this.emitChange()
    c.on('object:moving', live)
    c.on('object:scaling', live)
    c.on('object:rotating', live)
    c.on('object:skewing', live)

    const onStack = () => {
      if (!this.silent) this.emit('layers')
    }
    c.on('object:added', onStack)
    c.on('object:removed', onStack)

    c.on('text:changed', ({ target }) => {
      // Tuvalde yazarken sabit kenarı (hizalamaya göre) Fabric kendisi korur.
      // Yeni yazılan karakterlerin (ör. ğ, ş) alt kümesi henüz inmemiş olabilir:
      void ensureFont(target.fontFamily, {
        weight: target.fontWeight,
        italic: target.fontStyle === 'italic',
        text: target.text,
      })
      this.history.scheduleCommit(600)
      this.emitChange()
    })
    c.on('text:editing:exited', ({ target }) => {
      // Boş bırakılan metin kutularını temizle
      if (!target.text.trim()) c.remove(target)
      this.history.commit()
      this.emit('change')
      this.emit('layers')
    })

    c.on('after:render', ({ ctx }) => this.drawArtboardChrome(ctx))
  }

  private bindDomEvents() {
    const { container } = this
    const listen = <K extends keyof WindowEventMap>(
      target: Window | HTMLElement,
      type: K,
      handler: (e: WindowEventMap[K]) => void,
      options?: AddEventListenerOptions,
    ) => {
      target.addEventListener(type, handler as EventListener, options)
      this.cleanups.push(() => target.removeEventListener(type, handler as EventListener, options))
    }

    // Pencere boyutu
    const observer = new ResizeObserver(() => {
      const width = Math.max(1, container.clientWidth)
      const height = Math.max(1, container.clientHeight)
      if (width === this.canvas.width && height === this.canvas.height) return
      this.canvas.setDimensions({ width, height })
      if (this.autoFit) this.fit()
      else this.canvas.requestRenderAll()
    })
    observer.observe(container)
    this.cleanups.push(() => observer.disconnect())

    // Tekerlek: Ctrl/⌘ ile imlece doğru yakınlaştır, aksi hâlde kaydır
    listen(
      container,
      'wheel',
      (e) => {
        e.preventDefault()
        if (e.ctrlKey || e.metaKey) {
          const rect = container.getBoundingClientRect()
          const point = new Point(e.clientX - rect.left, e.clientY - rect.top)
          const factor = Math.exp(-clamp(e.deltaY, -120, 120) * 0.0035)
          this.zoomTo(this.zoom * factor, point)
        } else {
          const dx = e.shiftKey ? e.deltaY : e.deltaX
          const dy = e.shiftKey ? 0 : e.deltaY
          this.pan(-dx, -dy)
        }
      },
      { passive: false },
    )

    // Boşluk tuşu + sürükleme veya orta tuşla gezinme (pan)
    let panning: { x: number; y: number } | null = null
    listen(
      container,
      'mousedown',
      (e) => {
        if (!(this.spaceDown || e.button === 1)) return
        e.preventDefault()
        e.stopPropagation()
        panning = { x: e.clientX, y: e.clientY }
        container.style.cursor = 'grabbing'
        this.canvas.setCursor('grabbing')
      },
      { capture: true },
    )
    listen(window, 'mousemove', (e) => {
      if (!panning) return
      this.pan(e.clientX - panning.x, e.clientY - panning.y)
      panning = { x: e.clientX, y: e.clientY }
    })
    listen(window, 'mouseup', () => {
      if (!panning) return
      panning = null
      container.style.cursor = ''
      this.canvas.setCursor(this.spaceDown ? 'grab' : 'default')
    })

    const setSpace = (down: boolean) => {
      if (this.spaceDown === down) return
      this.spaceDown = down
      this.canvas.skipTargetFind = down
      this.canvas.selection = !down
      this.canvas.defaultCursor = down ? 'grab' : 'default'
      this.canvas.setCursor(down ? 'grab' : 'default')
    }
    listen(window, 'keydown', (e) => {
      if (e.code !== 'Space' || isTypingTarget(e.target)) return
      e.preventDefault()
      setSpace(true)
    })
    listen(window, 'keyup', (e) => {
      if (e.code === 'Space') setSpace(false)
    })
    listen(window, 'blur', () => setSpace(false))

    // Arka planda inen yazı tipi alt kümeleri tamamlandığında ölçüleri tazele
    this.cleanups.push(
      onFontsLoaded((families) => {
        let touched = false
        for (const obj of this.canvas.getObjects()) {
          if (isText(obj) && families.includes(obj.fontFamily) && !obj.isEditing) {
            refreshText(obj)
            touched = true
          }
        }
        if (touched) {
          this.canvas.requestRenderAll()
          this.emit('change')
        }
      }),
    )
  }

  dispose() {
    if (this.disposed) return
    this.disposed = true
    cancelAnimationFrame(this.fxFrame)
    this.cleanups.forEach((fn) => fn())
    this.guidelines.dispose()
    this.listeners.clear()
    // Yalnızca bu örneğe ait DOM düğümlerini kaldır: React StrictMode'da aynı
    // kapsayıcıya hemen yeni bir editör bağlanabilir.
    const nodes = [this.canvas.wrapperEl, this.canvas.lowerCanvasEl, this.canvas.upperCanvasEl]
    void this.canvas.dispose().finally(() => nodes.forEach((node) => node?.remove()))
  }

  /* ------------------------------------------------------------------------ */
  /*  Tuval (artboard) ve arka plan                                            */
  /* ------------------------------------------------------------------------ */

  /** Tuval sınırları dışında kalan her şeyi kırpan maske ve hizalama vekili. */
  private syncArtboard() {
    const { width, height } = this.doc
    this.canvas.clipPath = new Rect({
      left: width / 2,
      top: height / 2,
      width,
      height,
      strokeWidth: 0,
      excludeFromExport: true,
    })
    this.artboardProxy.set({ left: width / 2, top: height / 2, width, height })
    this.artboardProxy.setCoords()
  }

  private applyBackground() {
    const { width, height } = this.doc
    const bg = this.background
    if (bg.type === 'solid') {
      this.canvas.backgroundColor = bg.color
    } else if (bg.type === 'gradient') {
      // CSS açı kuralı: 0° yukarı, 90° sağa
      const a = degToRad(bg.angle)
      const dx = Math.sin(a)
      const dy = -Math.cos(a)
      const half = (Math.abs(width * dx) + Math.abs(height * dy)) / 2
      this.canvas.backgroundColor = new Gradient({
        type: 'linear',
        gradientUnits: 'pixels',
        coords: {
          x1: width / 2 - dx * half,
          y1: height / 2 - dy * half,
          x2: width / 2 + dx * half,
          y2: height / 2 + dy * half,
        },
        colorStops: bg.stops.map((stop) => ({ ...stop })),
      })
    } else {
      this.canvas.backgroundColor = this.checkerboard()
    }
  }

  /** Saydam arka planı düzenleme sırasında göstermek için dama deseni. */
  private checkerboard() {
    const cell = Math.max(8, Math.round(Math.min(this.doc.width, this.doc.height) / 48))
    const tile = document.createElement('canvas')
    tile.width = tile.height = cell * 2
    const ctx = tile.getContext('2d')!
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, cell * 2, cell * 2)
    ctx.fillStyle = '#d9dbe1'
    ctx.fillRect(0, 0, cell, cell)
    ctx.fillRect(cell, cell, cell, cell)
    return new Pattern({ source: tile, repeat: 'repeat' })
  }

  /** Tuvalin çalışma alanından ayrışması için altına yumuşak bir gölge çizer. */
  private drawArtboardChrome(ctx: CanvasRenderingContext2D) {
    if (this.exporting) return
    ctx.save()
    ctx.transform(...this.canvas.viewportTransform)
    ctx.globalCompositeOperation = 'destination-over'
    ctx.shadowColor = 'rgba(0, 0, 0, 0.6)'
    ctx.shadowBlur = 48
    ctx.shadowOffsetY = 14
    ctx.fillStyle = '#000'
    ctx.fillRect(0, 0, this.doc.width, this.doc.height)
    ctx.restore()
  }

  /**
   * Tuvali ekran dışı bir yüzeye çizen işlemleri (dışa aktarma, önizleme) sarar.
   * Bu sırada tuval gölgesi çizilmez ve hizalama kılavuzları devre dışı kalır;
   * Fabric dışa aktarım boyunca üst tuval bağlamını geçici olarak kaldırdığı için
   * kılavuz eklentisi aksi hâlde hataya düşer.
   */
  renderOffscreen<T>(render: () => T): T {
    this.exporting = true
    this.guidelines.dispose()
    try {
      return render()
    } finally {
      this.guidelines.initBehavior()
      this.exporting = false
    }
  }

  setBackground(background: BackgroundSpec, commit: 'now' | 'debounce' = 'debounce') {
    this.background = background
    this.applyBackground()
    this.canvas.requestRenderAll()
    this.emit('doc')
    if (commit === 'now') this.history.commit()
    else this.history.scheduleCommit()
  }

  /**
   * Tuval boyutunu değiştirir. İçerik, yeni tuvalin merkezine göre yerinde
   * kalacak şekilde kaydırılır.
   */
  setDocSize(width: number, height: number) {
    const w = clamp(Math.round(width), MIN_DOC_SIDE, MAX_DOC_SIDE)
    const h = clamp(Math.round(height), MIN_DOC_SIDE, MAX_DOC_SIDE)
    if (w === this.doc.width && h === this.doc.height) return
    const dx = (w - this.doc.width) / 2
    const dy = (h - this.doc.height) / 2
    this.canvas.discardActiveObject()
    for (const obj of this.canvas.getObjects()) {
      obj.set({ left: obj.left + dx, top: obj.top + dy })
      obj.setCoords()
    }
    this.doc = { width: w, height: h }
    this.syncArtboard()
    this.applyBackground()
    this.fit()
    this.emit('doc')
    this.history.commit()
  }

  /* ------------------------------------------------------------------------ */
  /*  Görünüm: yakınlaştırma ve gezinme                                        */
  /* ------------------------------------------------------------------------ */

  get zoom() {
    return this.canvas.getZoom()
  }

  /** Tuvali çalışma alanına sığdırır ve ortalar. */
  fit() {
    const cw = this.canvas.width
    const ch = this.canvas.height
    const pad = Math.min(FIT_PADDING, cw * 0.08, ch * 0.08)
    const zoom = clamp(
      Math.min((cw - pad * 2) / this.doc.width, (ch - pad * 2) / this.doc.height),
      MIN_ZOOM,
      1,
    )
    this.canvas.setViewportTransform([
      zoom,
      0,
      0,
      zoom,
      (cw - this.doc.width * zoom) / 2,
      (ch - this.doc.height * zoom) / 2,
    ] as TMat2D)
    this.canvas.requestRenderAll()
    this.autoFit = true
    this.emit('zoom', zoom)
  }

  zoomTo(zoom: number, point?: Point) {
    const target = clamp(zoom, MIN_ZOOM, MAX_ZOOM)
    this.canvas.zoomToPoint(
      point ?? new Point(this.canvas.width / 2, this.canvas.height / 2),
      target,
    )
    this.canvas.requestRenderAll()
    this.autoFit = false
    this.emit('zoom', target)
  }

  zoomBy(factor: number) {
    this.zoomTo(this.zoom * factor)
  }

  pan(dx: number, dy: number) {
    if (!dx && !dy) return
    this.canvas.relativePan(new Point(dx, dy))
    this.canvas.requestRenderAll()
    this.autoFit = false
  }

  /** Ekran (client) koordinatını tuval koordinatına çevirir. */
  clientToScene(clientX: number, clientY: number) {
    const rect = this.container.getBoundingClientRect()
    return new Point(clientX - rect.left, clientY - rect.top).transform(
      util.invertTransform(this.canvas.viewportTransform),
    )
  }

  /* ------------------------------------------------------------------------ */
  /*  Nesne ekleme                                                             */
  /* ------------------------------------------------------------------------ */

  /** Tuvalin kısa kenarına göre içerik ölçeği (1080 px = 1). */
  get contentScale() {
    return clamp(Math.min(this.doc.width, this.doc.height) / 1080, 0.35, 3)
  }

  private nextName(base: string) {
    const used = new Set(this.canvas.getObjects().map((o) => o.name))
    let n = 1
    while (used.has(`${base} ${n}`)) n++
    return `${base} ${n}`
  }

  /** Yüklenen/eklenen her nesneye editöre özgü davranışları uygular. */
  private hydrate(obj: FabricObject) {
    obj.id ??= uid()
    if (isText(obj)) {
      obj.kind = 'text'
      // Metin yalnızca köşelerden (orantılı) ölçeklenir; ölçek puntoya işlenir
      obj.setControlsVisibility({ ml: false, mr: false, mt: false, mb: false })
    } else if (isImage(obj)) {
      obj.kind = 'image'
    } else {
      obj.kind ??= 'shape'
      if (obj.shape === 'line') obj.setControlsVisibility({ mt: false, mb: false })
    }
    this.applyLock(obj, !!obj.locked)
  }

  private place(obj: FabricObject, baseName: string, at?: Point) {
    obj.name ??= this.nextName(baseName)
    this.hydrate(obj)
    let center = at
    if (!center) {
      // Art arda eklenen nesneler üst üste binmesin
      const step = (this.addCount++ % 6) * 28 * this.contentScale
      center = new Point(this.doc.width / 2 + step, this.doc.height / 2 + step)
    }
    obj.setPositionByOrigin(center, 'center', 'center')
    obj.setCoords()
    this.canvas.add(obj)
    this.canvas.setActiveObject(obj)
    this.canvas.requestRenderAll()
    this.history.commit()
    return obj
  }

  async addText(preset: TextPreset, at?: Point, textOverride?: string) {
    await ensureFont(String(preset.props.fontFamily ?? 'Inter'), {
      weight: Number(preset.props.fontWeight ?? 400),
      text: textOverride ?? preset.text,
    })
    const text = createText(preset, this.contentScale, textOverride)
    return this.place(text, 'Metin', at) as StudioText
  }

  addShape(kind: ShapeKind, at?: Point, fill?: string) {
    const size = Math.min(this.doc.width, this.doc.height) * 0.3
    // Art arda eklenen şekiller birbirinden ayırt edilsin diye renkler sırayla verilir
    const color = fill ?? SHAPE_COLORS[this.shapeCount++ % SHAPE_COLORS.length]
    return this.place(createShape(kind, size, color), SHAPE_LABELS[kind], at)
  }

  async addImageFromUrl(url: string, name?: string, at?: Point) {
    const image = await createImage(url)
    const scale = initialImageScale(image, this.doc)
    image.set({ scaleX: scale, scaleY: scale })
    if (name) image.name = this.nextName(name.replace(/\.[^.]+$/, '').slice(0, 28) || 'Görsel')
    return this.place(image, 'Görsel', at) as FabricImage
  }

  async addImageFromBlob(blob: Blob, name?: string, at?: Point) {
    const loaded = await prepareImage(blob, name)
    return this.addImageFromUrl(loaded.url, name, at)
  }

  /* ------------------------------------------------------------------------ */
  /*  Seçim ve genel düzenleme                                                 */
  /* ------------------------------------------------------------------------ */

  getSelection() {
    return this.canvas.getActiveObjects()
  }

  /** Tek nesne seçiliyse o nesne, çoklu seçimde seçim grubunun kendisi. */
  getActive() {
    return this.canvas.getActiveObject()
  }

  private selectObjects(objects: FabricObject[]) {
    this.canvas.discardActiveObject()
    if (objects.length === 1) {
      this.canvas.setActiveObject(objects[0])
    } else if (objects.length > 1) {
      this.canvas.setActiveObject(new ActiveSelection(objects, { canvas: this.canvas }))
    }
    this.canvas.requestRenderAll()
  }

  selectAll() {
    this.selectObjects(this.canvas.getObjects().filter((o) => o.visible && !o.locked))
  }

  deselect() {
    this.canvas.discardActiveObject()
    this.canvas.requestRenderAll()
  }

  /** Seçili nesnelerin özelliklerini değiştirir. */
  setProps(props: Record<string, unknown>, commit: 'now' | 'debounce' = 'debounce') {
    const targets = this.getSelection()
    if (!targets.length) return
    for (const obj of targets) {
      obj.set(props)
      obj.setCoords()
    }
    this.afterChange(commit)
  }

  /** Dönüşüm (konum/ölçek/açı) seçim grubuna, tekil seçimde nesneye uygulanır. */
  setTransform(props: Record<string, number | boolean>, commit: 'now' | 'debounce' = 'debounce') {
    const active = this.getActive()
    if (!active) return
    const { angle, ...rest } = props
    if (typeof angle === 'number') active.rotate(angle)
    active.set(rest)
    active.setCoords()
    this.afterChange(commit)
  }

  setShadow(
    shadow: { color: string; blur: number; offsetX: number; offsetY: number } | null,
    commit: 'now' | 'debounce' = 'debounce',
  ) {
    for (const obj of this.getSelection()) {
      obj.set('shadow', shadow ? new Shadow(shadow) : null)
    }
    this.afterChange(commit)
  }

  private afterChange(commit: 'now' | 'debounce' | 'none' = 'debounce') {
    this.canvas.requestRenderAll()
    this.emit('change')
    if (commit === 'now') this.history.commit()
    else if (commit === 'debounce') this.history.scheduleCommit()
  }

  deleteSelection() {
    const targets = this.getSelection()
    if (!targets.length) return
    this.canvas.discardActiveObject()
    this.canvas.remove(...targets)
    this.afterChange('now')
  }

  /** Nesneyi, seçim grubunun içinde olsa bile tuval koordinatlarıyla kopyalar. */
  private async cloneAbsolute(obj: FabricObject) {
    const clone = await obj.clone()
    if (obj.group) util.applyTransformToObject(clone, obj.calcTransformMatrix())
    return clone
  }

  async copy() {
    const targets = this.getSelection()
    if (!targets.length) return
    this.clipboard = await Promise.all(targets.map((o) => this.cloneAbsolute(o)))
    this.pasteCount = 0
  }

  async cut() {
    await this.copy()
    this.deleteSelection()
  }

  private async insertClones(sources: FabricObject[], offset: number) {
    const clones = await Promise.all(sources.map((o) => o.clone()))
    this.silent++
    for (const [i, clone] of clones.entries()) {
      clone.set({
        id: uid(),
        name: this.nextName((sources[i].name ?? 'Katman').replace(/\s+\d+$/, '')),
        left: clone.left + offset,
        top: clone.top + offset,
        locked: false,
      })
      this.hydrate(clone)
      clone.setCoords()
      this.canvas.add(clone)
    }
    this.silent--
    this.selectObjects(clones)
    this.emit('layers')
    this.emit('selection', this.getSelection())
    this.history.commit()
  }

  async paste() {
    if (!this.clipboard.length) return false
    this.pasteCount++
    await this.insertClones(this.clipboard, this.pasteCount * 28 * this.contentScale)
    return true
  }

  async duplicate() {
    const targets = this.getSelection()
    if (!targets.length) return
    const sources = await Promise.all(targets.map((o) => this.cloneAbsolute(o)))
    await this.insertClones(sources, 28 * this.contentScale)
  }

  nudge(dx: number, dy: number) {
    const active = this.getActive()
    if (!active || active.locked) return
    active.set({ left: active.left + dx, top: active.top + dy })
    active.setCoords()
    this.afterChange()
  }

  /** Seçimi tuvalin kenarlarına veya merkezine hizalar. */
  align(mode: AlignMode) {
    const active = this.getActive()
    if (!active) return
    const box = active.getBoundingRect()
    const { width, height } = this.doc
    let dx = 0
    let dy = 0
    if (mode === 'left') dx = -box.left
    else if (mode === 'centerH') dx = width / 2 - (box.left + box.width / 2)
    else if (mode === 'right') dx = width - (box.left + box.width)
    else if (mode === 'top') dy = -box.top
    else if (mode === 'centerV') dy = height / 2 - (box.top + box.height / 2)
    else if (mode === 'bottom') dy = height - (box.top + box.height)
    active.set({ left: active.left + dx, top: active.top + dy })
    active.setCoords()
    this.afterChange('now')
  }

  flip(axis: 'x' | 'y') {
    const active = this.getActive()
    if (!active) return
    const key = axis === 'x' ? 'flipX' : 'flipY'
    active.set(key, !active[key])
    this.afterChange('now')
  }

  /* ------------------------------------------------------------------------ */
  /*  Metin                                                                    */
  /* ------------------------------------------------------------------------ */

  /**
   * Bir metnin ölçüleri panelden değiştirildiğinde (içerik, punto, yazı tipi…)
   * hizalamaya göre sabit kalması gereken kenarı (sol/sağ/orta ve üst) yerinde
   * tutar. `prev`, değişiklikten önceki genişlik ve yüksekliktir.
   */
  private anchorTextAfterResize(text: StudioText, prev: { w: number; h: number }) {
    if (text.curve) return
    const dw = text.width - prev.w
    const dh = text.height - prev.h
    if (!dw && !dh) return
    const align = text.textAlign
    const lx = align === 'center' || align === 'justify-center' ? 0 : align.includes('right') ? -dw / 2 : dw / 2
    const delta = new Point(lx, dh / 2).transform(text.calcOwnMatrix(), true)
    text.set({ left: text.left + delta.x, top: text.top + delta.y })
    text.setCoords()
  }

  /** Seçili metinlerin özelliklerini değiştirir; gerekirse yazı tipini yükler. */
  async setTextProps(props: Record<string, unknown>, commit: 'now' | 'debounce' = 'debounce') {
    const texts = this.getSelection().filter(isText)
    if (!texts.length) return
    const next = { ...props }

    if ('fontFamily' in next || 'fontWeight' in next || 'fontStyle' in next) {
      await Promise.all(
        texts.map((t) => {
          const family = String(next.fontFamily ?? t.fontFamily)
          let weight = Number(next.fontWeight ?? t.fontWeight) || 400
          if ('fontFamily' in next) weight = nearestWeight(FONT_MAP.get(family), weight)
          return ensureFont(family, {
            weight,
            italic: (next.fontStyle ?? t.fontStyle) === 'italic',
            text: String(next.text ?? t.text),
          })
        }),
      )
    }

    for (const text of texts) {
      const own = { ...next }
      if ('fontFamily' in own && !('fontWeight' in own)) {
        own.fontWeight = nearestWeight(
          FONT_MAP.get(String(own.fontFamily)),
          Number(text.fontWeight) || 400,
        )
      }
      const prev = { w: text.width, h: text.height }
      text.set(own)
      if (text.curve || 'curve' in own) updateTextCurve(text)
      // Kavisli metin tuval üzerinde düzenlenemez (panelden düzenlenir)
      text.editable = !text.curve && !text.locked
      this.anchorTextAfterResize(text, prev)
      text.setCoords()
    }
    this.afterChange(commit)
  }

  /** Köşeden ölçeklenen metnin ölçeğini puntoya işler (scale → fontSize). */
  private bakeTextScale(obj: FabricObject) {
    if (!isText(obj) || obj.group) return
    const { scaleX, scaleY } = obj
    if (Math.abs(scaleX - 1) < 1e-3 && Math.abs(scaleY - 1) < 1e-3) return
    if (Math.abs(scaleX - scaleY) > 1e-3) return // orantısız: olduğu gibi bırak
    const s = scaleY
    const center = obj.getCenterPoint()
    const shadow = obj.shadow
    obj.set({
      fontSize: Math.max(4, Math.round(obj.fontSize * s * 10) / 10),
      strokeWidth: (obj.strokeWidth || 0) * s,
      boxPadding: (obj.boxPadding || 0) * s,
      boxRadius: (obj.boxRadius || 0) * s,
      scaleX: 1,
      scaleY: 1,
    })
    if (shadow) {
      obj.set(
        'shadow',
        new Shadow({
          color: shadow.color,
          blur: shadow.blur * s,
          offsetX: shadow.offsetX * s,
          offsetY: shadow.offsetY * s,
        }),
      )
    }
    if (obj.curve) updateTextCurve(obj)
    obj.setPositionByOrigin(center, 'center', 'center')
    obj.setCoords()
  }

  /* ------------------------------------------------------------------------ */
  /*  Görseller                                                                */
  /* ------------------------------------------------------------------------ */

  /** Filtre kaydırıcıları: değer hemen saklanır, filtreler kare başına bir kez uygulanır. */
  setFx(image: FabricImage, patch: Partial<ImageFx>, commit: 'now' | 'debounce' = 'debounce') {
    image.fx = { ...getFx(image), ...patch }
    this.pendingFx.add(image)
    if (!this.fxFrame) {
      this.fxFrame = requestAnimationFrame(() => {
        this.fxFrame = 0
        for (const img of this.pendingFx) {
          img.filters = buildFilters(getFx(img))
          img.applyFilters()
        }
        this.pendingFx.clear()
        this.canvas.requestRenderAll()
      })
    }
    this.emit('change')
    if (commit === 'now') this.history.commit()
    else this.history.scheduleCommit()
  }

  cropImage(image: FabricImage, rect: CropRect) {
    applyCrop(image, rect)
    this.afterChange('now')
  }

  fitImage(image: FabricImage, mode: 'cover' | 'contain') {
    fitImageToDoc(image, this.doc, mode)
    this.afterChange('now')
  }

  /** Görseli tuvali kaplayan, en alttaki kilitli katman yapar. */
  setAsBackground(image: FabricImage) {
    fitImageToDoc(image, this.doc, 'cover')
    this.canvas.sendObjectToBack(image)
    this.emit('layers')
    this.afterChange('now')
  }

  /** Görselin piksel kaynağını yeni bir blob ile değiştirir (AI araçları). */
  async replaceImage(image: FabricImage, blob: Blob, factor = 1) {
    await replaceImageSource(image, URL.createObjectURL(blob), factor)
    if (image.fx) applyFx(image, getFx(image))
    this.afterChange('now')
  }

  /* ------------------------------------------------------------------------ */
  /*  Katmanlar                                                                */
  /* ------------------------------------------------------------------------ */

  /** Katman listesi (en üstteki ilk sırada). */
  getLayers(): LayerInfo[] {
    return this.canvas
      .getObjects()
      .map((obj) => ({
        id: obj.id ?? '',
        name: obj.name ?? 'Katman',
        kind: obj.kind ?? 'shape',
        visible: obj.visible,
        locked: !!obj.locked,
      }))
      .reverse()
  }

  findById(id: string) {
    return this.canvas.getObjects().find((o) => o.id === id)
  }

  selectLayer(id: string, additive = false) {
    const obj = this.findById(id)
    if (!obj || !obj.visible) return
    if (additive && !obj.locked) {
      const current = this.getSelection().filter((o) => !o.locked)
      const next = current.includes(obj) ? current.filter((o) => o !== obj) : [...current, obj]
      this.selectObjects(next)
    } else {
      this.selectObjects([obj])
    }
  }

  private applyLock(obj: FabricObject, locked: boolean) {
    obj.locked = locked
    obj.set({
      selectable: !locked,
      evented: !locked,
      hasControls: !locked,
      ...Object.fromEntries(LOCK_FLAGS.map((flag) => [flag, locked])),
    })
    if (isText(obj)) obj.editable = !locked && !obj.curve
  }

  setLayerLocked(id: string, locked: boolean) {
    const obj = this.findById(id)
    if (!obj) return
    if (locked && this.getSelection().length > 1 && this.getSelection().includes(obj)) {
      this.canvas.discardActiveObject()
    }
    if (isText(obj) && obj.isEditing) obj.exitEditing()
    this.applyLock(obj, locked)
    this.emit('layers')
    this.afterChange('now')
  }

  setLayerVisible(id: string, visible: boolean) {
    const obj = this.findById(id)
    if (!obj) return
    if (!visible && this.getSelection().includes(obj)) this.canvas.discardActiveObject()
    obj.set('visible', visible)
    this.emit('layers')
    this.afterChange('now')
  }

  renameLayer(id: string, name: string) {
    const obj = this.findById(id)
    const trimmed = name.trim()
    if (!obj || !trimmed || trimmed === obj.name) return
    obj.name = trimmed
    this.emit('layers')
    this.afterChange('now')
  }

  removeLayer(id: string) {
    const obj = this.findById(id)
    if (!obj) return
    if (this.getSelection().includes(obj)) this.canvas.discardActiveObject()
    this.canvas.remove(obj)
    this.afterChange('now')
  }

  /**
   * Katmanı, listede (üstten alta) verilen sıraya taşır.
   * Liste tuval yığınının tersidir.
   */
  moveLayer(id: string, listIndex: number) {
    const obj = this.findById(id)
    if (!obj) return
    const count = this.canvas.getObjects().length
    this.canvas.moveObjectTo(obj, clamp(count - 1 - listIndex, 0, count - 1))
    this.emit('layers')
    this.afterChange('now')
  }

  /** Seçili nesnelerin katman sırasını değiştirir. */
  arrange(action: 'front' | 'forward' | 'backward' | 'back') {
    const stack = this.canvas.getObjects()
    const targets = this.getSelection()
    if (!targets.length) return
    // Çoklu seçimde göreli sırayı korumak için işlem yönüne göre sırala
    const ordered = [...targets].sort((a, b) => stack.indexOf(a) - stack.indexOf(b))
    if (action === 'front') ordered.forEach((o) => this.canvas.bringObjectToFront(o))
    else if (action === 'back') ordered.reverse().forEach((o) => this.canvas.sendObjectToBack(o))
    else if (action === 'forward') {
      ordered.reverse().forEach((o) => this.canvas.bringObjectForward(o))
    } else ordered.forEach((o) => this.canvas.sendObjectBackwards(o))
    this.emit('layers')
    this.afterChange('now')
  }

  /* ------------------------------------------------------------------------ */
  /*  Hizalama kılavuzları                                                     */
  /* ------------------------------------------------------------------------ */

  /** Sürüklenen nesnenin yapışabileceği hedefler: diğer nesneler + tuvalin kendisi. */
  private snapTargets(target: FabricObject) {
    const moving = new Set(target instanceof ActiveSelection ? target.getObjects() : [target])
    const set = new Set<FabricObject>()
    for (const obj of this.canvas.getObjects()) {
      if (!obj.visible || moving.has(obj) || !obj.isOnScreen()) continue
      set.add(obj)
    }
    set.add(this.artboardProxy)
    return set
  }

  /* ------------------------------------------------------------------------ */
  /*  Serileştirme, geçmiş ve proje                                            */
  /* ------------------------------------------------------------------------ */

  serialize(): Snapshot {
    const json = this.canvas.toObject() as Snapshot['canvas']
    // Arka plan ve kırpma maskesi editör durumundan yeniden üretilir
    delete json.background
    delete json.clipPath
    return {
      doc: { ...this.doc },
      background: structuredClone(this.background),
      canvas: json,
    }
  }

  /** Bir anlık görüntüyü tuvale yükler (geçmiş kaydı oluşturmaz). */
  private async restore(snapshot: Snapshot) {
    const selectedIds = new Set(this.getSelection().map((o) => o.id))
    this.silent++
    try {
      this.doc = { ...snapshot.doc }
      this.background = structuredClone(snapshot.background)
      await this.canvas.loadFromJSON(snapshot.canvas)
      for (const obj of this.canvas.getObjects()) this.hydrate(obj)
      this.syncArtboard()
      this.applyBackground()
      const reselect = this.canvas
        .getObjects()
        .filter((o) => selectedIds.has(o.id) && o.visible && !o.locked)
      if (reselect.length) this.selectObjects(reselect)
    } finally {
      this.silent--
    }
    if (this.autoFit) this.fit()
    this.canvas.requestRenderAll()
    this.emit('doc')
    this.emit('layers')
    this.emit('selection', this.getSelection())
    this.emit('change')
  }

  undo() {
    return this.history.undo()
  }

  redo() {
    return this.history.redo()
  }

  /** Bir proje anlık görüntüsünü yükler ve geçmişi sıfırlar. */
  async load(snapshot: Snapshot) {
    this.canvas.discardActiveObject()
    this.history.restoring = true
    try {
      await this.restore(snapshot)
      // Yazı tipleri yüklendikten sonra ölçüler/kavis yolları kesinleşsin
      for (const obj of this.canvas.getObjects()) if (isText(obj)) refreshText(obj)
    } finally {
      this.history.restoring = false
    }
    this.fit()
    this.history.reset()
  }

  /** Boş bir tuvalle yeni proje başlatır. */
  async reset(doc: DocSize = this.doc) {
    await this.load({
      doc: { ...doc },
      background: { ...DEFAULT_BACKGROUND },
      canvas: { objects: [] },
    })
  }
}
