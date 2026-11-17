import { HISTORY_LIMIT } from './constants'

interface HistoryHost {
  /** Geçerli durumu serileştirir */
  take: () => string
  /** Serileştirilmiş durumu geri yükler */
  restore: (state: string) => Promise<void>
  onChange: (state: { canUndo: boolean; canRedo: boolean }) => void
}

/**
 * Anlık görüntü (snapshot) tabanlı geri al / ileri al yığını.
 * Görseller blob URL olarak tutulduğundan her kayıt yalnızca birkaç KB'tır.
 */
export class History {
  private host: HistoryHost
  private stack: string[] = []
  private index = -1
  private timer: ReturnType<typeof setTimeout> | undefined
  private queue: Promise<void> = Promise.resolve()
  /** Geri yükleme sırasında tetiklenen tuval olayları kayıt oluşturmamalı */
  restoring = false

  constructor(host: HistoryHost) {
    this.host = host
  }

  get canUndo() {
    return this.index > 0
  }

  get canRedo() {
    return this.index < this.stack.length - 1
  }

  /** Yığını sıfırlar ve geçerli durumu ilk kayıt yapar. */
  reset() {
    clearTimeout(this.timer)
    this.stack = [this.host.take()]
    this.index = 0
    this.notify()
  }

  /** Geçerli durumu hemen kaydeder (son kayıtla aynıysa atlar). */
  commit() {
    clearTimeout(this.timer)
    this.timer = undefined
    if (this.restoring) return
    const state = this.host.take()
    if (state === this.stack[this.index]) return
    this.stack.length = this.index + 1
    this.stack.push(state)
    if (this.stack.length > HISTORY_LIMIT) this.stack.shift()
    this.index = this.stack.length - 1
    this.notify()
  }

  /** Kaydırıcı sürükleme gibi art arda değişiklikleri tek kayıtta toplar. */
  scheduleCommit(delay = 400) {
    if (this.restoring) return
    clearTimeout(this.timer)
    this.timer = setTimeout(() => this.commit(), delay)
  }

  undo() {
    return this.step(-1)
  }

  redo() {
    return this.step(1)
  }

  private step(direction: 1 | -1) {
    // Bekleyen değişiklik varsa önce onu kaydet ki geri alınabilsin
    if (this.timer) this.commit()
    this.queue = this.queue.then(async () => {
      const next = this.index + direction
      if (next < 0 || next >= this.stack.length) return
      this.index = next
      this.restoring = true
      try {
        await this.host.restore(this.stack[next])
      } finally {
        this.restoring = false
        this.notify()
      }
    })
    return this.queue
  }

  private notify() {
    this.host.onChange({ canUndo: this.canUndo, canRedo: this.canRedo })
  }
}
