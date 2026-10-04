const STORAGE_KEY = 'KALKULATOR_KEUANGAN_DATA';

function loadData() {
    const rawData = localStorage.getItem(STORAGE_KEY);
    if (!rawData) return [];
    try {
        return JSON.parse(rawData);
    } catch (error) {
        console.error('Gagal membaca data dari Local Storage:', error);
        return [];
    }
}

function saveData(transactions) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
    } catch (error) {
        console.error('Gagal menyimpan data ke Local Storage:', error);
    }
}

function filterByMonth(transactions, monthYear) {
    if (!monthYear) return transactions;
    return transactions.filter(t => t.tanggal.startsWith(monthYear));
}

function exportCSV(transactions) {
    if (!transactions || transactions.length === 0) {
        alert('Tidak ada data transaksi untuk diekspor!');
        return;
    }

    const headers = ['ID', 'Tanggal', 'Jenis', 'Kategori', 'Nominal', 'Catatan'];
    const rows = transactions.map(t => [
        t.id,
        t.tanggal,
        t.jenis,
        `"${t.kategori}"`,
        t.nominal,
        `"${t.catatan ? t.catatan.replace(/"/g, '""') : ''}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' 
        + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `laporan_keuangan_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}