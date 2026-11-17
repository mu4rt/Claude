import { Rect, type FabricObject } from 'fabric'
import { useEditor } from '../../editor/EditorContext'
import { toHex } from '../ui/color'
import { ColorField } from '../ui/ColorField'
import { Row, Section } from '../ui/Section'
import { Slider } from '../ui/Slider'

/** Şekil nesnesinin dolgu, kenarlık ve köşe ayarları. */
export function ShapeSection({ shape }: { shape: FabricObject }) {
  const editor = useEditor()
  const isLine = shape.shape === 'line'
  const hasStroke = !!shape.stroke && (shape.strokeWidth || 0) > 0
  const size = Math.max(1, Math.min(shape.width, shape.height))

  if (isLine) {
    return (
      <Section title="Çizgi">
        <Row label="Renk">
          <span className="font-mono text-[11px] text-faint uppercase">{toHex(shape.stroke as string)}</span>
          <ColorField label="Çizgi rengi" alpha value={shape.stroke as string} onChange={(stroke) => editor.setProps({ stroke })} />
        </Row>
        <Slider
          label="Kalınlık"
          min={1}
          max={80}
          suffix="px"
          value={Math.round(shape.strokeWidth)}
          onChange={(strokeWidth) => editor.setProps({ strokeWidth })}
        />
      </Section>
    )
  }

  return (
    <Section title="Şekil">
      <Row label="Dolgu">
        <span className="font-mono text-[11px] text-faint uppercase">{shape.fill ? toHex(shape.fill as string) : 'Yok'}</span>
        <ColorField
          label="Dolgu rengi"
          alpha
          allowNone
          value={shape.fill as string}
          onChange={(fill) => editor.setProps({ fill })}
        />
      </Row>
      <Row label="Kenarlık">
        <ColorField
          label="Kenarlık rengi"
          alpha
          allowNone
          fallback="#ffffff"
          value={hasStroke ? (shape.stroke as string) : ''}
          onChange={(stroke) =>
            stroke
              ? editor.setProps({ stroke, strokeWidth: hasStroke ? shape.strokeWidth : 6 })
              : editor.setProps({ stroke: '', strokeWidth: 0 }, 'now')
          }
        />
      </Row>
      <Slider
        label="Kenarlık kalınlığı"
        min={0}
        max={60}
        suffix="px"
        value={hasStroke ? Math.round(shape.strokeWidth) : 0}
        onChange={(strokeWidth) =>
          editor.setProps({ strokeWidth, stroke: strokeWidth > 0 ? ((shape.stroke as string) || '#ffffff') : '' })
        }
      />
      {shape instanceof Rect && (
        <Slider
          label="Köşe yuvarlaklığı"
          min={0}
          max={Math.round(size / 2)}
          suffix="px"
          value={Math.round(shape.rx || 0)}
          onChange={(radius) => editor.setProps({ rx: radius, ry: radius })}
        />
      )}
    </Section>
  )
}
