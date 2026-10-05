// chart.js
// Grafik dengan library Chart.js (dimuat lewat CDN di index.html):
//   1. Pie: pengeluaran per kategori           -> <canvas id="chart-kategori">
//   2. Bar: pemasukan vs pengeluaran per bulan -> <canvas id="chart-ringkasan">
//
// Dipanggil otomatis oleh renderUI() di app.js lewat renderCharts().
// Urutan <script> di index.html: transactions.js -> storage.js -> chart.js -> app.js

let pieChartInstance = null;
let barChartInstance = null;

const WARNA_KATEGORI = {
    Makanan: '#e0a94b',
    Transportasi: '#4f81bd',
    Belanja: '#c0504d',
    Tagihan: '#8c6bb1',
    Hiburan: '#e07b53',
    Lainnya: '#7f8c8d',
    Gaji: '#2f7d5b',
    'Uang saku': '#6aa84f'
};
const WARNA_CADANGAN = ['#4dc9f6', '#f67019', '#f53794', '#537bc4', '#acc236', '#166a8f'];

const formatRupiahGrafik = (angka) =>
    new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        maximumFractionDigits: 0
    }).format(angka);

// Total pengeluaran per kategori
// (diberi nama berbeda dari getByCategory di transactions.js supaya tidak bentrok)
function hitungPerKategori(transactions) {
    return transactions
        .filter(t => t.jenis === 'pengeluaran')
        .reduce((acc, curr) => {
            const cat = curr.kategori || 'Lain-lain';
            acc[cat] = (acc[cat] || 0) + Number(curr.nominal);
            return acc;
        }, {});
}

// Total pemasukan dan pengeluaran per bulan, contoh: { "2026-10": { pemasukan, pengeluaran } }
function getMonthlyOverview(transactions) {
    const overview = {};
    transactions.forEach(t => {
        const month = t.tanggal.slice(0, 7);
        if (!overview[month]) {
            overview[month] = { pemasukan: 0, pengeluaran: 0 };
        }
        if (t.jenis === 'pemasukan') {
            overview[month].pemasukan += Number(t.nominal);
        } else if (t.jenis === 'pengeluaran') {
            overview[month].pengeluaran += Number(t.nominal);
        }
    });
    return overview;
}

// Menampilkan tulisan "Belum ada data" saat grafik kosong
const pluginKosongGrafik = {
    id: 'kosongGrafik',
    afterDraw(chart) {
        const ada = chart.data.datasets.some(d => d.data.some(v => v > 0));
        if (ada) return;

        const { ctx, width, height } = chart;
        ctx.save();
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.font = '14px sans-serif';
        ctx.fillStyle = '#6b7280';
        ctx.fillText('Belum ada data', width / 2, height / 2);
        ctx.restore();
    }
};

function renderPieChart(canvasId, transactions) {
    const ctx = document.getElementById(canvasId);
    if (!ctx) return;

    const categoryData = hitungPerKategori(transactions);
    const labels = Object.keys(categoryData);
    const data = Object.values(categoryData);
    const warna = labels.map((k, i) => WARNA_KATEGORI[k] || WARNA_CADANGAN[i % WARNA_CADANGAN.length]);

    if (pieChartInstance) pieChartInstance.destroy();

    pieChartInstance = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: warna,
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: { display: true, text: 'Pengeluaran per Kategori' },
                legend: { position: 'bottom' },
                tooltip: {
                    callbacks: {
                        label: (c) => c.label + ': ' + formatRupiahGrafik(c.parsed)
                    }
                }
            }
        },
        plugins: [pluginKosongGrafik]
    });
}

function renderBarChart(canvasId, transactions) {
    const ctx = document.getElementById(canvasId);
    if (!ctx) return;

    const monthlyData = getMonthlyOverview(transactions);
    const months = Object.keys(monthlyData).sort();
    const incomeData = months.map(m => monthlyData[m].pemasukan);
    const expenseData = months.map(m => monthlyData[m].pengeluaran);

    if (barChartInstance) barChartInstance.destroy();

    barChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: months,
            datasets: [
                { label: 'Pemasukan', data: incomeData, backgroundColor: '#2ec4b6', borderRadius: 4 },
                { label: 'Pengeluaran', data: expenseData, backgroundColor: '#e71d36', borderRadius: 4 }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: { callback: (v) => formatRupiahGrafik(v) }
                }
            },
            plugins: {
                title: { display: true, text: 'Pemasukan vs Pengeluaran per Bulan' },
                tooltip: {
                    callbacks: {
                        label: (c) => c.dataset.label + ': ' + formatRupiahGrafik(c.parsed.y)
                    }
                }
            }
        },
        plugins: [pluginKosongGrafik]
    });
}

// Dipanggil oleh renderUI() di app.js
function renderCharts() {
    if (typeof Chart === 'undefined') {
        console.warn('Library Chart.js belum dimuat, grafik dilewati.');
        return;
    }

    // Pie mengikuti filter Bulan; bar menampilkan semua bulan untuk dibandingkan
    const dataBulan = typeof getFiltered === 'function'
        ? getFiltered({ hanyaBulan: true })
        : getAll();

    renderPieChart('chart-kategori', dataBulan);
    renderBarChart('chart-ringkasan', getAll());
}
