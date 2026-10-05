// app.js
// Integrasi tampilan (DOM) dengan logika di transactions.js.
// Pastikan di index.html urutannya: transactions.js dulu, lalu app.js.

const formTransaksi = document.getElementById("form-transaksi");
const tbodyTransaksi = document.getElementById("tbody-transaksi");
const emptyState = document.getElementById("empty-state");
const tabelTransaksi = document.getElementById("tabel-transaksi");

// Format angka ke Rupiah
const formatRupiah = (angka) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(angka);

// Mencegah teks input dibaca sebagai HTML
const esc = (s) =>
  String(s).replace(/[&<>"']/g, (c) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  }[c]));

// Mengisi teks elemen berdasarkan id (aman kalau elemennya tidak ada)
function setText(id, teks) {
  const el = document.getElementById(id);
  if (el) el.innerText = teks;
}

// Menampilkan tabel dan ringkasan ke layar
function renderUI() {
  const semuaData = typeof getFiltered === "function" ? getFiltered() : getAll();
  const total = getTotals();

  // 1. Kartu ringkasan
  setText("total-pemasukan", formatRupiah(total.pemasukan));
  setText("total-pengeluaran", formatRupiah(total.pengeluaran));
  setText("saldo", formatRupiah(total.saldo));

  // 2. Kosongkan tabel sebelum dirender ulang
  if (tbodyTransaksi) tbodyTransaksi.innerHTML = "";

  // 3. Tampilkan atau sembunyikan tampilan kosong
  if (semuaData.length === 0) {
    if (emptyState) emptyState.hidden = false;
    if (tabelTransaksi) tabelTransaksi.hidden = true;
  } else {
    if (emptyState) emptyState.hidden = true;
    if (tabelTransaksi) tabelTransaksi.hidden = false;

    // 4. Isi tabel dengan data transaksi
    semuaData.forEach((t) => {
      const tr = document.createElement("tr");
      const isMasuk = t.jenis === "pemasukan";

      tr.innerHTML = `
        <td>${esc(t.tanggal)}</td>
        <td><span class="badge ${isMasuk ? "badge-pemasukan" : "badge-pengeluaran"}">
          ${isMasuk ? "Pemasukan" : "Pengeluaran"}
        </span></td>
        <td>${esc(t.kategori)}</td>
        <td class="num ${isMasuk ? "nominal-pemasukan" : "nominal-pengeluaran"}">
          ${formatRupiah(t.nominal)}
        </td>
        <td>${esc(t.catatan || "-")}</td>
        <td>
          <button class="btn-hapus" onclick="hapusData(${t.id})">Hapus</button>
        </td>
      `;
      if (tbodyTransaksi) tbodyTransaksi.appendChild(tr);
    });
  }

  // Panggil grafik Anggota 3 jika sudah siap
  if (typeof renderCharts === "function") renderCharts();
}

// Menangkap submit form
if (formTransaksi) {
  formTransaksi.addEventListener("submit", function (event) {
    event.preventDefault();

    const dataBaru = {
      tanggal: document.getElementById("tanggal").value,
      jenis: document.getElementById("jenis").value,
      kategori: document.getElementById("kategori").value,
      nominal: document.getElementById("nominal").value,
      catatan: document.getElementById("catatan").value,
    };

    const hasil = addTransaction(dataBaru);
    if (hasil.sukses) {
      formTransaksi.reset(); // Kosongkan form
      renderUI(); // Render ulang tampilan
      alert("Berhasil disimpan!");
    } else {
      alert("Error: " + hasil.pesan);
    }
  });
}

// Dipanggil dari tombol Hapus di tabel
window.hapusData = function (id) {
  if (confirm("Yakin ingin menghapus transaksi ini?")) {
    deleteTransaction(id);
    renderUI();
  }
};

// Render pertama kali saat halaman dibuka
renderUI();
