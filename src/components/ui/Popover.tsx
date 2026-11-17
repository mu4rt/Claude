import { useEffect, useLayoutEffect, useRef, useState, type ReactNode, type RefObject } from 'react'
import { createPortal } from 'react-dom'
import { cn } from './cn'

interface PopoverProps {
  open: boolean
  onClose: () => void
  anchor: RefObject<HTMLElement | null>
  children: ReactNode
  width?: number
  align?: 'start' | 'end'
  className?: string
}

const MARGIN = 8

/**
 * Bir çapa öğesine bağlı, gövdeye (portal) çizilen açılır kutu.
 * Panellerin kaydırma alanından etkilenmemesi için `position: fixed` kullanır
 * ve ekrana sığmadığında yukarı açılır.
 */
export function Popover({ open, ...rest }: PopoverProps) {
  return open ? <PopoverContent {...rest} /> : null
}

function PopoverContent({
  onClose,
  anchor,
  children,
  width = 240,
  align = 'start',
  className,
}: Omit<PopoverProps, 'open'>) {
  const ref = useRef<HTMLDivElement>(null)
  const [pos, setPos] = useState<{ left: number; top: number } | null>(null)

  useLayoutEffect(() => {
    const place = () => {
      const a = anchor.current?.getBoundingClientRect()
      const el = ref.current
      if (!a || !el) return
      const height = el.offsetHeight
      let left = align === 'end' ? a.right - width : a.left
      left = Math.max(MARGIN, Math.min(left, window.innerWidth - width - MARGIN))
      let top = a.bottom + 6
      if (top + height > window.innerHeight - MARGIN) {
        const above = a.top - 6 - height
        top = above >= MARGIN ? above : Math.max(MARGIN, window.innerHeight - height - MARGIN)
      }
      setPos({ left, top })
    }
    place()
    const observer = new ResizeObserver(place)
    if (ref.current) observer.observe(ref.current)
    window.addEventListener('resize', place)
    window.addEventListener('scroll', place, true)
    return () => {
      observer.disconnect()
      window.removeEventListener('resize', place)
      window.removeEventListener('scroll', place, true)
    }
  }, [anchor, width, align])

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      const target = e.target as Node
      if (ref.current?.contains(target) || anchor.current?.contains(target)) return
      onClose()
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation()
        onClose()
      }
    }
    document.addEventListener('mousedown', onDown, true)
    document.addEventListener('keydown', onKey, true)
    return () => {
      document.removeEventListener('mousedown', onDown, true)
      document.removeEventListener('keydown', onKey, true)
    }
  }, [onClose, anchor])

  return createPortal(
    <div
      ref={ref}
      role="dialog"
      style={{ width, left: pos?.left ?? -9999, top: pos?.top ?? -9999, visibility: pos ? 'visible' : 'hidden' }}
      className={cn(
        'fixed z-50 animate-pop rounded-xl border border-line bg-panel shadow-pop',
        className,
      )}
    >
      {children}
    </div>,
    document.body,
  )
}
