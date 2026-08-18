# Laporan Perkembangan Projek: Seeport Storefront & Extension

Laporan ini memperincikan semua kerja pembangunan yang telah diselesaikan (Work Accomplished), pembetulan pepijat (Bugs Fixed), penutupan celah keselamatan (Security Loopholes Closed), dan masalah/cabaran semasa yang sedang dihadapi (Current Problems).

---

## 1. Perkara yang Telah Diselesaikan (Work Accomplished)

### A. Rekabentuk Semula Halaman Pentadbir (Admin Console Redesign)
* **Visual Glassmorphism Premium**: Menggantikan reka bentuk admin lama yang ringkas kepada konsol kawalan berwarna gelap bertema ultra-premium, lengkap dengan kesan `backdrop-filter: blur(16px)` dan border semi-transparan.
* **Bar Statistik Dinamik (Stats Overview)**: Menambah 3 kad ringkasan di bahagian atas dashboard untuk memantau:
  * **🎨 Jumlah Tema**: Pecahan kuantiti tema standard vs premium secara automatik.
  * **🔑 Claim Codes Aktif**: Memaparkan kuantiti kod tuntutan yang belum digunakan (`unused`) berbanding jumlah keseluruhan kod.
  * **⚡ Status Sambungan**: Penunjuk denyutan hijau aktif (`Supabase Live Connected`) untuk mengesahkan status database.
* **Dwi-Input Pemilihan Warna**: Ruang Visual Picker kini memaparkan blok preview warna bersebelahan dengan kotak teks hex. Pengguna boleh klik pada blok untuk membuka picker native atau menaip terus kod warna hex untuk perubahan masa-nyata.
* **Segmented Control & Slider Harga**:
  * Menukar pemilih tier kepada range slider harga **RM3 - RM100**.
  * Pengkelasan automatik: harga `< RM5` dikira standard, manakala `RM5` ke atas bertukar menjadi premium.

### B. Integrasi Simulator Extension Sebenar (Interactive Mock Preview)
* **Copy DOM Sebenar**: Menggantikan mockup statik ringkas dengan struktur HTML penuh daripada fail extension `sidepanel.html`.
* **Simulasi Penapisan Kandungan**: Menambah kod interaktif JavaScript di dalam iframe preview simulator untuk membolehkan tab navigasi (**All, Text, Image, Table**) berfungsi melakukan filter kad sampel secara dinamik.
* **Integrasi Modal Tetapan**: Butang gear tetapan di dalam simulator kini boleh membuka modal popup tetapan kod tema sepertimana extension sebenar.

### C. Import JSON Tema Tersuai
* **Butang Import JSON**: Menambah pilihan di halaman admin untuk pengguna memuat naik fail konfigurasi tema `.json` tersuai secara terus. Ciri ini akan mengisi ruang borang/kod secara automatik untuk memudahkan ujian sebelum disimpan ke database Supabase.
* **Fail Contoh Halloween**: Fail tema `halloween_theme.json` berasaskan animasi repositori `halloween-cat-ghost` telah berjaya dibina dan disalin ke folder `public/` untuk dimuat turun.

---

## 2. Ralat & Pepijat yang Telah Dibaiki (Bugs Fixed)

### A. Isu Latar Belakang Animasi Chromium
* **Masalah**: Animasi latar belakang kecerunan dinamik dan GIF tema tersuai tidak dipaparkan di dalam iframe pelayar Chromium. Ini berpunca daripada manipulasi gaya element pseudo `::before` yang tersekat oleh had layout.
* **Penyelesaian**: Menggantikan manipulasi element pseudo dengan element HTML fizikal `<div class="tray-bg-animation"></div>` dan menyuntik gaya animasi latar belakang secara inline (`style="..."`). Pembetulan ini telah diselaraskan pada storefront, admin simulator, dan fail script extension `sidepanel.js`.

