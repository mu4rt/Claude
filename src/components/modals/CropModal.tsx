import type { FabricImage } from 'fabric'
import { useMemo, useState } from 'react'
import ReactCrop, { centerCrop, makeAspectCrop, type PercentCrop } from 'react-image-crop'
import 'react-image-crop/dist/ReactCrop.css'
import { useEditor } from '../../editor/EditorContext'
import { getCropRect, getSourceUrl } from '../../editor/images'
import { useEditorStore } from '../../store/editorStore'
import { Button } from '../ui/Button'
import { cn } from '../ui/cn'
import { Modal } from '../ui/Modal'

interface CropModalProps {
  image: FabricImage
  onClose: () => void
}

interface AspectOption {
  id: string
  label: string
  /** undefined = serbest */
  ratio?: number
}

/**
 * Kırpma penceresi. Görselin tam (kırpılmamış) kaynağı gösterilir; böylece
 * daha önce yapılmış bir kırpma genişletilebilir veya değiştirilebilir.
 */
export function CropModal({ image, onClose }: CropModalProps) {
  const editor = useEditor()
  const doc = useEditorStore((s) => s.doc)
  const source = useMemo(() => image.getOriginalSize(), [image])
  const src = useMemo(() => getSourceUrl(image), [image])

  const options: AspectOption[] = useMemo(
    () => [
      { id: 'free', label: 'Serbest' },
      { id: 'original', label: 'Orijinal', ratio: source.width / source.height },
      { id: 'canvas', label: 'Tuval oranı', ratio: doc.width / doc.height },
      { id: '1:1', label: '1:1', ratio: 1 },
      { id: '4:5', label: '4:5', ratio: 4 / 5 },
      { id: '4:3', label: '4:3', ratio: 4 / 3 },
      { id: '3:2', label: '3:2', ratio: 3 / 2 },
      { id: '16:9', label: '16:9', ratio: 16 / 9 },
      { id: '9:16', label: '9:16', ratio: 9 / 16 },
    ],
    [source, doc],
  )

  const [aspectId, setAspectId] = useState('free')
  const [crop, setCrop] = useState<PercentCrop>(() => {
    const rect = getCropRect(image)
    return {
      unit: '%',
      x: (rect.x / source.width) * 100,
      y: (rect.y / source.height) * 100,
      width: (rect.width / source.width) * 100,
      height: (rect.height / source.height) * 100,
    }
  })

  const aspect = options.find((o) => o.id === aspectId)?.ratio

  const chooseAspect = (option: AspectOption) => {
    setAspectId(option.id)
    if (!option.ratio) return
    // Seçilen orana uyan, olabildiğince büyük ve ortalanmış bir pencere
    const next = centerCrop(
      makeAspectCrop({ unit: '%', width: 100 }, option.ratio, source.width, source.height),
      source.width,
      source.height,
    )
    setCrop(next)
  }

  const pixels = {
    x: (crop.x / 100) * source.width,
    y: (crop.y / 100) * source.height,
    width: (crop.width / 100) * source.width,
    height: (crop.height / 100) * source.height,
  }
  const valid = pixels.width >= 1 && pixels.height >= 1

  return (
    <Modal
      title="Görseli kırp"
      width={860}
      onClose={onClose}
      footer={
        <>
          <span className="mr-auto text-xs text-muted tabular-nums">
            {Math.round(pixels.width)} × {Math.round(pixels.height)} px
          </span>
          <Button
            variant="ghost"
            onClick={() => {
              setAspectId('free')
              setCrop({ unit: '%', x: 0, y: 0, width: 100, height: 100 })
            }}
          >
            Tümünü seç
          </Button>
          <Button onClick={onClose}>Vazgeç</Button>
          <Button
            variant="primary"
            disabled={!valid}
            onClick={() => {
              editor.cropImage(image, pixels)
              onClose()
            }}
          >
            Kırp
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-3 p-4">
        <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label="Kırpma oranı">
          {options.map((option) => (
            <button
              key={option.id}
              type="button"
              role="radio"
              aria-checked={option.id === aspectId}
              onClick={() => chooseAspect(option)}
              className={cn(
                'h-7.5 rounded-full border px-3 text-xs font-medium transition-colors',
                option.id === aspectId
                  ? 'border-accent bg-accent-soft text-accent'
                  : 'border-line bg-raised text-muted hover:text-ink',
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
        <div className="flex items-center justify-center rounded-xl bg-base p-3">
          <ReactCrop
            crop={crop}
            aspect={aspect}
            keepSelection
            ruleOfThirds
            minWidth={8}
            minHeight={8}
            onChange={(_, percent) => setCrop(percent)}
          >
            <img
              src={src}
              alt="Kırpılacak görsel"
              draggable={false}
              className="checker block max-h-[58vh] max-w-full select-none"
            />
          </ReactCrop>
        </div>
      </div>
    </Modal>
  )
}
