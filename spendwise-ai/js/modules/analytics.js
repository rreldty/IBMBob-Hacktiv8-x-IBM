/**
 * SpendWise AI - Analytics Module
 * Financial analysis with charts and insights.
 */

const AnalyticsModule = (() => {
  let _charts = {};

  function render() {
    const page = document.getElementById('page-analytics');
    if (!page) return;

    const transactions = AppState.get('transactions');
    const period       = AppState.currentPeriod();
    const periodTx     = AppState.periodTransactions();

    // Destroy existing charts
    Object.values(_charts).forEach(c => c && c.destroy && c.destroy());
    _charts = {};

    if (!transactions.length) {
      page.innerHTML = `<h2 class="text-lg font-bold text-gray-800 mb-4">Analisis Keuangan</h2>` + UI.emptyState('Belum ada transaksi untuk dianalisis.', '📊');
      return;
    }

    const totalIncome  = Finance.totalIncome(periodTx);
    const totalExpense = Finance.totalExpense(periodTx);
    const savingsRate  = totalIncome > 0 ? ((totalIncome - totalExpense) / totalIncome) * 100 : null;

    // Category data
    const catExpense = Finance.expenseByCategory(periodTx);
    const sortedCats = Object.entries(catExpense).sort((a, b) => b[1] - a[1]);

    // Period comparison
    const today = new Date();
    const thisFrom = Finance.firstDayOfMonth(today.getFullYear(), today.getMonth());
    const thisTo   = Finance.lastDayOfMonth(today.getFullYear(), today.getMonth());
    const lastFrom = Finance.firstDayOfMonth(today.getFullYear(), today.getMonth() - 1);
    const lastTo   = Finance.lastDayOfMonth(today.getFullYear(), today.getMonth() - 1);

    const thisTx = Finance.filterByDateRange(transactions, thisFrom, thisTo);
    const lastTx = Finance.filterByDateRange(transactions, lastFrom, lastTo);
    const thisExp = Finance.totalExpense(thisTx);
    const lastExp = Finance.totalExpense(lastTx);
    const expChange = lastExp > 0 ? ((thisExp - lastExp) / lastExp) * 100 : null;

    // Daily avg
    const dailyAvg = Finance.averageDailyExpense(transactions, period.from, period.to);

    // Monthly trends
    const trends = Finance.monthlyTrends(transactions).slice(-6);

    page.innerHTML = `
      <div class="flex flex-wrap items-center justify-between gap-3 mb-5">
        <h2 class="text-lg font-bold text-gray-800">Analisis Keuangan</h2>
        <div class="flex gap-2">
          <button onclick="AnalyticsModule.setPeriod('this_month')" 
            class="px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${period.type==='this_month' ? 'bg-[#1e3a5f] text-white border-[#1e3a5f]' : 'bg-white text-gray-600 border-gray-200'}">
            Bulan Ini
          </button>
          <button onclick="AnalyticsModule.setPeriod('last_month')"
            class="px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${period.type==='last_month' ? 'bg-[#1e3a5f] text-white border-[#1e3a5f]' : 'bg-white text-gray-600 border-gray-200'}">
            Bulan Lalu
          </button>
        </div>
      </div>

      <!-- Insight cards -->
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        ${insightCard('Total Pengeluaran', Finance.formatIDR(totalExpense), '', '#ef4444')}
        ${insightCard('Total Pemasukan', Finance.formatIDR(totalIncome), '', '#10b981')}
        ${insightCard('Rata-rata Harian', Finance.formatIDR(dailyAvg.average), `dari ${dailyAvg.days} hari`, '#06b6d4')}
        ${savingsRate !== null
          ? insightCard('Tingkat Tabungan', Finance.formatPercent(savingsRate), savingsRate >= 20 ? '✅ Baik' : savingsRate >= 10 ? '⚠️ Cukup' : '❗ Perlu perhatian', savingsRate >= 20 ? '#10b981' : savingsRate >= 10 ? '#f97316' : '#ef4444')
          : insightCard('Tingkat Tabungan', '-', 'Data tidak cukup', '#94a3b8')
        }
      </div>

      <!-- Period comparison (always uses current vs previous month) -->
      ${expChange !== null ? `
        <div class="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-6">
          <h3 class="text-sm font-semibold text-gray-700 mb-3">Perbandingan Bulan Ini vs Bulan Lalu</h3>
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
            ${comparisonCard('Bulan Lalu', lastExp, '#6b7280')}
            ${comparisonCard('Bulan Ini', thisExp, '#ef4444')}
            <div class="flex flex-col items-center justify-center p-4 rounded-xl ${expChange > 0 ? 'bg-red-50' : 'bg-emerald-50'}">
              <p class="text-xs font-medium ${expChange > 0 ? 'text-red-500' : 'text-emerald-600'} mb-1">Perubahan</p>
              <p class="text-2xl font-bold ${expChange > 0 ? 'text-red-500' : 'text-emerald-600'}">${expChange > 0 ? '+' : ''}${Finance.formatPercent(expChange)}</p>
              <p class="text-xs text-gray-400 mt-1">${expChange > 0 ? 'Pengeluaran naik' : 'Pengeluaran turun'}</p>
            </div>
          </div>
        </div>
      ` : `
        <div class="bg-blue-50 border border-blue-200 rounded-2xl p-4 mb-6 text-sm text-blue-700">
          ℹ️ Data bulan lalu tidak tersedia. Perbandingan antarperiode memerlukan setidaknya dua bulan data transaksi.
        </div>
      `}

      <!-- Charts row -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <!-- Monthly trend -->
        <div class="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h3 class="text-sm font-semibold text-gray-700 mb-4">Tren Bulanan (6 bulan terakhir)</h3>
          <div class="relative h-56">
            <canvas id="an-trend-chart"></canvas>
          </div>
        </div>
        <!-- Category pie -->
        <div class="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h3 class="text-sm font-semibold text-gray-700 mb-4">Distribusi Pengeluaran per Kategori</h3>
          <div class="relative h-56">
            <canvas id="an-cat-chart"></canvas>
          </div>
        </div>
      </div>

      <!-- Category table -->
      <div class="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <h3 class="text-sm font-semibold text-gray-700 mb-4">Rincian Pengeluaran per Kategori</h3>
        ${sortedCats.length ? categoryTable(sortedCats, totalExpense) : UI.emptyState('Belum ada pengeluaran di periode ini', '📉')}
      </div>
    `;

    // Init charts after DOM update
    requestAnimationFrame(() => initCharts(trends, periodTx, sortedCats));
  }

  function insightCard(label, value, sub, color) {
    return `
      <div class="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
        <p class="text-xs text-gray-500 font-medium mb-1">${label}</p>
        <p class="text-lg font-bold text-gray-800">${value}</p>
        ${sub ? `<p class="text-xs mt-1" style="color:${color}">${sub}</p>` : ''}
      </div>`;
  }

  function comparisonCard(label, value, color) {
    return `
      <div class="flex flex-col items-center justify-center p-4 rounded-xl bg-gray-50">
        <p class="text-xs font-medium text-gray-500 mb-1">${label}</p>
        <p class="text-xl font-bold" style="color:${color}">${Finance.formatIDR(value)}</p>
      </div>`;
  }

  function categoryTable(sortedCats, total) {
    return `
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="text-left text-xs text-gray-400 border-b border-gray-50">
              <th class="pb-2 pr-4 font-medium">Kategori</th>
              <th class="pb-2 pr-4 font-medium text-right">Jumlah</th>
              <th class="pb-2 font-medium text-right">Persentase</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-50">
            ${sortedCats.map(([cat, amt]) => {
              const pct = total > 0 ? (amt / total) * 100 : 0;
              return `
                <tr class="hover:bg-gray-50 transition-colors">
                  <td class="py-2.5 pr-4">
                    <div class="flex items-center gap-2">
                      <span class="w-2.5 h-2.5 rounded-full flex-shrink-0" style="background:${UI.getCategoryColor(cat)}"></span>
                      <span>${UI.getCategoryIcon(cat)} ${cat}</span>
                    </div>
                  </td>
                  <td class="py-2.5 pr-4 text-right font-medium text-red-500">${Finance.formatIDR(amt)}</td>
                  <td class="py-2.5 text-right">
                    <div class="flex items-center justify-end gap-2">
                      <div class="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div class="h-full rounded-full" style="width:${pct}%; background:${UI.getCategoryColor(cat)}"></div>
                      </div>
                      <span class="text-xs text-gray-500 w-10 text-right">${Finance.formatPercent(pct)}</span>
                    </div>
                  </td>
                </tr>`;
            }).join('')}
          </tbody>
        </table>
      </div>`;
  }

  function initCharts(trends, periodTx, sortedCats) {
    // Trend line chart
    const trendEl = document.getElementById('an-trend-chart');
    if (trendEl && window.Chart) {
      if (_charts.trend) _charts.trend.destroy();
      _charts.trend = new Chart(trendEl, {
        type: 'line',
        data: {
          labels: trends.map(t => Finance.formatMonth(t.month)),
          datasets: [
            {
              label: 'Pemasukan',
              data: trends.map(t => t.income),
              borderColor: '#10b981',
              backgroundColor: '#10b98115',
              tension: 0.4,
              fill: true,
              pointRadius: 4,
            },
            {
              label: 'Pengeluaran',
              data: trends.map(t => t.expense),
              borderColor: '#ef4444',
              backgroundColor: '#ef444415',
              tension: 0.4,
              fill: true,
              pointRadius: 4,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { position: 'top', labels: { boxWidth: 12, font: { size: 11 } } } },
          scales: {
            y: { ticks: { callback: v => Finance.formatIDR(v, true), font: { size: 10 } }, grid: { color: '#f1f5f9' } },
            x: { ticks: { font: { size: 10 } }, grid: { display: false } },
          },
        },
      });
    }

    // Category doughnut
    const catEl = document.getElementById('an-cat-chart');
    const cats  = sortedCats.slice(0, 8);
    if (catEl && window.Chart && cats.length) {
      if (_charts.cat) _charts.cat.destroy();
      _charts.cat = new Chart(catEl, {
        type: 'doughnut',
        data: {
          labels: cats.map(([c]) => c),
          datasets: [{
            data: cats.map(([, v]) => v),
            backgroundColor: cats.map(([c]) => UI.getCategoryColor(c) + 'cc'),
            borderColor: cats.map(([c]) => UI.getCategoryColor(c)),
            borderWidth: 1.5,
          }],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          cutout: '60%',
          plugins: {
            legend: { position: 'bottom', labels: { boxWidth: 10, font: { size: 10 }, padding: 6 } },
            tooltip: { callbacks: { label: ctx => ` ${Finance.formatIDR(ctx.parsed)}` } },
          },
        },
      });
    } else if (catEl && !cats.length) {
      catEl.closest('.relative').innerHTML = UI.emptyState('Tidak ada pengeluaran di periode ini', '📉');
    }
  }

  return {
    render,
    setPeriod(type) {
      AppState.setPeriod(type);
      render();
    },
  };
})();
