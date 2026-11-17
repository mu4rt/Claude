import {
  Bold,
  Italic,
  Strikethrough,
  TextAlignCenter,
  TextAlignEnd,
  TextAlignJustify,
  TextAlignStart,
  Underline,
} from 'lucide-react'
import { useEditor } from '../../editor/EditorContext'
import { FONT_MAP, nearestWeight } from '../../editor/fontCatalog'
import type { StudioText } from '../../editor/objects/StudioText'
import { MAX_CURVE } from '../../editor/text'
import { IconButton } from '../ui/Button'
import { toHex } from '../ui/color'
import { ColorField } from '../ui/ColorField'
import { FontPicker } from '../ui/FontPicker'
import { Row, Section } from '../ui/Section'
import { Segmented } from '../ui/Segmented'
import { Slider } from '../ui/Slider'

const WEIGHT_NAMES: Record<number, string> = {
  100: 'Çok ince',
  200: 'Ekstra ince',
  300: 'İnce',
  400: 'Normal',
  500: 'Orta',
  600: 'Yarı kalın',
  700: 'Kalın',
  800: 'Ekstra kalın',
  900: 'Siyah',
}

const numericWeight = (weight: string | number) =>
  typeof weight === 'number' ? weight : weight === 'bold' ? 700 : Number(weight) || 400

type Align = 'left' | 'center' | 'right' | 'justify'

