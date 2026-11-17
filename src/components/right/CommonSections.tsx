import type { FabricObject } from 'fabric'
import {
  AlignCenterHorizontal,
  AlignCenterVertical,
  AlignEndHorizontal,
  AlignEndVertical,
  AlignStartHorizontal,
  AlignStartVertical,
  ChevronDown,
  ChevronUp,
  ChevronsDown,
  ChevronsUp,
  FlipHorizontal2,
  FlipVertical2,
  Link2,
  Unlink2,
} from 'lucide-react'
import { useState } from 'react'
import { useEditor } from '../../editor/EditorContext'
import type { AlignMode } from '../../editor/types'
import { radToDeg } from '../../editor/utils'
import { IconButton } from '../ui/Button'
import { ColorField } from '../ui/ColorField'
import { NumberField } from '../ui/NumberField'
import { Row, Section } from '../ui/Section'
import { Slider } from '../ui/Slider'

/** Açıyı −180…180 aralığına indirger. */
const normalizeAngle = (angle: number) => ((((angle + 180) % 360) + 360) % 360) - 180

interface TransformProps {
  object: FabricObject
  /** Metinde boyut puntoyla belirlendiği için G/Y kutuları kapatılır */
  lockSize?: boolean
}

/** Konum, boyut, döndürme, eğme ve çevirme. */
export function TransformSection({ object, lockSize }: TransformProps) {
  const editor = useEditor()
  const [keepRatio, setKeepRatio] = useState(true)
  const box = object.getBoundingRect()
  const width = object.getScaledWidth()
  const height = object.getScaledHeight()

  const resize = (axis: 'x' | 'y', value: number) => {
    const current = axis === 'x' ? width : height
    if (current <= 0 || value <= 0) return
    const k = value / current
    if (keepRatio) editor.setTransform({ scaleX: object.scaleX * k, scaleY: object.scaleY * k })
    else if (axis === 'x') editor.setTransform({ scaleX: object.scaleX * k })
    else editor.setTransform({ scaleY: object.scaleY * k })
  }

  return (
    <Section title="Konum ve dönüşüm">
      <div className="grid grid-cols-2 gap-1.5">
        <NumberField label="X konumu" prefix="X" value={box.left} onChange={(x) => editor.setTransform({ left: object.left + (x - box.left) })} />
        <NumberField label="Y konumu" prefix="Y" value={box.top} onChange={(y) => editor.setTransform({ top: object.top + (y - box.top) })} />
      </div>
      <div className="flex items-center gap-1.5">
        <NumberField label="Genişlik" prefix="G" value={width} min={1} disabled={lockSize} onChange={(v) => resize('x', v)} className="flex-1" />
        <IconButton
          size="sm"
          label={keepRatio ? 'Oran kilitli' : 'Oran serbest'}
          active={keepRatio}
          disabled={lockSize}
          onClick={() => setKeepRatio((v) => !v)}
        >
          {keepRatio ? <Link2 size={13} /> : <Unlink2 size={13} />}
        </IconButton>
        <NumberField label="Yükseklik" prefix="Y" value={height} min={1} disabled={lockSize} onChange={(v) => resize('y', v)} className="flex-1" />
      </div>

      <Slider
        label="Döndürme"
        min={-180}
        max={180}
        suffix="°"
        bipolar
        defaultValue={0}
        value={Math.round(normalizeAngle(object.angle))}
        onChange={(angle) => editor.setTransform({ angle })}
      />
      <Slider
        label="Yatay eğme"
        min={-60}
        max={60}
        suffix="°"
        bipolar
        defaultValue={0}
        value={Math.round(object.skewX)}
        onChange={(skewX) => editor.setTransform({ skewX })}
      />
      <Slider
        label="Dikey eğme"
        min={-60}
        max={60}
        suffix="°"
        bipolar
        defaultValue={0}
        value={Math.round(object.skewY)}
        onChange={(skewY) => editor.setTransform({ skewY })}
      />

      <Row label="Çevir">
        <IconButton label="Yatay çevir" active={object.flipX} onClick={() => editor.flip('x')} className="border border-line bg-raised">
          <FlipHorizontal2 size={15} />
        </IconButton>
        <IconButton label="Dikey çevir" active={object.flipY} onClick={() => editor.flip('y')} className="border border-line bg-raised">
          <FlipVertical2 size={15} />
        </IconButton>
      </Row>
    </Section>
  )
}

