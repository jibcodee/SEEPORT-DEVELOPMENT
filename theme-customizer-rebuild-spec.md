# Spesifikasi Pembinaan Semula: Sistem Theme Customizer (Extension + Admin Panel)

**Tujuan dokumen ini**: Panduan terperinci untuk AI agent (Gemini) membina semula seni bina custom theme system dari awal, langkah demi langkah, bagi menyelesaikan masalah animation tak keluar, preview tak padan dengan hasil sebenar, dan customization yang terhad.

**Konteks projek**: Seeport — Chrome Extension (sidepanel storefront) + Website jualan tema custom berasaskan fail JSON.

---

## 0. Punca Masalah Sedia Ada (Root Cause — Baca Dulu Sebelum Mula)

Seni bina lama ada **dua renderer berasingan** untuk paparan tema:

1. Extension sebenar (`sidepanel.html` + `sidepanel.js`)
2. Simulator preview dalam admin panel (React) — cuba "meniru" extension dengan copy struktur DOM

Masalah dengan pendekatan ni:
- Bila extension asal diubah/dibaiki, simulator admin **tidak auto-sync** — kedua-duanya drift dari masa ke masa.
- Setiap bug (contoh: animation `::before` tersekat layout) kena dibetulkan **berasingan di 2-3 tempat** (storefront, admin simulator, extension script).
- Preview yang admin nampak semasa "test" theme **tidak 100% sama** dengan apa yang user extension sebenar akan nampak.

**Prinsip pembetulan**: Preview admin MESTI guna renderer yang **sama persis** dengan extension sebenar. Bukan "mirip", tapi **sama code**.

---

## 1. Objektif Seni Bina Baru

- [ ] Satu sahaja renderer tema — digunakan oleh: extension sebenar, storefront preview, admin panel preview.
- [ ] Theme JSON adalah **data berstruktur**, bukan raw code (CSS/JS bebas).
- [ ] Animation guna set jenis yang terhad tapi teruji stabil (bukan animation bebas tulis sendiri setiap kali).
- [ ] Validation skema JSON sebelum simpan ke database.
- [ ] Customization tetap fleksibel dari sudut pandang end-user (banyak parameter boleh ubah), tapi terkawal dari sudut pandang engineering (tiada raw code injection).

---

## 2. Susunan Kerja (Buat Ikut Urutan Ini)

### FASA 1 — Bina Modul Renderer Kongsi (Shared Theme Renderer)

**Matlamat**: Satu fungsi/komponen yang terima theme JSON dan hasilkan output visual yang sama tak kira dipanggil dari mana.

**Langkah**:
1. Cipta folder/package baru: `packages/theme-renderer/` (atau `lib/theme-renderer/` kalau tak guna monorepo).
2. Dalam folder ni, bina fungsi utama:
   ```
   renderTheme(themeConfig: ThemeConfig): void
   ```
   Fungsi ini bertanggungjawab untuk:
   - Set CSS custom properties (`--bg-primary`, `--accent-color`, `--text-color`, dll.) berdasarkan `themeConfig.colors`.
   - Mount animation background berdasarkan `themeConfig.animation.type` (rujuk Fasa 2 untuk senarai jenis animation).
   - Guna **element HTML fizikal** untuk animation background (`<div class="theme-bg-animation">`), **JANGAN** guna manipulasi pseudo-element (`::before`/`::after`) — ini punca bug asal yang dah dikenalpasti.
3. Renderer ini mesti **framework-agnostic** kalau boleh (vanilla JS/CSS), supaya boleh dipakai dalam:
   - Chrome extension sidepanel (vanilla JS environment)
   - Next.js storefront (React)
   - Next.js admin panel (React)
4. Jika terpaksa guna React untuk sesetengah bahagian, bina wrapper React yang panggil fungsi vanilla core yang sama — jangan tulis dua logik berasingan.

**Output Fasa 1**: Satu fail/package `theme-renderer` yang boleh di-import oleh extension DAN oleh web app.

---

### FASA 2 — Definisikan Skema JSON Tema (Struktur Data Ketat)

**Matlamat**: Elak raw CSS/JS bebas dalam JSON. Setiap tema mesti ikut struktur ni supaya predictable dan selamat.

**Skema cadangan** (`theme-schema.json`):

