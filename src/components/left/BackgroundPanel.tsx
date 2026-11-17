import { COLOR_SWATCHES, GRADIENT_PRESETS } from '../../editor/constants'
import { useEditor } from '../../editor/EditorContext'
import type { BackgroundSpec, GradientStop } from '../../editor/types'
import { useEditorStore } from '../../store/editorStore'
import { cn } from '../ui/cn'
import { ColorField } from '../ui/ColorField'
import { Segmented } from '../ui/Segmented'
import { Slider } from '../ui/Slider'

const gradientCss = (angle: number, stops: GradientStop[]) =>
  `linear-gradient(${angle}deg, ${stops.map((s) => `${s.color} ${Math.round(s.offset * 100)}%`).join(', ')})`

const EXTRA_SOLIDS = ['#f8fafc', '#fde68a', '#bbf7d0', '#bae6fd', '#ddd6fe', '#fecdd3', '#111827', '#312e81', '#064e3b', '#7f1d1d', '#431407', '#0f172a']

/** Tuval arka planı: düz renk, gradyan veya saydam. */
export function BackgroundPanel() {
  const editor = useEditor()
  const background = useEditorStore((s) => s.background)

  const setType = (type: BackgroundSpec['type']) => {
    if (type === background.type) return
    if (type === 'solid') editor.setBackground({ type: 'solid', color: '#ffffff' }, 'now')
    else if (type === 'gradient') editor.setBackground({ type: 'gradient', ...GRADIENT_PRESETS[0] }, 'now')
    else editor.setBackground({ type: 'transparent' }, 'now')
  }

  return (
    <div className="flex flex-col gap-4 p-3.5">
      <Segmented
        value={background.type}
        onChange={setType}
        options={[
          { value: 'solid', label: 'Düz renk' },
          { value: 'gradient', label: 'Gradyan' },
          { value: 'transparent', label: 'Saydam' },
        ]}
      />

      {background.type === 'solid' && (
        <>
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted">Renk</span>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs text-faint uppercase">{background.color}</span>
              <ColorField
                label="Arka plan rengi"
                value={background.color}
                onChange={(color) => editor.setBackground({ type: 'solid', color })}
              />
            </div>
          </div>
          <div className="grid grid-cols-6 gap-1.5">
            {[...COLOR_SWATCHES, ...EXTRA_SOLIDS].map((color) => (
              <button
                key={color}
                type="button"
                title={color}
                aria-label={`Arka plan ${color}`}
                onClick={() => editor.setBackground({ type: 'solid', color }, 'now')}
                style={{ background: color }}
                className={cn(
                  'aspect-square rounded-lg border border-white/10 transition-transform hover:scale-105',
                  background.color.toLowerCase() === color && 'ring-2 ring-accent ring-offset-2 ring-offset-panel',
                )}
              />
            ))}
          </div>
        </>
      )}

      {background.type === 'gradient' && (
        <>
          <div className="grid grid-cols-2 gap-1.5">
            {GRADIENT_PRESETS.map((preset) => {
              const selected =
                JSON.stringify(preset.stops) === JSON.stringify(background.stops) &&
                preset.angle === background.angle
              return (
                <button
                  key={preset.name}
                  type="button"
                  title={preset.name}
                  onClick={() => editor.setBackground({ type: 'gradient', angle: preset.angle, stops: preset.stops }, 'now')}
                  style={{ background: gradientCss(preset.angle, preset.stops) }}
                  className={cn(
                    'flex h-14 items-end rounded-lg border border-white/10 p-1.5 text-left transition-transform hover:scale-[1.03]',
                    selected && 'ring-2 ring-accent ring-offset-2 ring-offset-panel',
                  )}
                >
                  <span className="rounded bg-black/45 px-1.5 py-0.5 text-[10px] font-medium text-white backdrop-blur-sm">
                    {preset.name}
                  </span>
                </button>
              )
            })}
          </div>

          <div
            className="h-9 rounded-lg border border-white/10"
            style={{ background: gradientCss(90, background.stops) }}
            aria-hidden="true"
          />
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted">Renk durakları</span>
            <div className="flex items-center gap-1.5">
              {background.stops.map((stop, index) => (
                <ColorField
                  key={index}
                  label={`${index + 1}. renk`}
                  value={stop.color}
                  onChange={(color) =>
                    editor.setBackground({
                      ...background,
                      stops: background.stops.map((s, i) => (i === index ? { ...s, color } : s)),
                    })
                  }
                />
              ))}
            </div>
          </div>
          <Slider
            label="Açı"
            suffix="°"
            min={0}
            max={360}
            value={background.angle}
            onChange={(angle) => editor.setBackground({ ...background, angle })}
          />
        </>
      )}

      {background.type === 'transparent' && (
        <div className="rounded-xl border border-line bg-raised p-3">
          <div className="checker h-16 rounded-lg" />
          <p className="mt-2.5 text-[11px] leading-relaxed text-muted">
            Arka plan saydam. PNG olarak dışa aktardığınızda zemin boş kalır; JPEG saydamlığı desteklemediği için
            beyaz zemin kullanılır.
          </p>
        </div>
      )}

      <p className="text-[11px] leading-relaxed text-faint">
        Bir fotoğrafı arka plan yapmak için görseli seçip sağ panelden <b className="text-muted">Arka plan yap</b>{' '}
        düğmesini kullanın.
      </p>
    </div>
  )
}
