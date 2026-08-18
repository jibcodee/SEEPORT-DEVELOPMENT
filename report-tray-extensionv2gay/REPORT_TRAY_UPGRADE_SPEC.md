# 🛠️ Report Tray — Upgrade Spec untuk AI Coding Agent

## Konteks Projek

Extension sedia ada: **Report Tray** (Chrome/Edge, Manifest V3). Fungsi asal: user right-click → "Add selection / Add image / Add link / Add this page" → data simpan dalam `chrome.storage.local` → papar dalam side panel → export sebagai Markdown / Plain Text / CSV.

Fail sedia ada:
- `manifest.json`
- `background.js` — service worker, context menu, capture logic, badge counter
- `sidepanel.html` — struktur UI panel
- `sidepanel.css` — styling
- `sidepanel.js` — render item, live-update via `chrome.storage.onChanged`, export functions (`buildMarkdown()`, `buildPlainText()`, `buildCsv()`)
- `icons/` — 16/48/128px

## Objektif Upgrade

Tukar Report Tray dari "collect → export file" jadi **"collect → paste terus ke Google Sheets / Excel Web / Google Docs / Word Web / Google Slides / PowerPoint Web / Canva"** guna Clipboard API dan (secondary) native Drag & Drop — tanpa perlu export/download fail dulu.

Tiga ciri utama yang kena dibina, dalam susunan keutamaan ini:

---

## 1️⃣ PRIORITI TINGGI — Copy-to-Clipboard Multi-Format (per-card & bulk)

### Masalah semasa
Item cuma boleh di-export secara bulk ke fail (Markdown/CSV/Text). Tiada cara cepat untuk copy **satu item** atau **beberapa item terpilih** terus ke clipboard dalam format yang serasi dengan Google/Microsoft apps.

### Keperluan fungsian

Tambah butang **"Copy"** pada setiap card dalam `sidepanel.js`, dan butang **"Copy Selected"** untuk multi-select. Setiap copy action kena hantar **berbilang MIME type serentak** dalam satu `ClipboardItem`, supaya app destinasi pilih format yang paling sesuai:

| Jenis Item | Format yang dihantar |
|---|---|
| Teks (selection) | `text/plain` + `text/html` (paragraph biasa) |
| Gambar | `image/png` (blob sebenar) + `text/plain` (caption/alt text) |
| Pautan (link) | `text/html` (`<a href>`) + `text/plain` (URL biasa) |
| **Jadual (table)** | `text/html` (struktur `<table><tr><td>`) + `text/plain` (TSV — tab-separated) |

### Kod rujukan — `buildClipboardPayload()`

```javascript
// Untuk teks/link biasa
async function copyTextItem(item) {
  const html = item.type === 'link'
    ? `<a href="${item.url}">${item.text || item.url}</a>`
    : `<p>${item.text}</p>`;
  const plain = item.type === 'link' ? item.url : item.text;

  await navigator.clipboard.write([
    new ClipboardItem({
      'text/html': new Blob([html], { type: 'text/html' }),
      'text/plain': new Blob([plain], { type: 'text/plain' })
    })
  ]);
}

// Untuk gambar — WAJIB blob sebenar, bukan URL string
async function copyImageItem(item) {
  const response = await fetch(item.imageBlobUrl); // guna blob yang disimpan, bukan hotlink asal
  const blob = await response.blob();
  await navigator.clipboard.write([
    new ClipboardItem({ 'image/png': blob })
  ]);
}

// Untuk JADUAL — ini yang bagi table paste ke Sheets/Excel jadi cells
function buildTableClipboard(rows) {
  // rows = array of arrays, cth: [["Nama","Harga"],["Item A","10"]]
  const html = `<table>${rows.map(r =>
    `<tr>${r.map(cell => `<td>${cell}</td>`).join('')}</tr>`
  ).join('')}</table>`;

  const tsv = rows.map(r => r.join('\t')).join('\n');

  return new ClipboardItem({
    'text/html': new Blob([html], { type: 'text/html' }),
    'text/plain': new Blob([tsv], { type: 'text/plain' })
  });
}

async function copyTableItem(rows) {
  await navigator.clipboard.write([buildTableClipboard(rows)]);
}
```

### Task list untuk agent
- [ ] Tambah UI button "📋 Copy" pada setiap card template dalam `sidepanel.js` (fungsi render card sedia ada).
- [ ] Tambah checkbox multi-select pada setiap card + butang "Copy Selected" di footer.
- [ ] Bila copy "Selected" dan campuran jenis (teks + gambar + table), gabungkan semua text/html jadi satu blok berturutan (imej tak boleh digabung dalam satu clipboard write bersama teks lain — kena beri amaran/copy satu-satu jika ada gambar dalam selection).
- [ ] Bila `background.js` capture jadual (`<table>` element) dari context menu "Add this page" atau selection meliputi table, simpan struktur row/column penuh (array of arrays) dalam storage, bukan flatten jadi teks.
- [ ] Tunjuk toast/notification "✅ Disalin! Sedia untuk paste (Ctrl+V)" lepas copy berjaya.

---

## 2️⃣ PRIORITI TINGGI — Auto-Screenshot ke Tray

### Masalah semasa
Tiada cara screenshot direct dari browser masuk tray — cuma boleh capture gambar yang dah wujud dalam DOM.

### Had teknikal penting (WAJIB baca sebelum implement)
- Chrome **tidak membenarkan** screenshot automatik tanpa trigger user (sebab privasi). Kena ada action eksplisit: klik icon / keyboard shortcut / button dalam side panel.
- `chrome.tabs.captureVisibleTab()` hanya capture **apa yang visible dalam viewport**, bukan full-page scroll. Full-page capture perlu scroll+stitch (lebih kompleks, boleh jadi fasa 2).