```json
{
  "id": "string (unique, auto-generated atau slug)",
  "name": "string (nama tema, cth: 'Halloween Cat Ghost')",
  "tier": "standard | premium",
  "price": "number (RM3 - RM100)",
  "colors": {
    "background": "#hex",
    "primary": "#hex",
    "secondary": "#hex",
    "accent": "#hex",
    "text": "#hex",
    "cardBackground": "#hex"
  },
  "animation": {
    "type": "none | gradient-shift | particle-float | gif-loop | sprite-walk",
    "speed": "number (ms, cth: 3000)",
    "direction": "string (opsyenal, cth: 'left-to-right')",
    "assetUrl": "string (opsyenal — untuk gif-loop/sprite-walk, URL fail GIF/PNG)"
  },
  "typography": {
    "fontFamily": "string (dari senarai font yang dibenarkan sahaja)",
    "headingWeight": "number"
  },
  "layout": {
    "cardStyle": "rounded | sharp | glassmorphism",
    "borderRadius": "number (px)"
  },
  "metadata": {
    "createdAt": "ISO date string",
    "createdBy": "admin email/id"
  }
}
```

**Peraturan penting**:
- `animation.type` **mesti** dari senarai enum yang ditetapkan (langkah 2 di bawah) — bukan string bebas.
- **Tiada field** untuk raw HTML/CSS/JS. Kalau user perlukan animation baru yang tak ada dalam senarai, developer kena tambah type baru ke dalam renderer (Fasa 1), bukan biar admin taip code terus.

**Langkah bina senarai animation type yang disokong**:
1. Analisa animation sedia ada yang berfungsi (gradient background, GIF tema) dan animation repositori `halloween-cat-ghost` yang disebut dalam laporan lama.
2. Kod setiap satu sebagai fungsi berasingan dalam `theme-renderer`, contoh:
   - `gradient-shift`: animate `background-position` atau `background` gradient secara CSS keyframes.
   - `gif-loop`: papar GIF sebagai background image, guna `object-fit: cover`.
   - `particle-float`: animation partikel ringan (CSS/Canvas kecil).
   - `sprite-walk`: untuk animasi seperti kucing/hantu berjalan (sprite sheet).
3. Setiap type ni diuji **dalam extension sebenar** (bukan simulator) sebelum disahkan "stabil" dan dimasukkan ke senarai enum.

**Output Fasa 2**: Fail `theme-schema.json` + validator (guna library macam `ajv` untuk JSON Schema validation).

---

### FASA 3 — Validation Sebelum Simpan (Server-Side)

**Matlamat**: Elak data tema pincang/rosak masuk database Supabase.

**Langkah**:
1. Di endpoint `/api/themes` (POST), sebelum insert ke Supabase:
   - Validate JSON body melawan `theme-schema.json` guna `ajv` atau library serupa.
   - Kalau gagal validation → return `400 Bad Request` dengan mesej error yang jelas (field mana yang salah).
2. Di sisi admin panel (client), guna skema yang sama untuk real-time validation semasa admin isi borang/upload JSON — supaya admin nampak error sebelum cuba "Save".
3. Pastikan endpoint ni **kekal** dilindungi oleh JWT Bearer token check yang dah dibina (rujuk laporan progress lama, bahagian keselamatan — jangan buang logic ni).

**Output Fasa 3**: Middleware/function `validateThemeSchema()` dipanggil di client DAN server (dua-dua, jangan client sahaja — client-side validation boleh dipintas).

---

### FASA 4 — Admin Panel Preview = Extension Sebenar (Bukan Simulator)

**Matlamat**: Hapuskan simulator React yang "meniru" extension. Ganti dengan extension sebenar dalam iframe.

**Langkah**:
1. Build fail extension (`sidepanel.html`, `sidepanel.js`, dan bundle CSS) sebagai static asset yang boleh di-serve.
2. Di admin panel, letak `<iframe src="/extension-preview/sidepanel.html">`.
3. Bina mekanisme komunikasi antara admin panel (parent) dan iframe (child) guna `window.postMessage`:
   ```js
   // Dari admin panel (parent), hantar theme config bila admin ubah setting
   iframeRef.current.contentWindow.postMessage(
     { type: 'THEME_UPDATE', payload: themeConfig },
     '*' // gantikan dengan origin sebenar untuk production
   );
   ```
   ```js
   // Dalam sidepanel.js (child/extension), dengar mesej ni
   window.addEventListener('message', (event) => {
     if (event.data.type === 'THEME_UPDATE') {
       renderTheme(event.data.payload); // panggil fungsi dari Fasa 1
     }
   });
   ```
4. Untuk API `chrome.storage` yang extension biasa guna (yang tak wujud dalam iframe biasa), bina **shim/mock** ringkas dalam mod "preview" supaya extension code tak crash bila dijalankan luar konteks extension sebenar.
5. Setiap kali admin ubah warna/animation dalam borang, `postMessage` dihantar → iframe update secara live — dan ini **hasil sebenar**, bukan tiruan.

**Output Fasa 4**: Admin panel preview 100% padan dengan extension sebenar sebab guna code yang sama.

