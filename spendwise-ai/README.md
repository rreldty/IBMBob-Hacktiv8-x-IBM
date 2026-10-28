# SpendWise AI 💰

Aplikasi pengelolaan keuangan pribadi yang dilengkapi AI Financial Assistant. Dibangun sebagai Capstone Project Hacktiv8 × IBM.

---

## Cara Menjalankan

```bash
# Clone/buka folder project
cd spendwise-ai

# Buka di browser (tidak perlu build atau install apapun)
open index.html
# atau klik dua kali file index.html
```

> **Catatan:** Beberapa browser (Chrome/Edge) memblokir modul JS dari `file://` protokol. Gunakan server lokal sederhana:
> ```bash
> # Python 3
> python3 -m http.server 8080
> # lalu buka http://localhost:8080
>
> # Atau dengan Node.js (npx)
> npx serve .
> ```

---

## Fitur yang Diimplementasikan

### ✅ Dashboard Keuangan
- Total saldo, pemasukan, pengeluaran, dan sisa anggaran
- Filter periode: Bulan Ini, Bulan Lalu, Rentang Khusus
- Grafik tren pemasukan vs pengeluaran (Bar Chart, 6 bulan terakhir)
- Grafik distribusi pengeluaran per kategori (Donut Chart)
- Daftar 8 transaksi terbaru
- Ringkasan status anggaran per kategori

### ✅ Pengelolaan Transaksi (CRUD Lengkap)
- Tambah, edit, hapus transaksi dengan konfirmasi
- Jenis: Pemasukan, Pengeluaran, Transfer antar akun
- Validasi input lengkap (nominal positif, field wajib, tanggal valid)
- Transfer TIDAK dihitung sebagai pemasukan atau pengeluaran
- Filter: jenis, kategori, akun, rentang tanggal
- Pencarian teks (deskripsi, kategori, nominal)
- Pengurutan: tanggal terbaru/terlama, nominal terbesar/terkecil

### ✅ Pengelolaan Akun
- Tambah, edit, hapus akun (Bank, Tunai, Dompet Digital, Lainnya)
- Saldo dihitung ulang dari semua transaksi (tidak dapat dimanipulasi)
- Penghapusan akun mempertahankan riwayat transaksi
- Total saldo seluruh akun

### ✅ Pengelolaan Anggaran
- Buat anggaran per kategori per bulan
- Indikator visual: Normal (hijau), Mendekati Batas >80% (oranye), Melampaui Batas (merah)
- Deteksi duplikasi kategori dalam bulan yang sama
- Perhitungan penggunaan anggaran secara real-time

### ✅ Analisis Keuangan
- Tingkat tabungan (savings rate)
- Rata-rata pengeluaran harian
- Perbandingan bulan ini vs bulan lalu
- Grafik tren bulanan (Line Chart)
- Grafik distribusi kategori (Doughnut Chart)
- Tabel rincian pengeluaran per kategori dengan progress bar
- Pesan informatif jika data tidak cukup untuk perbandingan

### ✅ AI Financial Assistant
- Antarmuka chat dalam Bahasa Indonesia
- 8 contoh pertanyaan interaktif
- **Mode Demo (default):** Menggunakan perhitungan finansial lokal — tidak ada koneksi AI eksternal
- **Mode API (opsional):** Integrasi OpenAI GPT-4o-mini untuk respons lebih canggih
- Pertanyaan yang dijawab: pengeluaran terbesar, total pengeluaran, status anggaran, perbandingan periode, rekomendasi hemat, batas harian, rencana tabungan, ringkasan kondisi keuangan
- Transparansi penuh: Mode Demo diberi label jelas di setiap respons

### ✅ Target Tabungan
- Buat target dengan nama, nominal, jumlah terkumpul, tanggal target
- Progress ring visual per target
- Kalkulasi kebutuhan tabungan bulanan dengan asumsi yang dijelaskan
- Tampilan "Target Tercapai" saat progress 100%

### ✅ Pengaturan
- Reset ke data demonstrasi
- Hapus semua data
- Konfigurasi mode AI (Demo / API)
- Input API key dengan peringatan keamanan yang jelas
- Informasi tentang aplikasi

### ✅ UX & Desain
- Sidebar navigasi untuk desktop
- Bottom navigation untuk mobile
- Toast notifications untuk aksi berhasil/gagal
- Dialog konfirmasi untuk penghapusan
- Empty states deskriptif di semua halaman
- Banner "Mode Demo Aktif" yang terlihat jelas
- Responsif: desktop, tablet, mobile
- Data demo realistis (3 bulan transaksi, 3 akun, 6 anggaran, 2 target)

---

## Arsitektur Aplikasi

