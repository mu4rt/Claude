import { fileURLToPath } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defaultClientConditions, defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    // Transformers.js, ONNX çalışma zamanını (wasm) ilk kullanımda sürümüyle eşleşen
    // CDN adresinden yükler. Bu koşul, kullanılmayacak ~27 MB'lık wasm dosyasının
    // ayrıca derleme çıktısına (dist) kopyalanmasını önler.
    conditions: ['onnxruntime-web-use-extern-wasm', ...defaultClientConditions],
    alias: {
      // fabric/extensions'ın kullanmadığımız isteğe bağlı bağımlılığı (bkz. src/stubs/westures.ts)
      westures: fileURLToPath(new URL('./src/stubs/westures.ts', import.meta.url)),
    },
  },
  // Arka plan silme modeli (Transformers.js) bir ES modül Web Worker'ında çalışır
  worker: { format: 'es' },
  optimizeDeps: {
    // Worker ilk kez çalıştığında Vite'ın bağımlılığı yeni keşfedip sayfayı
    // yenilemesini (ve geliştirme sırasında tasarımın kaybolmasını) önler
    include: ['@huggingface/transformers'],
  },
  build: {
    target: 'es2022',
    chunkSizeWarningLimit: 1200,
  },
})