/** Metin nesnesinin tipografi, renk, dış hat, arka plan ve kavis ayarları. */
export function TextSection({ text }: { text: StudioText }) {
  const editor = useEditor()
  const set = (props: Record<string, unknown>, commit?: 'now' | 'debounce') =>
    void editor.setTextProps(props, commit)

  const font = FONT_MAP.get(text.fontFamily)
  const weight = numericWeight(text.fontWeight)
  const weights = font?.weights ?? [400, 700]
  const isBold = weight >= 600
  const hasStroke = !!text.stroke && (text.strokeWidth || 0) > 0
  const curved = !!text.curve
  const maxStroke = Math.max(20, Math.round(text.fontSize * 0.3))

  return (
    <>
      <Section title="Metin">
        <textarea
          value={text.text}
          rows={curved ? 1 : Math.min(5, Math.max(2, text.text.split('\n').length))}
          aria-label="Metin içeriği"
          spellCheck={false}
          onChange={(e) => set({ text: curved ? e.target.value.replace(/\n/g, ' ') : e.target.value })}
          className="w-full resize-none rounded-lg border border-line bg-raised px-2.5 py-2 text-[13px] leading-snug outline-none focus:border-accent"
        />
        <FontPicker value={text.fontFamily} onChange={(fontFamily) => set({ fontFamily }, 'now')} />
        <select
          aria-label="Kalınlık"
          value={weight}
          onChange={(e) => set({ fontWeight: Number(e.target.value) }, 'now')}
          className="h-8.5 w-full rounded-lg border border-line bg-raised px-2 text-[13px] outline-none focus:border-accent"
        >
          {weights.map((w) => (
            <option key={w} value={w}>
              {WEIGHT_NAMES[w] ?? w}
            </option>
          ))}
        </select>
        <Slider label="Punto" min={8} max={400} value={Math.round(text.fontSize)} onChange={(fontSize) => set({ fontSize })} suffix="px" />

        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-0.5 rounded-lg border border-line bg-raised p-0.5">
            <IconButton
              size="sm"
              label="Kalın"
              active={isBold}
              onClick={() => set({ fontWeight: nearestWeight(font, isBold ? 400 : 700) }, 'now')}
            >
              <Bold size={14} />
            </IconButton>
            <IconButton
              size="sm"
              label="İtalik"
              active={text.fontStyle === 'italic'}
              onClick={() => set({ fontStyle: text.fontStyle === 'italic' ? 'normal' : 'italic' }, 'now')}
            >
              <Italic size={14} />
            </IconButton>
            <IconButton size="sm" label="Altı çizili" active={text.underline} onClick={() => set({ underline: !text.underline }, 'now')}>
              <Underline size={14} />
            </IconButton>
            <IconButton size="sm" label="Üstü çizili" active={text.linethrough} onClick={() => set({ linethrough: !text.linethrough }, 'now')}>
              <Strikethrough size={14} />
            </IconButton>
          </div>
          <Segmented<Align>
            iconOnly
            value={(text.textAlign.startsWith('justify') ? 'justify' : text.textAlign) as Align}
            onChange={(textAlign) => set({ textAlign }, 'now')}
            options={[
              { value: 'left', label: 'Sola hizala', icon: <TextAlignStart size={14} /> },
              { value: 'center', label: 'Ortala', icon: <TextAlignCenter size={14} /> },
              { value: 'right', label: 'Sağa hizala', icon: <TextAlignEnd size={14} /> },
              { value: 'justify', label: 'İki yana yasla', icon: <TextAlignJustify size={14} /> },
            ]}
          />
        </div>

        <Row label="Metin rengi">
          <span className="font-mono text-[11px] text-faint uppercase">{toHex(text.fill as string)}</span>
          <ColorField label="Metin rengi" alpha value={text.fill as string} onChange={(fill) => set({ fill })} />
        </Row>
      </Section>

      <Section title="Aralık">
        <Slider
          label="Harf aralığı"
          min={-100}
          max={800}
          step={5}
          bipolar={false}
          defaultValue={0}
          value={text.charSpacing}
          onChange={(charSpacing) => set({ charSpacing })}
        />
        <Slider
          label="Satır aralığı"
          min={0.6}
          max={3}
          step={0.02}
          precision={2}
          defaultValue={1.16}
          value={text.lineHeight}
          disabled={curved}
          onChange={(lineHeight) => set({ lineHeight })}
        />
      </Section>

      <Section title="Dış hat">
        <Row label="Renk">
          <ColorField
            label="Dış hat rengi"
            allowNone
            alpha
            fallback="#000000"
            value={hasStroke ? (text.stroke as string) : ''}
            onChange={(stroke) =>
              stroke
                ? set({ stroke, strokeWidth: hasStroke ? text.strokeWidth : Math.max(2, Math.round(text.fontSize * 0.06)) })
                : set({ stroke: null, strokeWidth: 0 }, 'now')
            }
          />
        </Row>
        <Slider
          label="Kalınlık"
          min={0}
          max={maxStroke}
          step={0.5}
          precision={1}
          suffix="px"
          value={hasStroke ? text.strokeWidth : 0}
          onChange={(strokeWidth) =>
            set({ strokeWidth, stroke: strokeWidth > 0 ? ((text.stroke as string) || '#000000') : null })
          }
        />
      </Section>

      <Section title="Arka plan" defaultOpen={!!text.textBackgroundColor || !!text.backgroundColor}>
        <Row label="Vurgu (satır arkası)">
          <ColorField
            label="Vurgu rengi"
            allowNone
            alpha
            fallback="#facc15"
            value={text.textBackgroundColor}
            onChange={(textBackgroundColor) => set({ textBackgroundColor })}
          />
        </Row>
        <Row label="Kutu">
          <ColorField
            label="Kutu rengi"
            allowNone
            alpha
            fallback="#0b0c10"
            value={text.backgroundColor}
            onChange={(backgroundColor) =>
              set(
                backgroundColor && !text.backgroundColor && !text.boxPadding
                  ? { backgroundColor, boxPadding: Math.round(text.fontSize * 0.35), boxRadius: Math.round(text.fontSize * 0.18) }
                  : { backgroundColor },
              )
            }
          />
        </Row>
        <Slider
          label="Kutu dolgusu"
          min={0}
          max={Math.max(60, Math.round(text.fontSize * 1.2))}
          suffix="px"
          disabled={!text.backgroundColor}
          value={Math.round(text.boxPadding || 0)}
          onChange={(boxPadding) => set({ boxPadding })}
        />
        <Slider
          label="Köşe yuvarlaklığı"
          min={0}
          max={Math.max(60, Math.round(text.fontSize * 1.2))}
          suffix="px"
          disabled={!text.backgroundColor}
          value={Math.round(text.boxRadius || 0)}
          onChange={(boxRadius) => set({ boxRadius })}
        />
      </Section>

      <Section title="Kavis" defaultOpen={curved}>
        <Slider
          label="Kavis açısı"
          min={-MAX_CURVE}
          max={MAX_CURVE}
          step={2}
          suffix="°"
          bipolar
          defaultValue={0}
          value={Math.round(text.curve || 0)}
          onChange={(curve) => set({ curve })}
        />
        <p className="text-[11px] leading-relaxed text-faint">
          Pozitif değerler metni yukarı, negatif değerler aşağı doğru büker. Kavisli metin tek satırdır ve içeriği
          yukarıdaki kutudan düzenlenir.
        </p>
      </Section>
    </>
  )
}