---

### FASA 5 — Import/Export JSON Tema

**Matlamat**: Kekalkan ciri import JSON yang dah wujud, tapi sekarang lebih selamat sebab dah ada validation (Fasa 3).

**Langkah**:
1. Butang "Import JSON" → baca fail → jalankan `validateThemeSchema()` (client-side) → kalau lulus, populate borang admin.
2. Sebelum "Save Theme" ke Supabase, validation server-side (Fasa 3) jalan sekali lagi (jangan percaya client sahaja).
3. Sediakan juga butang "Export JSON" untuk admin boleh muat turun tema sedia ada sebagai fail `.json` — berguna untuk backup/sharing.

---

### FASA 6 — Seeding Script untuk Tema Default

**Matlamat**: Elak masalah "tema dalam folder `public/` tak automatik masuk database".

**Langkah**:
1. Bina skrip `scripts/seed-themes.js` (Node.js) yang:
   - Baca semua fail `.json` dalam folder `public/themes/` (atau lokasi sama).
   - Validate setiap satu melawan skema (Fasa 2/3).
   - Insert/upsert ke Supabase melalui service role key (bukan guna client biasa).
2. Tambah script ni ke `package.json`:
   ```json
   "scripts": {
     "seed:themes": "node scripts/seed-themes.js"
   }
   ```
3. Jalankan sekali secara manual selepas deploy, atau automasikan dalam CI/CD pipeline selepas build berjaya.

---

## 3. Senarai Semak Testing (Sebelum Anggap Siap)

- [ ] Tema baru dicipta dari admin panel → preview dalam iframe sepadan 100% dengan extension yang di-load terus dalam Chrome (bukan preview).
- [ ] Animation `gradient-shift`, `gif-loop`, dan lain-lain berfungsi dalam **Chromium extension environment sebenar** (bukan setakat browser preview biasa).
- [ ] JSON tema tak sah (missing field, hex color salah format, animation type luar enum) — cuba import → mesti tertolak dengan mesej error jelas, bukan crash senyap.
- [ ] Endpoint `/api/themes` POST tanpa token → `401 Unauthorized` (pastikan security lama tak terjejas oleh perubahan ni).
- [ ] Jalankan `npm run seed:themes` dari kosong → semua tema default dalam `public/themes/` masuk Supabase tanpa perlu klik "Save" manual satu-satu.
- [ ] Load extension yang di-publish (bukan dev mode) dan sahkan tema custom yang dibeli boleh diaplikasikan dengan betul.

---

## 4. Isu Lama yang Perlu Disemak Semula (Jangan Lupa)

Ini isu dari laporan progress sebelum ini yang masih relevan dan patut diselesaikan serentak/berdekatan dengan kerja di atas:

1. **SSL certificate**: `rejectUnauthorized: false` dalam `lib/supabase.js` — ganti dengan sijil SSL sebenar sebelum production.
2. **Admin whitelist hardcoded**: Pertimbang pindah senarai admin email ke column `role`/`is_admin` dalam Supabase table, bukan hardcode dalam kod.
3. **ESLint config rosak**: Betulkan `eslint-config-next` supaya lint checking automatik berfungsi semula semasa `npm run build`.
4. **Rate limiting**: Sahkan endpoint `/api/themes`, `/api/admin/codes`, `/api/settings` ada had kadar request (elak abuse/spam).

---

## 5. Arahan Untuk AI Agent (Gemini)

Bila kau (Gemini) mula kerja berdasarkan dokumen ni:

1. **Jangan** cuba selesaikan semua fasa dalam satu sesi — ikut urutan Fasa 1 → 6, sahkan setiap fasa berfungsi sebelum ke fasa seterusnya.
2. **Jangan** tulis semula simulator React yang meniru extension — matlamat dokumen ni adalah untuk **menghapuskan** pendekatan tu terus.
3. Setiap kali nak tambah jenis animation baru, tambah ke dalam `theme-renderer` package (Fasa 1) dan enum skema (Fasa 2) — **jangan** benarkan JSON hantar raw CSS/JS bebas walau atas sebab "sementara" atau "cepat nak test".
4. Rujuk semula fail `lib/auth.js` dan struktur endpoint API sedia ada sebelum ubah apa-apa — pastikan security yang dah dibina (JWT Bearer validation) tak terjejas oleh refactor ni.
5. Selepas siapkan setiap fasa, jalankan senarai semak di Bahagian 3 berkaitan fasa tu sebelum sambung.

---

*Dokumen ini disediakan untuk pembangunan semula sistem theme customizer Seeport (extension + storefront + admin panel), 7 Ogos 2026.*