### Keperluan fungsian
1. Tambah keyboard shortcut (`chrome.commands` dalam manifest) — cadangan default `Ctrl+Shift+S` / `Cmd+Shift+S`.
2. Tambah butang "📷 Screenshot" dalam `sidepanel.html` sebagai alternatif shortcut.
3. Bila trigger: capture visible tab → simpan terus sebagai item baru dalam tray (jenis `screenshot`) → auto muncul dalam list (guna `storage.onChanged` yang sedia ada).

### Kod rujukan

**`manifest.json`** — tambah:
```json
"permissions": ["storage", "contextMenus", "sidePanel", "activeTab", "tabs"],
"commands": {
  "capture-screenshot": {
    "suggested_key": { "default": "Ctrl+Shift+S", "mac": "Command+Shift+S" },
    "description": "Screenshot visible tab ke Report Tray"
  }
}
```

**`background.js`** — tambah listener:
```javascript
chrome.commands.onCommand.addListener((command) => {
  if (command === 'capture-screenshot') captureScreenshot();
});

async function captureScreenshot() {
  const dataUrl = await chrome.tabs.captureVisibleTab(null, { format: 'png' });
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  const item = {
    id: crypto.randomUUID(),
    type: 'screenshot',
    imageDataUrl: dataUrl, // simpan base64 PNG
    sourceTitle: tab.title,
    sourceUrl: tab.url,
    timestamp: Date.now()
  };

  await saveItemToStorage(item); // guna IndexedDB — rujuk bahagian 3
  updateBadgeCount();
}
```

Bila user klik icon extension (bukan shortcut), boleh juga panggil `captureScreenshot()` terus dari `chrome.action.onClicked` — tapi pastikan `sidePanel` masih boleh dibuka (guna context menu icon berasingan jika perlu, supaya klik icon tak konflik antara "buka panel" vs "screenshot").

### Task list untuk agent
- [ ] Tambah `activeTab` + `tabs` permission dalam `manifest.json`.
- [ ] Tambah `commands` block dengan keyboard shortcut.
- [ ] Implement `captureScreenshot()` dalam `background.js`.
- [ ] Tambah butang screenshot dalam `sidepanel.html` yang hantar message ke background untuk trigger capture yang sama.
- [ ] Render card jenis `screenshot` dalam `sidepanel.js` (guna thumbnail preview dari `imageDataUrl`).
- [ ] Screenshot item juga boleh guna `copyImageItem()` dari bahagian 1 untuk paste ke Slides/Canva/Docs.

---

## 3️⃣ PRIORITI SEDERHANA — Migrate Storage ke IndexedDB

### Sebab perlu
`chrome.storage.local` ada had saiz dan tak optimum untuk simpan banyak base64 image (screenshot + gambar capture). IndexedDB lebih sesuai untuk blob/binary data besar.

### Task list untuk agent
- [ ] Cipta module `db.js` guna library ringan macam `idb` (via npm/CDN) atau native IndexedDB API.
- [ ] Simpan struktur: `{ id, type, content, imageBlob, sourceUrl, sourceTitle, timestamp }`.
- [ ] Migrate fungsi `saveItemToStorage()`, `getAllItems()`, `deleteItem()`, `clearAll()` dari `chrome.storage.local` ke IndexedDB.
- [ ] **Kekalkan** `chrome.storage.local` HANYA untuk metadata kecil (contoh: jumlah item untuk badge count), supaya `chrome.storage.onChanged` listener still boleh trigger live-update UI — atau tukar ke custom event/message passing antara `background.js` dan `sidepanel.js` bila IndexedDB berubah.

---

## 4️⃣ PRIORITI RENDAH (Fasa 2 / Nice-to-have) — Native Drag & Drop

Selepas ciri 1–3 siap dan stabil, boleh tambah HTML5 Drag & Drop sebagai alternatif kepada Copy button (bukan pengganti — sebab drag & drop tak reliable pada semua app canvas-based seperti Sheets/Slides).

- [ ] Tambah `draggable="true"` pada setiap card.
- [ ] Dalam `dragstart`, set multiple `dataTransfer` format serentak: `text/plain`, `text/html`, dan untuk gambar guna format `DownloadURL` (`"image/png:filename.png:<blob-url>"`).
- [ ] **Wajib test manual** kat setiap target app (Google Sheets, Excel Web, Docs, Word Web, Slides, PowerPoint Web, Canva) sebab behaviour drop-handler berbeza-beza — jangan assume ia berfungsi tanpa test sebenar.

---

## Ringkasan Susunan Kerja (untuk agent ikut secara berurutan)

1. Bina `copyTextItem()`, `copyImageItem()`, `copyTableItem()` + UI button Copy — **test dengan paste ke Google Sheets & Google Docs dulu** sebelum sambung.
2. Bina `captureScreenshot()` + shortcut + UI button — test screenshot muncul dalam tray & boleh di-copy guna fungsi dari langkah 1.
3. Migrate storage ke IndexedDB supaya boleh handle banyak gambar/screenshot tanpa had saiz.
4. (Optional, lepas semua stabil) Tambah drag & drop sebagai enhancement tambahan.

## Nota Penting untuk Agent
- Jangan strip struktur HTML jadual jadi plain text semasa capture — table paste ke Sheets/Excel bergantung sepenuhnya pada `<table><tr><td>` yang utuh.
- Gambar WAJIB disimpan sebagai blob/base64 semasa capture (fetch terus dari `imageUrl`), bukan simpan link URL asal sahaja — link boleh broken/CORS-blocked bila nak di-copy kemudian.
- Sentiasa uji `navigator.clipboard.write()` dalam context yang ada user gesture (button click) — Clipboard API akan gagal senyap-senyap jika dipanggil tanpa user interaction langsung.
