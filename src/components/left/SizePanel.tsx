import { Link2, Unlink2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { MAX_DOC_SIDE, MIN_DOC_SIDE, SIZE_PRESETS } from '../../editor/constants'
import { useEditor } from '../../editor/EditorContext'
import { formatAspectRatio, parseAspectRatio } from '../../editor/utils'
import { useEditorStore } from '../../store/editorStore'
import { Button, IconButton } from '../ui/Button'
import { cn } from '../ui/cn'
import { NumberField } from '../ui/NumberField'

/** Hazır boyut şablonları ve özel boyut / en-boy oranı girişi. */
export function SizePanel() {
  const editor = useEditor()
  const doc = useEditorStore((s) => s.doc)
  const [width, setWidth] = useState(doc.width)
  const [height, setHeight] = useState(doc.height)
  const [locked, setLocked] = useState(false)
  const [ratioText, setRatioText] = useState('')
  const [ratioError, setRatioError] = useState(false)

  // Tuval başka bir yerden değişirse (şablon, geri al) alanları eşitle
  const [syncedDoc, setSyncedDoc] = useState(doc)
  if (syncedDoc !== doc) {
    setSyncedDoc(doc)
    setWidth(doc.width)
    setHeight(doc.height)
  }

  const groups = useMemo(() => {
    const map = new Map<string, typeof SIZE_PRESETS>()
    for (const preset of SIZE_PRESETS) {
      map.set(preset.group, [...(map.get(preset.group) ?? []), preset])
    }
    return [...map.entries()]
  }, [])

  const changeWidth = (value: number) => {
    setWidth(value)
    if (locked) setHeight(Math.max(MIN_DOC_SIDE, Math.round(value / (width / height))))
  }
  const changeHeight = (value: number) => {
    setHeight(value)
    if (locked) setWidth(Math.max(MIN_DOC_SIDE, Math.round(value * (width / height))))
  }

  const applyRatio = () => {
    const ratio = parseAspectRatio(ratioText)
    if (!ratio) {
      setRatioError(true)
      return
    }
    setRatioError(false)
    // Genişliği koru, yüksekliği orana göre hesapla (sınırı aşarsa genişliği küçült)
    let w = width
    let h = Math.round(w / ratio)
    if (h > MAX_DOC_SIDE) {
      h = MAX_DOC_SIDE
      w = Math.round(h * ratio)
    }
    h = Math.max(MIN_DOC_SIDE, h)
    setWidth(w)
    setHeight(h)
    editor.setDocSize(w, h)
  }

  const dirty = width !== doc.width || height !== doc.height

  return (
    <div className="flex flex-col">
      <section className="border-b border-line p-3.5">
        <h3 className="mb-2.5 text-[11px] font-semibold tracking-wider text-muted uppercase">Özel boyut</h3>
        <div className="flex items-center gap-1.5">
          <NumberField
            label="Genişlik"
            prefix="G"
            suffix="px"
            value={width}
            min={MIN_DOC_SIDE}
            max={MAX_DOC_SIDE}
            onChange={changeWidth}
            className="flex-1"
          />
          <IconButton
            size="sm"
            label={locked ? 'Oranı serbest bırak' : 'En-boy oranını kilitle'}
            active={locked}
            onClick={() => setLocked((v) => !v)}
          >
            {locked ? <Link2 size={14} /> : <Unlink2 size={14} />}
          </IconButton>
          <NumberField
            label="Yükseklik"
            prefix="Y"
            suffix="px"
            value={height}
            min={MIN_DOC_SIDE}
            max={MAX_DOC_SIDE}
            onChange={changeHeight}
            className="flex-1"
          />
        </div>
        <Button
          block
          variant={dirty ? 'primary' : 'secondary'}
          disabled={!dirty}
          className="mt-2"
          onClick={() => editor.setDocSize(width, height)}
        >
          Boyutu uygula
        </Button>

        <h3 className="mt-4 mb-2 text-[11px] font-semibold tracking-wider text-muted uppercase">En-boy oranı</h3>
        <form
          className="flex gap-1.5"
          onSubmit={(e) => {
            e.preventDefault()
            applyRatio()
          }}
        >
          <input
            value={ratioText}
            onChange={(e) => {
              setRatioText(e.target.value)
              setRatioError(false)
            }}
            placeholder={`ör. 16:9 (şu an ${formatAspectRatio(doc.width, doc.height)})`}
            aria-label="En-boy oranı"
            aria-invalid={ratioError}
            className={cn(
              'h-8.5 min-w-0 flex-1 rounded-lg border bg-raised px-2.5 text-xs outline-none placeholder:text-faint focus:border-accent',
              ratioError ? 'border-danger' : 'border-line',
            )}
          />
          <Button type="submit" disabled={!ratioText.trim()}>
            Uygula
          </Button>
        </form>
        <div className="mt-2 flex flex-wrap gap-1">
          {['1:1', '4:5', '16:9', '9:16', '3:1', '1.91:1'].map((ratio) => (
            <button
              key={ratio}
              type="button"
              onClick={() => {
                setRatioText(ratio)
                setRatioError(false)
              }}
              className="rounded-full bg-raised px-2 py-0.5 text-[11px] text-muted hover:bg-hover hover:text-ink"
            >
              {ratio}
            </button>
          ))}
        </div>
        {ratioError ? (
          <p className="mt-1.5 text-[11px] text-danger">Oranı 16:9 veya 1.91 biçiminde girin.</p>
        ) : (
          <p className="mt-1.5 text-[11px] text-faint">Genişlik korunur, yükseklik orana göre hesaplanır.</p>
        )}
      </section>

      {groups.map(([group, presets]) => (
        <section key={group} className="border-b border-line p-3.5 last:border-b-0">
          <h3 className="mb-2 text-[11px] font-semibold tracking-wider text-muted uppercase">{group}</h3>
          <div className="flex flex-col gap-1">
            {presets.map((preset) => {
              const selected = preset.width === doc.width && preset.height === doc.height
              const scale = 26 / Math.max(preset.width, preset.height)
              return (
                <button
                  key={preset.id}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => editor.setDocSize(preset.width, preset.height)}
                  className={cn(
                    'flex h-11 items-center gap-3 rounded-lg border px-2.5 text-left transition-colors',
                    selected
                      ? 'border-accent bg-accent-soft'
                      : 'border-transparent hover:bg-hover',
                  )}
                >
                  <span className="flex size-7 shrink-0 items-center justify-center">
                    <span
                      style={{ width: preset.width * scale, height: preset.height * scale }}
                      className={cn(
                        'rounded-[3px] border-[1.5px]',
                        selected ? 'border-accent bg-accent/25' : 'border-faint',
                      )}
                    />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13px] text-ink">{preset.label}</span>
                    <span className="block text-[11px] text-faint tabular-nums">
                      {preset.width} × {preset.height} px
                    </span>
                  </span>
                </button>
              )
            })}
          </div>
        </section>
      ))}
    </div>
  )
}
