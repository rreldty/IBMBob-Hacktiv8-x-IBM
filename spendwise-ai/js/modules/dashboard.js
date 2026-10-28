/**
 * SpendWise AI - Dashboard Module
 */

const DashboardModule = (() => {
  let _incomeExpenseChart = null;
  let _categoryChart = null;

  function render() {
    const page = document.getElementById('page-dashboard');
    if (!page) return;

    const transactions = AppState.get('transactions');
    const accounts     = AppState.get('accounts');
    const budgets      = AppState.get('budgets');
    const period       = AppState.currentPeriod();
    const periodTx     = AppState.periodTransactions();
    const isDemoMode   = AppState.get('isDemoMode');

    const totalBalance = Finance.totalBalance(accounts, transactions);
    const totalIncome  = Finance.totalIncome(periodTx);
    const totalExpense = Finance.totalExpense(periodTx);
    const netFlow      = totalIncome - totalExpense;

    // Budget remaining
    const currentMonth = AppState.currentMonthString();
    const monthBudgets = budgets.filter(b => b.month === currentMonth);
    const totalBudgeted = monthBudgets.reduce((s, b) => s + b.amount, 0);
    const budgetUsed    = periodTx.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
    const budgetRemaining = totalBudgeted - budgetUsed;

    const recentTx = [...transactions]
      .sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id))
      .slice(0, 8);

    page.innerHTML = `
      ${isDemoMode ? `<div class="mb-4 px-4 py-2 bg-amber-50 border border-amber-300 rounded-xl text-amber-700 text-sm flex items-center gap-2">
        <svg class="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
        <span><strong>Mode Demo Aktif</strong> — Data yang ditampilkan adalah contoh ilustrasi. <button onclick="AppState.navigate('settings')" class="underline font-medium">Kelola data di Pengaturan</button></span>
      </div>` : ''}

      <!-- Period filter -->
      <div class="flex flex-wrap gap-2 mb-6">
        <button onclick="DashboardModule.setPeriod('this_month')" 
          class="period-btn px-4 py-1.5 rounded-full text-sm font-medium border transition-all ${period.type === 'this_month' ? 'bg-navy-600 text-white border-navy-600 bg-[#1e3a5f]' : 'bg-white text-gray-600 border-gray-200 hover:border-navy-300'}">
          Bulan Ini
        </button>
        <button onclick="DashboardModule.setPeriod('last_month')" 
          class="period-btn px-4 py-1.5 rounded-full text-sm font-medium border transition-all ${period.type === 'last_month' ? 'bg-[#1e3a5f] text-white border-[#1e3a5f]' : 'bg-white text-gray-600 border-gray-200 hover:border-navy-300'}">
          Bulan Lalu
        </button>
        <button onclick="DashboardModule.showCustomPeriod()" 
          class="period-btn px-4 py-1.5 rounded-full text-sm font-medium border transition-all ${period.type === 'custom' ? 'bg-[#1e3a5f] text-white border-[#1e3a5f]' : 'bg-white text-gray-600 border-gray-200 hover:border-navy-300'}">
          Rentang Khusus
        </button>
        ${period.type === 'custom' ? `<span class="self-center text-xs text-gray-500">${Finance.formatDate(period.from)} – ${Finance.formatDate(period.to)}</span>` : ''}
      </div>

      <!-- Summary cards -->
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        ${summaryCard('Total Saldo', totalBalance, 'balance', '#1e3a5f')}
        ${summaryCard('Pemasukan', totalIncome, 'income', '#10b981')}
        ${summaryCard('Pengeluaran', totalExpense, 'expense', '#ef4444')}
        ${summaryCard(totalBudgeted > 0 ? 'Sisa Anggaran' : 'Arus Kas Bersih', totalBudgeted > 0 ? budgetRemaining : netFlow, totalBudgeted > 0 ? 'budget' : 'net', netFlow >= 0 ? '#06b6d4' : '#f97316')}
      </div>

      <!-- Charts row -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <div class="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <h3 class="text-sm font-semibold text-gray-700 mb-4">Tren Pemasukan & Pengeluaran</h3>
          <div class="relative h-56">
            <canvas id="income-expense-chart"></canvas>
          </div>
        </div>
        <div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <h3 class="text-sm font-semibold text-gray-700 mb-4">Distribusi Pengeluaran</h3>
          <div class="relative h-56">
            <canvas id="category-chart"></canvas>
          </div>
        </div>
      </div>

      <!-- Bottom row: recent transactions + budget summary -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div class="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-sm font-semibold text-gray-700">Transaksi Terbaru</h3>
            <button onclick="AppState.navigate('transactions')" class="text-xs text-[#1e3a5f] font-medium hover:underline">Lihat semua →</button>
          </div>
          ${recentTransactionsList(recentTx, accounts)}
        </div>
        <div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-sm font-semibold text-gray-700">Ringkasan Anggaran</h3>
            <button onclick="AppState.navigate('budgets')" class="text-xs text-[#1e3a5f] font-medium hover:underline">Kelola →</button>
          </div>
          ${budgetSummary(monthBudgets, periodTx)}
        </div>
      </div>

      <!-- Custom period modal -->
      <div id="custom-period-modal" class="hidden fixed inset-0 bg-black/40 z-50 items-center justify-center" data-modal>
        <div class="bg-white rounded-2xl p-6 w-full max-w-sm mx-4 shadow-xl">
          <h3 class="text-base font-semibold mb-4 text-gray-800">Pilih Rentang Tanggal</h3>
          <div class="space-y-3">
            <div>
              <label class="block text-xs font-medium text-gray-600 mb-1">Dari</label>
              <input type="date" id="custom-from" class="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]">
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-600 mb-1">Sampai</label>
              <input type="date" id="custom-to" class="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]">
            </div>
          </div>
          <div class="flex gap-3 mt-5">
            <button onclick="UI.closeModal('custom-period-modal')" class="flex-1 btn-secondary">Batal</button>
            <button onclick="DashboardModule.applyCustomPeriod()" class="flex-1 btn-primary">Terapkan</button>
          </div>
        </div>
      </div>
    `;

    initCharts(transactions, periodTx);
  }

  function summaryCard(label, amount, key, color) {
    const icons = {
      balance:  `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3"/></svg>`,
      income:   `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 11l5-5m0 0l5 5m-5-5v12"/></svg>`,
      expense:  `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 13l-5 5m0 0l-5-5m5 5V6"/></svg>`,
      budget:   `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"/></svg>`,
      net:      `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/></svg>`,
    };
    const isNeg = amount < 0;
    return `
      <div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
        <div class="flex items-center justify-between mb-2">
          <span class="text-xs text-gray-500 font-medium">${label}</span>
          <span class="p-1.5 rounded-lg" style="background:${color}20; color:${color}">${icons[key] || icons.net}</span>
        </div>
        <p class="text-lg font-bold ${isNeg ? 'text-red-500' : 'text-gray-800'}">${Finance.formatIDR(amount)}</p>
      </div>`;
  }

  function recentTransactionsList(txList, accounts) {
    if (!txList.length) return UI.emptyState('Belum ada transaksi', '📋');
    const accMap = Object.fromEntries(accounts.map(a => [a.id, a]));
    return `<div class="space-y-2">${txList.map(t => {
      const acc = accMap[t.accountId];
      return `
        <div class="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer" onclick="AppState.navigate('transactions')">
          <span class="text-xl w-8 text-center flex-shrink-0">${UI.getCategoryIcon(t.category)}</span>
          <div class="flex-1 min-w-0">
            <p class="text-sm font-medium text-gray-800 truncate">${UI.escHtml(t.description || t.category)}</p>
            <p class="text-xs text-gray-400">${Finance.formatDate(t.date)}${acc ? ` · ${UI.escHtml(acc.name)}` : ''}</p>
          </div>
          <div class="text-right flex-shrink-0">${UI.amountHtml(t.amount, t.type)}</div>
        </div>`;
    }).join('')}</div>`;
  }

  function budgetSummary(budgets, periodTx) {
    if (!budgets.length) return UI.emptyState('Belum ada anggaran', '📊');
    return `<div class="space-y-3">${budgets.slice(0, 6).map(b => {
      const usage = Finance.budgetUsage(b, AppState.get('transactions'));
      const barColor = usage.status === 'exceeded' ? '#ef4444' : usage.status === 'warning' ? '#f97316' : '#10b981';
      const pct = Math.min(usage.percentage, 100);
      return `
        <div>
          <div class="flex justify-between text-xs text-gray-600 mb-1">
            <span>${UI.getCategoryIcon(b.category)} ${b.category}</span>
            <span class="${usage.status === 'exceeded' ? 'text-red-500 font-semibold' : 'text-gray-500'}">${Finance.formatIDR(usage.spent, true)} / ${Finance.formatIDR(b.amount, true)}</span>
          </div>
          <div class="h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div class="h-full rounded-full transition-all" style="width:${pct}%; background:${barColor}"></div>
          </div>
        </div>`;
    }).join('')}</div>`;
  }

  function initCharts(allTx, periodTx) {
    // Destroy previous chart instances
    if (_incomeExpenseChart) { _incomeExpenseChart.destroy(); _incomeExpenseChart = null; }
    if (_categoryChart) { _categoryChart.destroy(); _categoryChart = null; }

    // Income/Expense trend (last 6 months)
    const trends = Finance.monthlyTrends(allTx).slice(-6);
    const iec = document.getElementById('income-expense-chart');
    if (iec && window.Chart) {
      _incomeExpenseChart = new Chart(iec, {
        type: 'bar',
        data: {
          labels: trends.map(t => Finance.formatMonth(t.month)),
          datasets: [
            {
              label: 'Pemasukan',
              data: trends.map(t => t.income),
              backgroundColor: '#10b98130',
              borderColor: '#10b981',
              borderWidth: 2,
              borderRadius: 6,
            },
            {
              label: 'Pengeluaran',
              data: trends.map(t => t.expense),
              backgroundColor: '#ef444430',
              borderColor: '#ef4444',
              borderWidth: 2,
              borderRadius: 6,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { position: 'top', labels: { boxWidth: 12, font: { size: 11 } } } },
          scales: {
            y: {
              ticks: { callback: v => Finance.formatIDR(v, true), font: { size: 10 } },
              grid: { color: '#f1f5f9' },
            },
            x: { ticks: { font: { size: 10 } }, grid: { display: false } },
          },
        },
      });
    }

    // Category donut chart
    const catData = Finance.expenseByCategory(periodTx);
    const cats = Object.keys(catData).sort((a, b) => catData[b] - catData[a]).slice(0, 7);
    const cc = document.getElementById('category-chart');
    if (cc && window.Chart && cats.length) {
      _categoryChart = new Chart(cc, {
        type: 'doughnut',
        data: {
          labels: cats,
          datasets: [{
            data: cats.map(c => catData[c]),
            backgroundColor: cats.map(c => UI.getCategoryColor(c) + 'cc'),
            borderColor: cats.map(c => UI.getCategoryColor(c)),
            borderWidth: 1.5,
          }],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          cutout: '65%',
          plugins: {
            legend: { position: 'bottom', labels: { boxWidth: 10, font: { size: 10 }, padding: 8 } },
            tooltip: {
              callbacks: {
                label: ctx => ` ${Finance.formatIDR(ctx.parsed)}`,
              },
            },
          },
        },
      });
    } else if (cc && !cats.length) {
      cc.closest('.relative').innerHTML = UI.emptyState('Belum ada pengeluaran di periode ini', '📉');
    }
  }

  return {
    render,
    setPeriod(type) {
      AppState.setPeriod(type);
      render();
    },
    showCustomPeriod() {
      const p = AppState.currentPeriod();
      document.getElementById('custom-from').value = p.from;
      document.getElementById('custom-to').value = p.to;
      UI.openModal('custom-period-modal');
    },
    applyCustomPeriod() {
      const from = document.getElementById('custom-from').value;
      const to   = document.getElementById('custom-to').value;
      if (!from || !to || from > to) {
        UI.toast('Rentang tanggal tidak valid', 'error');
        return;
      }
      AppState.setPeriod('custom', from, to);
      UI.closeModal('custom-period-modal');
      render();
    },
  };
})();
