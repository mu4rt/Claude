# Kapak Stüdyo

Tarayıcıda çalışan kapak fotoğrafı ve sosyal medya görseli oluşturucu.
**React 19 + TypeScript + Tailwind CSS 4 + Fabric.js 7 + Transformers.js**

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # dist/
```

## Özellikler
- **Tuval:** hazır boyutlar (Facebook, YouTube, Instagram, X, LinkedIn…), özel boyut ve en-boy oranı, yakınlaştırma/gezdirme, hizalama kılavuzları, sürükle-bırak (dosya, şekil, metin).
- **Katmanlar:** öne/arkaya alma, sürükleyerek sıralama, kilitleme, gizleme, yeniden adlandırma, silme.
- **Metin:** 59 Google Fonts yazı tipi (kategorili), renk, vurgu ve yuvarlak köşeli kutu arka planı, dış hat, altı/üstü çizili, gölge (renk/bulanıklık/yön), hizalama, harf ve satır aralığı, **kavisli metin**.
- **Görsel:** tarayıcı içi **arka plan silme** (Web Worker + Transformers.js, isteğe bağlı harici API), 2× büyütme, unsharp mask netleştirme, parlaklık/kontrast/doygunluk/canlılık/ton/bulanıklık, kırpma (oran seçenekli), çevirme, döndürme, eğme.
- **Geri al / ileri al**, klavye kısayolları, kopyala/yapıştır.
- **Dışa aktarma:** PNG/JPEG, 1×–4× çözünürlük, tuval dışı kısımlar kesilir. Proje **JSON** olarak kaydedilip yeniden açılabilir.

## Arka plan silme yapılandırması (`.env`)
```
VITE_BG_REMOVAL_PROVIDER=local          # veya api
VITE_BG_REMOVAL_MODEL=briaai/RMBG-1.4   # Transformers.js uyumlu model
VITE_BG_REMOVAL_API_URL=...             # api modunda (remove.bg uyumlu)
VITE_BG_REMOVAL_API_KEY=...             # üretimde bir proxy arkasında tutun
```
Model ilk kullanımda Hugging Face'ten indirilir ve tarayıcıda önbelleğe alınır.

## Yapı
```
src/editor/   Fabric çekirdeği (Editor, metin/kavis, filtreler, görsel, geçmiş, dışa aktarma, proje)
src/ai/       Arka plan silme (worker + API), büyütme
src/components/  Üst çubuk, sol araç panelleri, sağ özellik paneli, kırpma/dışa aktarma pencereleri
```