### B. Ralat Amaran React Console SVG
* **Masalah**: Konsol React melaporkan ralat DOM tidak sah disebabkan penulisan atribut SVG seperti `stroke-linejoin`, `stroke-linecap`, dan `stroke-width` yang menggunakan sengkang.
* **Penyelesaian**: Membetulkan kesemua atribut SVG tersebut di dalam fail React halaman admin kepada format camelCase React yang sah (`strokeLinejoin`, `strokeLinecap`, dan `strokeWidth`).

---

## 3. Celah Keselamatan yang Ditutup (Security Loopholes Closed)

### A. Sekatan Log Masuk Peringkat Klien (Client-Side Access Control)
* **Masalah**: Celah keselamatan membolehkan mana-mana alamat Gmail didaftarkan secara automatik dengan kata laluan lalai `0000` sebaik sahaja mereka menaip e-mel di halaman `/admin`.
* **Penyelesaian**: Menambah kawalan kemasukan e-mel yang sah. Log masuk kini disekat hanya untuk senarai pentadbir sah yang dibenarkan: `akmaladnan009@gmail.com` dan `dummy@seeport.com`.

### B. Perlindungan API Hujung-ke-Hujung (Server-Side API Hardening)
* **Masalah**: Laluan API untuk menambah/memadam tema (`/api/themes`), mencipta/memadam kod claim (`/api/admin/codes`), dan menyimpan tetapan kedai (`/api/settings`) terdedah tanpa sebarang sekatan keselamatan. Sesiapa sahaja boleh menghantar request POST/DELETE dari luar untuk merosakkan data.
* **Penyelesaian**:
  * Membina fail pembantu [`lib/auth.js`](file:///C:/Users/kio/Desktop/SEEPORT_DEVELOPMENT/theme-store-next/lib/auth.js) untuk mengekstrak dan mengesahkan token akses JWT Supabase Bearer daripada header request.
  * Melindungi semua laluan API admin dengan mengembalikan ralat `401 Unauthorized` sekiranya token yang diberikan tidak sah atau bukan milik pentadbir yang dibenarkan.
  * Mengemas kini semua panggilan fungsi `fetch` di halaman pentadbir untuk menghantar token aktif (`Authorization: Bearer <token>`) dari sesi Supabase Auth.

---

## 4. Masalah Semasa & Perkara Tergantung (Current Problems & Open Issues)

Walaupun sistem asas telah berfungsi dengan baik dan aplikasi lulus proses kompilasi Next.js (`npm run build`), berikut adalah beberapa perkara dan risiko yang perlu diambil perhatian:

### A. Ralat Linting ESLint Masa Kompilasi
* **Status**: Amaran/Ralat ESLint terpapar semasa proses build:
  ```text
  ⨯ ESLint: Cannot find module '...eslint-config-next\core-web-vitals'
  ```
* **Kesan**: Build masih berjaya diteruskan kerana tiada ralat sintaksis kod utama, tetapi konfigurasi ESLint Next.js perlu dibetulkan jika anda mahu memastikan pemeriksaan kod yang ketat.

### B. Penyinkronan Fail Tema Manual (JSON Sync)
* **Masalah**: Tema manual seperti `halloween_theme.json` yang diletakkan di dalam folder `public/` tidak tersimpan dalam database Supabase secara lalai melainkan admin mengimportnya secara manual melalui borang admin dan menekan "Save Theme".
* **Cadangan**: Kita boleh membina satu skrip migrasi permulaan (seeding script) untuk memasukkan fail-fail JSON tema lalai terus ke database secara automatik.

### C. Sambungan Pangkalan Data Tempatan (Local DB SSL Certificate)
* **Masalah**: Tetapan pangkalan data dalam `lib/supabase.js` menggunakan arahan `ssl: { rejectUnauthorized: false }`. Ciri ini diperlukan untuk membolehkan sambungan ke Supabase DB dari persekitaran pembangunan tempatan (local), namun harus dikonfigurasikan dengan sijil SSL sebenar sebelum dibawa ke production rasmi demi mengelakkan serangan man-in-the-middle.

---
*(Laporan ini dijana pada 7 Ogos 2026).*
