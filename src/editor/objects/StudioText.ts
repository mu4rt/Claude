import { IText, classRegistry, type ITextProps, type TOptions } from 'fabric'

export interface StudioTextOwnProps {
  /** Kavis açısı (derece). 0 = düz, + = yukarı kemer, − = aşağı kemer */
  curve: number
  /** "Kutu" arka planının metinden taşma payı (px) */
  boxPadding: number
  /** "Kutu" arka planının köşe yarıçapı (px) */
  boxRadius: number
}

/**
 * Düzenlenebilir metin nesnesi. Fabric'in IText sınıfına iki şey ekler:
 *  - dolgulu ve yuvarlak köşeli arka plan kutusu (`backgroundColor`),
 *  - kavisli metin için kullanılan `curve` değeri (yolun kendisi text.ts'te üretilir).
 */
export class StudioText extends IText {
  static type = 'StudioText'

  static customProperties = ['curve', 'boxPadding', 'boxRadius']

  declare curve: number
  declare boxPadding: number
  declare boxRadius: number

  constructor(text: string, options: TOptions<ITextProps> & Partial<StudioTextOwnProps> = {}) {
    super(text, { curve: 0, boxPadding: 0, boxRadius: 0, ...options } as TOptions<ITextProps>)
  }

  /** Kutunun önbellek tuvalinde kırpılmaması için dolgu kadar yer açar. */
  _getCacheCanvasDimensions() {
    const dims = super._getCacheCanvasDimensions()
    const pad = Math.max(0, this.boxPadding || 0) * 2
    dims.width += pad * dims.zoomX
    dims.height += pad * dims.zoomY
    return dims
  }

  _renderBackground(ctx: CanvasRenderingContext2D) {
    if (!this.backgroundColor) return
    const dim = this._getNonTransformedDimensions()
    const pad = Math.max(0, this.boxPadding || 0)
    const width = dim.x + pad * 2
    const height = dim.y + pad * 2
    const radius = Math.min(Math.max(0, this.boxRadius || 0), width / 2, height / 2)
    ctx.fillStyle = this.backgroundColor
    ctx.beginPath()
    ctx.roundRect(-width / 2, -height / 2, width, height, radius)
    ctx.fill()
    // Arka plan varken gölgeyi yalnızca kutu düşürür (Fabric davranışı)
    this._removeShadow(ctx)
  }
}

classRegistry.setClass(StudioText)
