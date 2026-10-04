let pieChartInstance = null;
let barChartInstance = null;

function getByCategory(transactions) {
    return transactions.reduce((acc, curr) => {
        const cat = curr.kategori || 'Lain-lain';
        acc[cat] = (acc[cat] || 0) + Number(curr.nominal);
        return acc;
    }, {});
}

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

function renderPieChart(canvasId, transactions) {
    const ctx = document.getElementById(canvasId);
    if (!ctx) return;

    const categoryData = getByCategory(transactions);
    const labels = Object.keys(categoryData);
    const data = Object.values(categoryData);

    if (pieChartInstance) pieChartInstance.destroy();

    pieChartInstance = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: ['#4dc9f6', '#f67019', '#f53794', '#537bc4', '#acc236', '#166a8f']
            }]
        },
        options: {
            responsive: true,
            plugins: {
                title: { display: true, text: 'Pengeluaran/Pemasukan per Kategori' }
            }
        }
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
                { label: 'Pemasukan', data: incomeData, backgroundColor: '#2ec4b6' },
                { label: 'Pengeluaran', data: expenseData, backgroundColor: '#e71d36' }
            ]
        },
        options: {
            responsive: true,
            scales: { y: { beginAtZero: true } },
            plugins: {
                title: { display: true, text: 'Perbandingan Pemasukan & Pengeluaran per Bulan' }
            }
        }
    });
}