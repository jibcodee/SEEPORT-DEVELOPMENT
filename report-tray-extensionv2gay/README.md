# 📥 Report Tray Extension

Report Tray ialah sebuah **Extension Pelayar Web (Google Chrome / Microsoft Edge)** yang direka untuk memudahkan pengumpulan maklumat semasa melayari web. Ia membolehkan pengguna mengumpul teks, gambar, dan pautan ke dalam satu "dulang" (tray) khas, dan kemudian mengeksport semuanya sekaligus untuk tujuan pelaporan atau dokumentasi.

---

## 🛠️ Senibina & Komponen Sistem

Sistem ini terdiri daripada beberapa fail utama yang memainkan peranan masing-masing:

### 1. `manifest.json`
Fail konfigurasi utama untuk extension ini (Manifest V3). Ia mengisytiharkan:
- **Nama dan versi** extension.
- **Permintaan akses (permissions)** yang diperlukan:
  - `storage`: Untuk menyimpan data yang dikumpul secara lokal (dalam browser).
  - `contextMenus`: Untuk menambah pilihan pada menu *right-click*.
  - `sidePanel`: Untuk membenarkan penggunaan ciri *Side Panel* Chrome.
- **Fail Background**: Menetapkan `background.js` sebagai *service worker*.
- **Tindakan (Action)**: Mengikat ikon extension dengan antaramuka *Side Panel*.

### 2. `background.js` (Otak / Background Service)
Fail ini berjalan di latar belakang (background) dan mengendalikan logik utama semasa pengguna melayari web:
- **Penciptaan Context Menu**: Menambah menu "Add selection", "Add image", "Add link", dan "Add this page" apabila pengguna *right-click*.
- **Pemprosesan Data**: Apabila pengguna memilih menu tersebut, fail ini akan mengambil data yang dipilih (teks, URL gambar, atau pautan web) beserta tajuk dan URL sumber.
- **Penyimpanan**: Menyimpan data yang dikumpul ke dalam `chrome.storage.local`.
- **Lencana (Badge)**: Mengemaskini nombor pada ikon extension untuk menunjukkan jumlah item yang telah dikumpul.

### 3. `sidepanel.html` (Struktur Antaramuka)
Merupakan rangka UI (User Interface) untuk panel sisi. Ia mengandungi:
- **Header**: Tajuk dan jumlah item.
- **Kawasan Kosong (Empty State)**: Paparan ilustrasi jika tray kosong.
- **Senarai Item (`<ul id="itemsList">`)**: Ruang di mana kad-kad maklumat yang dikumpul akan dijana.
- **Footer (Butang Eksport)**: Butang-butang untuk mengeksport data (Markdown, Teks Biasa, CSV) dan butang untuk mengosongkan tray.

### 4. `sidepanel.css` (Gaya / Styling)
Fail yang mengawal kecantikan dan susun atur `sidepanel.html`. Ia menggunakan pembolehubah CSS untuk tema warna, menjadikan antaramuka nampak moden dan kemas.

### 5. `sidepanel.js` (Logik Antaramuka)
Fail ini mengawal interaktiviti di dalam *Side Panel*:
- **Pengambilan Data**: Membaca data yang disimpan dari `chrome.storage.local` dan memaparkannya ke skrin.
- **Live-update**: Mendengar sebarang perubahan pada *storage* (melalui `chrome.storage.onChanged`) supaya panel dikemaskini secara automatik jika pengguna menambah item baharu.
- **Membina UI (DOM Manipulation)**: Mencipta kad (card) HTML untuk setiap item (Sama ada Teks, Gambar, atau Pautan).
- **Fungsi Eksport**:
  - `buildMarkdown()`: Menukar data kepada format Markdown.
  - `buildPlainText()`: Menukar data kepada teks biasa yang bernombor.
  - `buildCsv()`: Menukar data kepada jadual CSV berserta fungsi muat turun fail.

### 6. Folder `icons/`
Mengandungi ikon grafik extension dalam pelbagai saiz (16x16, 48x48, 128x128 piksel) yang dipaparkan di menu Chrome dan toolbar.

---

## 🚀 Cara Pemasangan (Developer Mode)

Oleh kerana projek ini adalah kod sumber terbuka (unpacked), ia dipasang secara manual:

1. Buka pelayar **Google Chrome** atau **Microsoft Edge**.
2. Pergi ke `chrome://extensions/` (atau `edge://extensions/`).
3. Hidupkan suis **Developer mode** di penjuru atas kanan.
4. Klik butang **Load unpacked** di bahagian kiri atas.
5. Pilih folder `report-collector` (pastikan anda memilih folder yang mengandungi fail `manifest.json`, bukannya folder `icons`).
6. Extension kini sedia untuk digunakan!

---

## 💡 Cara Penggunaan

1. **Simpan Maklumat**: Semasa membaca artikel atau melayari web, *highlight* teks, klik kanan, dan pilih **"Add selection to Report Tray"**. Perkara yang sama boleh dilakukan ke atas gambar dan pautan (link).
2. **Lihat Tray**: Klik ikon Report Tray di penjuru atas kanan browser. Panel sisi akan terbuka memaparkan semua item yang telah anda kumpulkan.
3. **Urus & Buang**: Anda boleh klik butang pangkah (✕) pada mana-mana item yang tidak diperlukan lagi.
4. **Eksport**: Di bahagian bawah panel, pilih salah satu format eksport:
   - **Salin sebagai Markdown**: Sesuai jika anda menggunakan perisian seperti Notion, Obsidian, atau GitHub.
   - **Salin sebagai Teks**: Teks ringkas dan biasa.
   - **Muat turun CSV**: Sesuai untuk dibuka di dalam Microsoft Excel atau Google Sheets.
