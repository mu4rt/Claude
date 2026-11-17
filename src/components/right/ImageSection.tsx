import type { FabricImage } from 'fabric'
import { Crop, Eraser, Expand, ImageUpscale, RotateCcw, Shrink, Sparkles, Wallpaper } from 'lucide-react'
import { runBackgroundRemoval, runEnhance, runUpscale } from '../../actions'
import { DEFAULT_FX } from '../../editor/constants'
import { useEditor } from '../../editor/EditorContext'
import { getFx, isDefaultFx } from '../../editor/filters'
import type { ImageFx } from '../../editor/types'
import { useEditorStore } from '../../store/editorStore'
import { Button } from '../ui/Button'
import { cn } from '../ui/cn'
import { Section } from '../ui/Section'
import { Segmented } from '../ui/Segmented'
import { Slider } from '../ui/Slider'

type NumericFx = 'brightness' | 'contrast' | 'saturation' | 'vibrance' | 'hue' | 'blur' | 'sharpen'

const ADJUSTMENTS: { key: NumericFx; label: string; min: number; max: number; suffix?: string }[] = [
  { key: 'brightness', label: 'Parlaklık', min: -100, max: 100 },
  { key: 'contrast', label: 'Kontrast', min: -100, max: 100 },
  { key: 'saturation', label: 'Doygunluk', min: -100, max: 100 },
  { key: 'vibrance', label: 'Canlılık', min: -100, max: 100 },
  { key: 'hue', label: 'Ton', min: -180, max: 180, suffix: '°' },
]

const TOGGLES: { key: 'grayscale' | 'sepia' | 'invert'; label: string }[] = [
  { key: 'grayscale', label: 'Siyah-Beyaz' },
  { key: 'sepia', label: 'Sepya' },
  { key: 'invert', label: 'Negatif' },
]

/** Görsel nesnesinin yapay zekâ araçları, kırpma ve filtre ayarları. */
export function ImageSection({ image }: { image: FabricImage }) {
  const editor = useEditor()
  const busy = useEditorStore((s) => !!s.busy)
  const openCrop = useEditorStore((s) => s.openCrop)
  const fx = getFx(image)
  const setFx = (patch: Partial<ImageFx>, commit?: 'now' | 'debounce') => editor.setFx(image, patch, commit)
  const source = image.getOriginalSize()
  const cropped = image.width < source.width || image.height < source.height

  return (
    <>
      <Section title="Akıllı araçlar">
        <Button
          variant="primary"
          block
          icon={<Eraser size={15} />}
          disabled={busy}
          onClick={() => void runBackgroundRemoval(editor, image)}
        >
          Arka planı sil
        </Button>
        <div className="grid grid-cols-2 gap-1.5">
          <Button icon={<Sparkles size={14} />} disabled={busy} onClick={() => runEnhance(editor, image)}>
            Netleştir
          </Button>
          <Button icon={<ImageUpscale size={14} />} disabled={busy} onClick={() => void runUpscale(editor, image)}>
            2× Büyüt
          </Button>
        </div>
        <p className="text-[11px] leading-relaxed text-faint">
          Arka plan silme tarayıcınızda çalışır; görseliniz bir sunucuya gönderilmez. Model ilk kullanımda bir kez
          indirilir.
        </p>
      </Section>

      <Section title="Kırpma ve yerleşim">
        <div className="grid grid-cols-2 gap-1.5">
          <Button icon={<Crop size={14} />} onClick={() => openCrop(image)}>
            Kırp
          </Button>
          <Button
            icon={<RotateCcw size={14} />}
            disabled={!cropped}
            title="Kırpmayı sıfırla"
            onClick={() => editor.cropImage(image, { x: 0, y: 0, width: source.width, height: source.height })}
          >
            Sıfırla
          </Button>
          <Button icon={<Expand size={14} />} onClick={() => editor.fitImage(image, 'cover')}>
            Tuvali kapla
          </Button>
          <Button icon={<Shrink size={14} />} onClick={() => editor.fitImage(image, 'contain')}>
            Tuvale sığdır
          </Button>
        </div>
        <Button block icon={<Wallpaper size={14} />} onClick={() => editor.setAsBackground(image)}>
          Arka plan yap
        </Button>
        <p className="text-[11px] text-faint tabular-nums">
          Kaynak: {source.width} × {source.height} px{cropped && ` · Kırpılmış: ${image.width} × ${image.height} px`}
        </p>
      </Section>

      <Section
        title="Ayarlar"
        action={
          !isDefaultFx(fx) && (
            <button
              type="button"
              onClick={() => setFx({ ...DEFAULT_FX }, 'now')}
              className="flex items-center gap-1 text-[11px] text-muted hover:text-accent"
            >
              <RotateCcw size={11} /> Sıfırla
            </button>
          )
        }
      >
        {ADJUSTMENTS.map(({ key, label, min, max, suffix }) => (
          <Slider
            key={key}
            label={label}
            min={min}
            max={max}
            suffix={suffix}
            bipolar
            defaultValue={0}
            value={fx[key]}
            onChange={(value) => setFx({ [key]: value })}
          />
        ))}
        <Slider label="Bulanıklık" min={0} max={100} defaultValue={0} value={fx.blur} onChange={(blur) => setFx({ blur })} />
        <div className="flex gap-1.5">
          {TOGGLES.map(({ key, label }) => (
            <button
              key={key}
              type="button"
              aria-pressed={fx[key]}
              onClick={() => setFx({ [key]: !fx[key] }, 'now')}
              className={cn(
                'h-7.5 flex-1 rounded-md border text-[11px] font-medium transition-colors',
                fx[key]
                  ? 'border-accent bg-accent-soft text-accent'
                  : 'border-line bg-raised text-muted hover:text-ink',
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </Section>

      <Section title="Netlik (Unsharp Mask)">
        <Slider label="Miktar" min={0} max={100} defaultValue={0} value={fx.sharpen} onChange={(sharpen) => setFx({ sharpen })} />
        <div className="flex items-center justify-between gap-3">
          <span className="text-xs text-muted">Yarıçap</span>
          <Segmented
            className="w-40"
            value={String(fx.sharpenRadius) as '1' | '2' | '3'}
            onChange={(value) => setFx({ sharpenRadius: Number(value) as 1 | 2 | 3 }, 'now')}
            options={[
              { value: '1', label: 'İnce' },
              { value: '2', label: 'Orta' },
              { value: '3', label: 'Geniş' },
            ]}
          />
        </div>
        <p className="text-[11px] leading-relaxed text-faint">
          Bulanık fotoğraflarda kenar kontrastını artırır. Daha belirgin sonuç için kontrastı da hafifçe yükseltin.
        </p>
      </Section>
    </>
  )
}
