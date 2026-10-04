// transactions.js
// Logika transaksi: tambah, edit, hapus, hitung saldo, total per kategori, validasi.
//
// Format data transaksi (disepakati kelompok):
// { id, tanggal, jenis, kategori, nominal, catatan }
//   id       : angka unik
//   tanggal  : string "YYYY-MM-DD"
//   jenis    : "pemasukan" atau "pengeluaran"
//   kategori : string, contoh "Gaji", "Makan"
//   nominal  : angka lebih dari 0
//   catatan  : string (boleh kosong)

let transactions = [];

// ---------- Validasi ----------

// Mengembalikan { valid: true } atau { valid: false, pesan: "..." }
function validateTransaction(data) {
  if (!data || typeof data !== "object") {
    return { valid: false, pesan: "Data transaksi tidak valid." };
  }

  if (data.jenis !== "pemasukan" && data.jenis !== "pengeluaran") {
    return { valid: false, pesan: "Jenis harus 'pemasukan' atau 'pengeluaran'." };
  }

  if (!data.kategori || String(data.kategori).trim() === "") {
    return { valid: false, pesan: "Kategori tidak boleh kosong." };
  }

  const nominal = Number(data.nominal);
  if (!Number.isFinite(nominal) || nominal <= 0) {
    return { valid: false, pesan: "Nominal harus berupa angka lebih dari 0." };
  }

  if (!data.tanggal || Number.isNaN(Date.parse(data.tanggal))) {
    return { valid: false, pesan: "Tanggal tidak valid." };
  }

  return { valid: true };
}

// ---------- Helper internal ----------

function generateId() {
  // id berikutnya = id terbesar + 1 (aman walau ada transaksi yang dihapus)
  return transactions.length === 0
    ? 1
    : Math.max(...transactions.map((t) => t.id)) + 1;
}

// Menyimpan data lewat storage.js (milik Anggota 3) kalau fungsinya sudah ada.
// Dengan begini transactions.js tetap jalan walau storage.js belum digabung.
function persist() {
  if (typeof saveData === "function") {
    saveData(transactions);
  }
}

// ---------- CRUD ----------

// Tambah transaksi baru. Mengembalikan { sukses, pesan, data? }
function addTransaction(data) {
  const hasil = validateTransaction(data);
  if (!hasil.valid) {
    return { sukses: false, pesan: hasil.pesan };
  }

  const transaksiBaru = {
    id: generateId(),
    tanggal: data.tanggal,
    jenis: data.jenis,
    kategori: String(data.kategori).trim(),
    nominal: Number(data.nominal),
    catatan: data.catatan ? String(data.catatan).trim() : "",
  };

  transactions.push(transaksiBaru);
  persist();
  return { sukses: true, pesan: "Transaksi berhasil ditambahkan.", data: transaksiBaru };
}

// Edit transaksi berdasarkan id. Hanya field yang dikirim yang diubah.
function editTransaction(id, perubahan) {
  const index = transactions.findIndex((t) => t.id === id);
  if (index === -1) {
    return { sukses: false, pesan: "Transaksi tidak ditemukan." };
  }

  const gabungan = { ...transactions[index], ...perubahan, id: id };
  const hasil = validateTransaction(gabungan);
  if (!hasil.valid) {
    return { sukses: false, pesan: hasil.pesan };
  }

  gabungan.kategori = String(gabungan.kategori).trim();
  gabungan.nominal = Number(gabungan.nominal);
  gabungan.catatan = gabungan.catatan ? String(gabungan.catatan).trim() : "";

  transactions[index] = gabungan;
  persist();
  return { sukses: true, pesan: "Transaksi berhasil diubah.", data: gabungan };
}

// Hapus transaksi berdasarkan id.
function deleteTransaction(id) {
  const index = transactions.findIndex((t) => t.id === id);
  if (index === -1) {
    return { sukses: false, pesan: "Transaksi tidak ditemukan." };
  }

  transactions.splice(index, 1);
  persist();
  return { sukses: true, pesan: "Transaksi berhasil dihapus." };
}

// ---------- Pengambilan data ----------

// Mengembalikan salinan semua transaksi (urut dari tanggal terbaru).
function getAll() {
  return [...transactions].sort((a, b) => b.tanggal.localeCompare(a.tanggal));
}

// Mengganti seluruh data, dipakai Anggota 3 saat loadData() dari localStorage.
function setAll(dataBaru) {
  transactions = Array.isArray(dataBaru) ? dataBaru : [];
}

// ---------- Perhitungan ----------

// Total pemasukan, pengeluaran, dan saldo.
// Bisa diberi daftar transaksi lain (misalnya hasil filter bulan oleh Anggota 3).
function getTotals(daftar = transactions) {
  let pemasukan = 0;
  let pengeluaran = 0;

  for (const t of daftar) {
    if (t.jenis === "pemasukan") pemasukan += t.nominal;
    else if (t.jenis === "pengeluaran") pengeluaran += t.nominal;
  }

  return { pemasukan, pengeluaran, saldo: pemasukan - pengeluaran };
}

// Total per kategori untuk satu jenis transaksi.
// Contoh: getByCategory("pengeluaran") -> { Makan: 75000, Transport: 20000 }
function getByCategory(jenis = "pengeluaran", daftar = transactions) {
  const hasil = {};

  for (const t of daftar) {
    if (t.jenis !== jenis) continue;
    hasil[t.kategori] = (hasil[t.kategori] || 0) + t.nominal;
  }

  return hasil;
}