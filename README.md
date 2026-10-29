# UndangYa! Motion Studio Lite

> **Lightweight Browser-Based 2D Motion Invitation Editor | Localhost**
> Studio kreatif desktop lokal untuk mendesain undangan pernikahan digital adat Indonesia & modern mewah dengan animasi 2D, pratinjau live web scroll, dan ekspor website mandiri.

---

## 🌟 Fitur Utama

- **Canvas Editor 2D Terpadu**:
  - Drag, resize, rotate, dan atur opasitas objek secara visual.
  - Magnet snapping ke titik tengah kanvas (X & Y) serta margin tepi dengan garis pandu otomatis.
  - Edit teks langsung di kanvas (klik ganda pada teks).
  - Navigasi pan kanvas (tahan **Spasi + Geser Mouse**) dan zoom (**Ctrl + Scroll**).
  - Pintasan keyboard (`Delete`, `Ctrl+D` untuk duplikat, `Ctrl+Z` / `Ctrl+Y`).

- **Aset Ornamen & Flora Tradisional Indonesia (Auto-Seeded)**:
  - Vektor SVG Gunungan Wayang Emas, Botanical Arch, Batik Kawung Corner, Pembatas Mandorla, Cincin Pernikahan, dan Bunga Melati.
  - Dukungan impor file PNG transparan, JPG, WebP, dan SVG milik sendiri.
  - Penyimpanan biner aman di browser menggunakan **IndexedDB**.

- **Template Pernikahan Siap Pakai (6 Scene Lengkap)**:
  - *Pernikahan Adat Jawa Klasik* (Gunungan Wayang & Midnight Charcoal)
  - *Luxury Champagne Wedding* (Warm Gold & Editorial Serif)
  - *Emerald Green & Gold* (Hijau Botani Ningrat & Melati Emas)
  - *Velvet Maroon & Gold Adat* (Merah Marun Adat Nusantara)
  - Struktur scene: Cover Buka Undangan, Hero Mempelai, Profil Kedua Mempelai, Jadwal Akad & Resepsi, Galeri Foto, dan Doa/Penutup.

- **Studio Animasi 2D Ringan**:
  - 16 preset gerak halus (Fade In, Slide Up/Down/Left/Right, Soft Pop, Zoom In, Rotate In, Gentle Float, Gentle Sway, Slow Pulse, dsb).
  - Pengaturan durasi, delay, kurva easing, dan pengulangan (loop).
  - Efek kelopak bunga melati / serbuk emas berjatuhan (**🌸 Falling Petals**) berbasis Canvas 60 FPS.

- **Timeline Terkoordinasi**:
  - Single requestAnimationFrame loop tanpa beban CPU berlebih saat playback berhenti.
  - Scrubbing penunjuk waktu (ruler scrub) dan trek objek animasi.

- **Pratinjau Ganda (Live Preview Mode)**:
  - **Mode Web Scroll**: Menyimulasikan pengalaman pengguna di smartphone asli dengan navigasi gulir vertikal dan tombol *Buka Undangan*.
  - **Mode Timeline**: Animasi scene berurutan otomatis.
  - Pilihan viewport Mobile (390×844) dan Desktop.

- **Ekspor Website Statis Mandiri**:
  - **1-Click .ZIP**: Unduh paket website utuh (`index.html`, `styles.css`, `invitation.js`, dan folder `assets/`).
  - **Ekspor Folder Langsung**: Menulis file langsung ke folder lokal melalui File System Access API.
  - Siap di-deploy langsung ke hosting statis (Vercel, Netlify, Cloudflare Pages, cPanel, atau GitHub Pages).

---

## 🚀 Memulai (Quick Start)

### Persyaratan
- Node.js 18+
- npm 9+

### Instalasi & Menjalankan Studio

```bash
# Clone repository
git clone https://github.com/mbekgoreng/UNDANGAN-YA.git
cd UNDANGAN-YA

# Instal dependensi
npm install

# Jalankan server pengembangan
npm run dev
```

Buka browser di:
- **Lokal:** `http://localhost:3000/`
- **Jaringan Wi-Fi (Bisa diakses dari HP):** `http://[IP-Komputer]:3000/`

### Perintah Lainnya

```bash
# Build produksi
npm run build

# Preview build produksi
npm run preview
```

---

## 📁 Struktur Direktori

```
software/
├── index.html
├── package.json
├── vite.config.ts
└── src/
    ├── main.tsx
    ├── App.tsx
    ├── app/               # Context state global & autosave
    ├── assets/            # Sampel vektor ornamen Indonesia & seeder
    ├── components/
    │   ├── Toolbar/       # Toolbar atas
    │   ├── Sidebar/       # Panel tab (Aset, Lapisan, Scene, Template)
    │   ├── CanvasEditor/  # Editor kanvas 2D & interaksi
    │   ├── PropertiesPanel/# Inspektor properti konteks
    │   ├── Timeline/      # Timeline animasi gerak
    │   ├── SceneManager/  # Manajemen scene
    │   ├── Preview/       # Pratinjau interaktif
    │   └── ExportDialog/  # Dialog ekspor ZIP & folder
    ├── engine/
    │   ├── animation/     # Presets gerak & partikel kelopak bunga
    │   ├── export/        # Generator website mandiri
    │   └── scene/         # Factory template pernikahan Indonesia
    ├── schemas/           # Skema data TypeScript
    ├── storage/           # Lapisan persistensi IndexedDB (idb)
    └── styles/            # Desain antarmuka Dark Charcoal & Gold
```

---

## 📄 Lisensi

Private Creative Production Tool — Dikembangkan untuk **UndangYa!**.