const ALIGNMENTS: { mode: AlignMode; label: string; icon: typeof AlignStartVertical }[] = [
  { mode: 'left', label: 'Sola yasla', icon: AlignStartVertical },
  { mode: 'centerH', label: 'Yatayda ortala', icon: AlignCenterVertical },
  { mode: 'right', label: 'Sağa yasla', icon: AlignEndVertical },
  { mode: 'top', label: 'Üste yasla', icon: AlignStartHorizontal },
  { mode: 'centerV', label: 'Dikeyde ortala', icon: AlignCenterHorizontal },
  { mode: 'bottom', label: 'Alta yasla', icon: AlignEndHorizontal },
]

/** Tuvale göre hizalama ve katman sırası. */
export function ArrangeSection() {
  const editor = useEditor()
  return (
    <Section title="Hizalama ve sıra">
      <div className="flex items-center justify-between rounded-lg border border-line bg-raised p-0.5">
        {ALIGNMENTS.map(({ mode, label, icon: Icon }) => (
          <IconButton key={mode} size="sm" label={`Tuvalde ${label.toLocaleLowerCase('tr')}`} onClick={() => editor.align(mode)} className="flex-1">
            <Icon size={15} />
          </IconButton>
        ))}
      </div>
      <div className="flex items-center justify-between rounded-lg border border-line bg-raised p-0.5">
        <IconButton size="sm" label="En öne getir (Ctrl Shift ])" onClick={() => editor.arrange('front')} className="flex-1">
          <ChevronsUp size={15} />
        </IconButton>
        <IconButton size="sm" label="Bir öne al (Ctrl ])" onClick={() => editor.arrange('forward')} className="flex-1">
          <ChevronUp size={15} />
        </IconButton>
        <IconButton size="sm" label="Bir arkaya at (Ctrl [)" onClick={() => editor.arrange('backward')} className="flex-1">
          <ChevronDown size={15} />
        </IconButton>
        <IconButton size="sm" label="En arkaya gönder (Ctrl Shift [)" onClick={() => editor.arrange('back')} className="flex-1">
          <ChevronsDown size={15} />
        </IconButton>
      </div>
    </Section>
  )
}

/** Saydamlık. */
export function OpacitySection({ object }: { object: FabricObject }) {
  const editor = useEditor()
  return (
    <Section title="Görünüm">
      <Slider
        label="Opaklık"
        min={0}
        max={100}
        suffix="%"
        defaultValue={100}
        value={Math.round(object.opacity * 100)}
        onChange={(value) => editor.setProps({ opacity: value / 100 })}
      />
    </Section>
  )
}

/** Gölge: renk, bulanıklık, uzaklık ve yön (açı). */
export function ShadowSection({ object }: { object: FabricObject }) {
  const editor = useEditor()
  const shadow = object.shadow
  // Uzaklık 0 iken açı ofsetlerden çıkarılamaz; son seçilen açı burada tutulur
  const [rememberedAngle, setRememberedAngle] = useState(45)

  const distance = shadow ? Math.hypot(shadow.offsetX, shadow.offsetY) : 0
  const angle =
    shadow && distance > 0.01
      ? (Math.round(radToDeg(Math.atan2(shadow.offsetY, shadow.offsetX))) + 360) % 360
      : rememberedAngle

  const update = (patch: { color?: string; blur?: number; distance?: number; angle?: number }) => {
    const next = {
      color: shadow?.color ?? '#00000099',
      blur: shadow?.blur ?? 12,
      distance,
      angle,
      ...patch,
    }
    setRememberedAngle(next.angle)
    const rad = (next.angle * Math.PI) / 180
    editor.setShadow({
      color: next.color,
      blur: next.blur,
      offsetX: Math.round(Math.cos(rad) * next.distance * 10) / 10,
      offsetY: Math.round(Math.sin(rad) * next.distance * 10) / 10,
    })
  }

  return (
    <Section title="Gölge" defaultOpen={!!shadow}>
      <Row label="Gölge rengi">
        <ColorField
          label="Gölge rengi"
          alpha
          allowNone
          fallback="#00000099"
          value={shadow?.color ?? ''}
          onChange={(color) => {
            if (!color) editor.setShadow(null, 'now')
            else if (shadow) update({ color })
            else update({ color, blur: 12, distance: 10, angle: 45 })
          }}
        />
      </Row>
      <Slider label="Bulanıklık" min={0} max={150} suffix="px" disabled={!shadow} value={Math.round(shadow?.blur ?? 0)} onChange={(blur) => update({ blur })} />
      <Slider label="Uzaklık" min={0} max={150} suffix="px" disabled={!shadow} value={Math.round(distance)} onChange={(d) => update({ distance: d })} />
      <Slider label="Yön" min={0} max={360} suffix="°" disabled={!shadow} value={angle} onChange={(a) => update({ angle: a })} />
    </Section>
  )
}