```
spendwise-ai/
├── index.html              # Entry point
└── js/
    ├── core/
    │   ├── storage.js      # localStorage abstraction
    │   ├── finance.js      # Semua kalkulasi keuangan (terpusat)
    │   ├── ui-utils.js     # Komponen UI reusable (toast, modal, dll)
    │   ├── demo-data.js    # Generator data demonstrasi
    │   └── state.js        # App state + pub/sub event system
    ├── modules/
    │   ├── dashboard.js    # Dashboard + charts
    │   ├── transactions.js # CRUD transaksi + filter
    │   ├── accounts.js     # CRUD akun
    │   ├── budgets.js      # CRUD anggaran + progress
    │   ├── analytics.js    # Analisis & charts
    │   ├── ai-assistant.js # AI chat (demo + API mode)
    │   ├── goals.js        # Target tabungan
    │   └── settings.js     # Pengaturan & data management
    └── app.js              # Router + shell (sidebar, nav)
```

### Aturan Perhitungan Keuangan

| Jenis Transaksi | Saldo Akun     | Total Pemasukan | Total Pengeluaran |
|----------------|----------------|-----------------|-------------------|
| Pemasukan       | +amount        | +amount         | tidak berubah     |
| Pengeluaran     | -amount        | tidak berubah   | +amount           |
| Transfer        | -amount (dari) | tidak berubah   | tidak berubah     |
|                | +amount (ke)   |                 |                   |

- Saldo akun = `initialBalance` + semua transaksi sejak dibuat (dihitung ulang dari semua data)
- Anggaran: hanya transaksi **pengeluaran** yang dihitung; pemasukan dan transfer diabaikan
- Transfer tidak menambah pemasukan atau pengeluaran

---

## Konfigurasi AI (Opsional)

1. Buka halaman **Pengaturan**
2. Pilih **Mode API (OpenAI)**
3. Masukkan API key OpenAI (format: `sk-...`)
4. Klik **Simpan**

> ⚠️ **Keamanan:** API key disimpan di `localStorage` browser Anda. Jangan gunakan di komputer publik atau bersama. Jangan masukkan API key langsung ke kode.

---

## Pengujian yang Disarankan

### CRUD Dasar
- [ ] Tambah transaksi pemasukan → cek saldo akun bertambah di halaman Akun
- [ ] Tambah transaksi pengeluaran → cek saldo berkurang
- [ ] Transfer dari Akun A ke Akun B → cek saldo A berkurang, B bertambah, total tidak berubah
- [ ] Edit transaksi → verifikasi semua angka diperbarui
- [ ] Hapus transaksi → verifikasi saldo dan summary diperbarui

### Validasi Input
- [ ] Coba nominal negatif → harus ditolak
- [ ] Coba transfer ke akun yang sama → harus ditolak
- [ ] Coba tanggal tidak valid → harus ditolak
- [ ] Coba simpan form kosong → harus ditolak

### Anggaran
- [ ] Buat anggaran Makanan Rp 500.000
- [ ] Tambah pengeluaran Makanan Rp 400.001 (>80%) → indikator oranye
- [ ] Tambah pengeluaran Makanan Rp 100.000 lagi → indikator merah
- [ ] Verifikasi pemasukan tidak memengaruhi anggaran

### Persistensi Data
- [ ] Tambah transaksi → reload halaman → data masih ada
- [ ] Pengaturan AI mode → reload → pengaturan tersimpan

### AI Assistant
- [ ] Tanya: "Uang saya paling banyak habis untuk apa?"
- [ ] Tanya: "Kategori mana yang melewati anggaran?"
- [ ] Tanya: "Berapa batas pengeluaran harian saya?"
- [ ] Tanya: "Bandingkan pengeluaran bulan ini dengan bulan lalu"

### Responsivitas
- [ ] Buka di mobile (atau resize browser ke <768px) → bottom nav muncul
- [ ] Buka di desktop → sidebar muncul

---

## Keterbatasan yang Diketahui

1. **Tidak ada backend** — Data disimpan di localStorage browser. Membersihkan browser storage menghapus semua data.
2. **Tidak ada ekspor/impor data** — Fitur backup belum tersedia di versi ini.
3. **AI Demo Mode** — Menggunakan keyword matching, bukan model bahasa. Pertanyaan yang kompleks atau tidak terstruktur mungkin menghasilkan jawaban fallback.
4. **Mode API** — Memerlukan API key OpenAI yang valid dan koneksi internet.
5. **Mata uang** — Hanya mendukung IDR (Rupiah) di versi ini.
6. **Tidak ada autentikasi** — Semua data tersimpan lokal tanpa perlindungan password.

---

## Teknologi

- **HTML5** — Struktur semantik
- **Tailwind CSS 3** (CDN) — Styling dan responsivitas
- **Vanilla JavaScript** (ES6+) — Logika aplikasi, tanpa framework
- **Chart.js 4** — Visualisasi data keuangan
- **localStorage** — Persistensi data
- **OpenAI API** (opsional) — AI Financial Assistant mode API
