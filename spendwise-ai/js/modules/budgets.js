/**
 * SpendWise AI - Budgets Module
 */

const BudgetsModule = (() => {
  let _editingId = null;

  const EXPENSE_CATEGORIES = [
    'Makanan','Transportasi','Tagihan','Hiburan','Belanja',
    'Kesehatan','Pendidikan','Tabungan','Lainnya',
  ];

  function render() {
    const page = document.getElementById('page-budgets');
    if (!page) return;

    const budgets      = AppState.get('budgets');
    const transactions = AppState.get('transactions');
    const today        = new Date();
    const currentMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;

    // Group budgets by month, show current month first
    const months = [...new Set(budgets.map(b => b.month))].sort((a, b) => b.localeCompare(a));

    page.innerHTML = `
      <div class="flex flex-wrap items-center justify-between gap-3 mb-5">
        <h2 class="text-lg font-bold text-gray-800">Anggaran</h2>
        <button onclick="BudgetsModule.openAdd()" class="btn-primary flex items-center gap-2">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
          Tambah Anggaran
        </button>
      </div>

      ${!budgets.length ? UI.emptyState('Belum ada anggaran. Buat anggaran untuk memantau pengeluaran.', '📊') : months.map(month => {
        const monthBudgets = budgets.filter(b => b.month === month);
        const isCurrentMonth = month === currentMonth;
        const totalBudget = monthBudgets.reduce((s, b) => s + b.amount, 0);
        const from = `${month}-01`;
        const [y, m] = month.split('-').map(Number);
        const to = Finance.lastDayOfMonth(y, m - 1);
        const monthTx = Finance.filterByDateRange(transactions, from, to);
        const totalSpent = Finance.totalExpense(monthTx);
        const overallPct = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;
        const overallStatus = overallPct >= 100 ? 'exceeded' : overallPct >= 80 ? 'warning' : 'ok';

        return `
          <div class="mb-6">
            <div class="flex items-center justify-between mb-3">
              <div class="flex items-center gap-2">
                <h3 class="text-sm font-semibold text-gray-700">${Finance.formatMonth(month)}</h3>
                ${isCurrentMonth ? '<span class="text-xs bg-[#1e3a5f] text-white px-2 py-0.5 rounded-full">Bulan Ini</span>' : ''}
              </div>
              <div class="text-xs text-gray-500">
                ${Finance.formatIDR(totalSpent, true)} / ${Finance.formatIDR(totalBudget, true)}
                <span class="ml-2 font-medium ${overallStatus === 'exceeded' ? 'text-red-500' : overallStatus === 'warning' ? 'text-amber-500' : 'text-emerald-600'}">
                  (${Finance.formatPercent(overallPct)})
                </span>
              </div>
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              ${monthBudgets.map(b => renderBudgetCard(b, transactions)).join('')}
            </div>
          </div>`;
      }).join('')}

      ${renderFormModal()}
    `;
  }

  function renderBudgetCard(budget, transactions) {
    const usage = Finance.budgetUsage(budget, transactions);
    const statusColors = {
      ok:       { bar: '#10b981', badge: 'bg-emerald-100 text-emerald-700', text: 'Normal' },
      warning:  { bar: '#f97316', badge: 'bg-amber-100 text-amber-700',     text: 'Mendekati Batas' },
      exceeded: { bar: '#ef4444', badge: 'bg-red-100 text-red-700',         text: 'Melampaui Batas' },
    };
    const sc = statusColors[usage.status];
    const pct = Math.min(usage.percentage, 100);

    return `
      <div class="bg-white rounded-2xl border ${usage.status === 'exceeded' ? 'border-red-200' : usage.status === 'warning' ? 'border-amber-200' : 'border-gray-100'} shadow-sm p-4">
        <div class="flex items-start justify-between mb-3">
          <div class="flex items-center gap-2">
            <span class="text-lg">${UI.getCategoryIcon(budget.category)}</span>
            <div>
              <p class="text-sm font-semibold text-gray-800">${budget.category}</p>
              <span class="text-xs px-2 py-0.5 rounded-full font-medium ${sc.badge}">${sc.text}</span>
            </div>
          </div>
          <div class="flex gap-1">
            <button onclick="BudgetsModule.openEdit('${budget.id}')" 
              class="p-1.5 rounded-lg text-gray-400 hover:text-[#1e3a5f] hover:bg-blue-50 transition-colors">
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
            </button>
            <button onclick="BudgetsModule.confirmDelete('${budget.id}')"
              class="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors">
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
            </button>
          </div>
        </div>

        <!-- Progress bar -->
        <div class="mb-2">
          <div class="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div class="h-full rounded-full transition-all duration-500" style="width:${pct}%; background:${sc.bar}"></div>
          </div>
        </div>

        <!-- Stats -->
        <div class="flex justify-between text-xs text-gray-500">
          <span>Terpakai: <span class="font-medium text-gray-700">${Finance.formatIDR(usage.spent)}</span></span>
          <span>${Finance.formatPercent(usage.percentage)}</span>
        </div>
        <div class="flex justify-between text-xs mt-1">
          <span class="text-gray-400">Anggaran: ${Finance.formatIDR(budget.amount)}</span>
          <span class="${usage.remaining < 0 ? 'text-red-500 font-medium' : 'text-gray-400'}">
            ${usage.remaining < 0 ? 'Lebih ' + Finance.formatIDR(Math.abs(usage.remaining)) : 'Sisa ' + Finance.formatIDR(usage.remaining)}
          </span>
        </div>

        ${budget.isDemo ? '<div class="mt-2"><span class="text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">Demo</span></div>' : ''}
      </div>`;
  }

  function renderFormModal() {
    const today   = new Date();
    const currentMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;

    return `
      <div id="budget-modal" class="hidden fixed inset-0 bg-black/40 z-50 items-center justify-center p-4" data-modal>
        <div class="bg-white rounded-2xl w-full max-w-md shadow-xl">
          <div class="flex items-center justify-between p-5 border-b border-gray-100">
            <h3 id="budget-modal-title" class="text-base font-semibold text-gray-800">Tambah Anggaran</h3>
            <button onclick="UI.closeModal('budget-modal')" class="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
          </div>
          <form id="budget-form" class="p-5 space-y-4" onsubmit="BudgetsModule.submitForm(event)">
            <div>
              <label class="block text-xs font-medium text-gray-600 mb-1">Kategori <span class="text-red-400">*</span></label>
              <select name="category" id="budget-category" required
                class="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]">
                ${EXPENSE_CATEGORIES.map(c => `<option value="${c}">${UI.getCategoryIcon(c)} ${c}</option>`).join('')}
              </select>
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-600 mb-1">Batas Anggaran (Rp) <span class="text-red-400">*</span></label>
              <input type="number" name="amount" id="budget-amount" min="1" step="1000" placeholder="0" required
                class="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]">
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-600 mb-1">Bulan <span class="text-red-400">*</span></label>
              <input type="month" name="month" id="budget-month" value="${currentMonth}" required
                class="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]">
            </div>
            <div class="flex gap-3 pt-2">
              <button type="button" onclick="UI.closeModal('budget-modal')" class="flex-1 btn-secondary">Batal</button>
              <button type="submit" class="flex-1 btn-primary">Simpan</button>
            </div>
          </form>
        </div>
      </div>`;
  }

  return {
    render,
    openAdd() {
      _editingId = null;
      UI.resetForm('budget-form');
      document.getElementById('budget-modal-title').textContent = 'Tambah Anggaran';
      UI.openModal('budget-modal');
    },
    openEdit(id) {
      const b = AppState.get('budgets').find(b => b.id === id);
      if (!b) return;
      _editingId = id;
      document.getElementById('budget-modal-title').textContent = 'Edit Anggaran';
      document.getElementById('budget-category').value = b.category;
      document.getElementById('budget-amount').value = b.amount;
      document.getElementById('budget-month').value = b.month;
      UI.openModal('budget-modal');
    },
    confirmDelete(id) {
      UI.confirm(
        'Hapus anggaran ini?',
        () => {
          AppState.deleteBudget(id);
          UI.toast('Anggaran berhasil dihapus', 'success');
          render();
        }
      );
    },
    submitForm(e) {
      e.preventDefault();
      const raw = {};
      new FormData(document.getElementById('budget-form')).forEach((v, k) => { raw[k] = v; });

      const amount = parseFloat(raw.amount);
      if (!raw.category) { UI.toast('Pilih kategori', 'error'); return; }
      if (isNaN(amount) || amount <= 0) { UI.toast('Anggaran harus lebih dari 0', 'error'); return; }
      if (!raw.month) { UI.toast('Pilih bulan', 'error'); return; }

      // Check for duplicate category in same month
      const existing = AppState.get('budgets').find(
        b => b.category === raw.category && b.month === raw.month && b.id !== _editingId
      );
      if (existing) { UI.toast(`Anggaran untuk ${raw.category} di bulan ini sudah ada`, 'error'); return; }

      const budgetData = {
        category: raw.category,
        amount,
        month: raw.month,
        isDemo: false,
      };

      if (_editingId) {
        AppState.updateBudget(_editingId, budgetData);
        UI.toast('Anggaran berhasil diperbarui', 'success');
      } else {
        AppState.addBudget(budgetData);
        UI.toast('Anggaran berhasil ditambahkan', 'success');
      }

      UI.closeModal('budget-modal');
      render();
    },
  };
})();
