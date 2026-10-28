/**
 * SpendWise AI - Transactions Module
 * Full CRUD with search, filter, and sort.
 */

const TransactionsModule = (() => {
  // Filter/sort state
  let _filters = {
    search: '',
    type: 'all',
    category: 'all',
    accountId: 'all',
    dateFrom: '',
    dateTo: '',
    sort: 'date_desc',
  };
  let _editingId = null;

  const EXPENSE_CATEGORIES = [
    'Makanan','Transportasi','Tagihan','Hiburan','Belanja',
    'Kesehatan','Pendidikan','Tabungan','Lainnya',
  ];
  const INCOME_CATEGORIES = ['Gaji','Freelance','Investasi','Lainnya'];
  const ALL_CATEGORIES = [...new Set([...INCOME_CATEGORIES, ...EXPENSE_CATEGORIES])].sort();

  function render() {
    const page = document.getElementById('page-transactions');
    if (!page) return;

    const transactions = AppState.get('transactions');
    const accounts     = AppState.get('accounts');

    const filtered = applyFilters(transactions);
    const accMap   = Object.fromEntries(accounts.map(a => [a.id, a]));

    page.innerHTML = `
      <div class="flex flex-wrap items-center justify-between gap-3 mb-5">
        <h2 class="text-lg font-bold text-gray-800">Transaksi</h2>
        <button onclick="TransactionsModule.openAdd()" class="btn-primary flex items-center gap-2">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
          Tambah Transaksi
        </button>
      </div>

      <!-- Filters -->
      <div class="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-5">
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <input type="text" id="tx-search" placeholder="Cari transaksi..." value="${UI.escHtml(_filters.search)}"
            oninput="TransactionsModule.setFilter('search', this.value)"
            class="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f] col-span-full sm:col-span-2">
          <select id="tx-type" onchange="TransactionsModule.setFilter('type', this.value)"
            class="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]">
            <option value="all" ${_filters.type==='all'?'selected':''}>Semua Jenis</option>
            <option value="income"   ${_filters.type==='income'?'selected':''}>Pemasukan</option>
            <option value="expense"  ${_filters.type==='expense'?'selected':''}>Pengeluaran</option>
            <option value="transfer" ${_filters.type==='transfer'?'selected':''}>Transfer</option>
          </select>
          <select id="tx-category" onchange="TransactionsModule.setFilter('category', this.value)"
            class="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]">
            <option value="all">Semua Kategori</option>
            ${ALL_CATEGORIES.map(c => `<option value="${c}" ${_filters.category===c?'selected':''}>${c}</option>`).join('')}
          </select>
          <select id="tx-account" onchange="TransactionsModule.setFilter('accountId', this.value)"
            class="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]">
            <option value="all">Semua Akun</option>
            ${accounts.map(a => `<option value="${a.id}" ${_filters.accountId===a.id?'selected':''}>${UI.escHtml(a.name)}</option>`).join('')}
          </select>
          <input type="date" id="tx-date-from" value="${_filters.dateFrom}"
            onchange="TransactionsModule.setFilter('dateFrom', this.value)"
            class="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]">
          <input type="date" id="tx-date-to" value="${_filters.dateTo}"
            onchange="TransactionsModule.setFilter('dateTo', this.value)"
            class="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]">
          <div class="flex items-center gap-2 col-span-full sm:col-span-2">
            <select onchange="TransactionsModule.setFilter('sort', this.value)"
              class="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f] flex-1">
              <option value="date_desc"   ${_filters.sort==='date_desc'?'selected':''}>Tanggal (Terbaru)</option>
              <option value="date_asc"    ${_filters.sort==='date_asc'?'selected':''}>Tanggal (Terlama)</option>
              <option value="amount_desc" ${_filters.sort==='amount_desc'?'selected':''}>Nominal (Terbesar)</option>
              <option value="amount_asc"  ${_filters.sort==='amount_asc'?'selected':''}>Nominal (Terkecil)</option>
            </select>
            <button onclick="TransactionsModule.resetFilters()" class="btn-secondary text-xs px-3 py-2">Reset</button>
          </div>
        </div>
      </div>

      <!-- Count -->
      <p class="text-xs text-gray-400 mb-3">${filtered.length} transaksi ditemukan</p>

      <!-- List -->
      <div class="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        ${renderList(filtered, accMap)}
      </div>

      <!-- Transaction Form Modal -->
      ${renderFormModal(accounts)}
    `;
  }

  function renderList(filtered, accMap) {
    if (!filtered.length) return UI.emptyState('Tidak ada transaksi yang cocok dengan filter', '🔍');
    return `<div class="divide-y divide-gray-50">${filtered.map(t => renderTxRow(t, accMap)).join('')}</div>`;
  }

  function renderTxRow(t, accMap) {
    const acc = accMap[t.accountId];
    const toAcc = t.toAccountId ? accMap[t.toAccountId] : null;
    return `
      <div class="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors group">
        <span class="text-xl w-8 text-center flex-shrink-0">${UI.getCategoryIcon(t.category)}</span>
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2 flex-wrap">
            <p class="text-sm font-medium text-gray-800 truncate">${UI.escHtml(t.description || t.category)}</p>
            ${UI.txTypeBadge(t.type)}
            ${t.isDemo ? '<span class="text-xs text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">Demo</span>' : ''}
          </div>
          <p class="text-xs text-gray-400 mt-0.5">
            ${Finance.formatDate(t.date)} · ${t.category}
            ${acc ? ` · ${UI.escHtml(acc.name)}` : ''}
            ${toAcc ? ` → ${UI.escHtml(toAcc.name)}` : ''}
          </p>
        </div>
        <div class="flex items-center gap-3 flex-shrink-0">
          <div class="text-right">${UI.amountHtml(t.amount, t.type)}</div>
          <div class="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button onclick="TransactionsModule.openEdit('${t.id}')" 
              class="p-1.5 rounded-lg text-gray-400 hover:text-[#1e3a5f] hover:bg-blue-50 transition-colors" title="Edit">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
            </button>
            <button onclick="TransactionsModule.confirmDelete('${t.id}')" 
              class="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors" title="Hapus">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
            </button>
          </div>
        </div>
      </div>`;
  }

  function renderFormModal(accounts) {
    const expenseCats = EXPENSE_CATEGORIES;
    const incomeCats  = INCOME_CATEGORIES;

    return `
      <div id="tx-modal" class="hidden fixed inset-0 bg-black/40 z-50 items-center justify-center p-4" data-modal>
        <div class="bg-white rounded-2xl w-full max-w-lg shadow-xl max-h-screen overflow-y-auto">
          <div class="flex items-center justify-between p-5 border-b border-gray-100">
            <h3 id="tx-modal-title" class="text-base font-semibold text-gray-800">Tambah Transaksi</h3>
            <button onclick="UI.closeModal('tx-modal')" class="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
          </div>
          <form id="tx-form" class="p-5 space-y-4" onsubmit="TransactionsModule.submitForm(event)">
            <!-- Type -->
            <div>
              <label class="block text-xs font-medium text-gray-600 mb-2">Jenis Transaksi</label>
              <div class="flex gap-2" id="tx-type-btns">
                <button type="button" onclick="TransactionsModule.selectType('income')" 
                  class="tx-type-btn flex-1 py-2 rounded-xl text-sm font-medium border transition-all" data-type="income">Pemasukan</button>
                <button type="button" onclick="TransactionsModule.selectType('expense')" 
                  class="tx-type-btn flex-1 py-2 rounded-xl text-sm font-medium border transition-all" data-type="expense">Pengeluaran</button>
                <button type="button" onclick="TransactionsModule.selectType('transfer')" 
                  class="tx-type-btn flex-1 py-2 rounded-xl text-sm font-medium border transition-all" data-type="transfer">Transfer</button>
              </div>
              <input type="hidden" name="type" id="tx-type-input" value="expense">
            </div>
            <!-- Amount -->
            <div>
              <label class="block text-xs font-medium text-gray-600 mb-1">Nominal (Rp) <span class="text-red-400">*</span></label>
              <input type="number" name="amount" id="tx-amount" min="1" step="1000" placeholder="0"
                class="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]" required>
            </div>
            <!-- Category -->
            <div id="tx-category-field">
              <label class="block text-xs font-medium text-gray-600 mb-1">Kategori <span class="text-red-400">*</span></label>
              <select name="category" id="tx-category-select"
                class="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]" required>
                ${expenseCats.map(c => `<option value="${c}">${c}</option>`).join('')}
              </select>
            </div>
            <!-- Account -->
            <div>
              <label class="block text-xs font-medium text-gray-600 mb-1">Akun <span class="text-red-400">*</span></label>
              <select name="accountId" id="tx-account-select"
                class="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]" required>
                ${accounts.map(a => `<option value="${a.id}">${UI.escHtml(a.name)}</option>`).join('')}
              </select>
            </div>
            <!-- To Account (transfer only) -->
            <div id="tx-to-account-field" class="hidden">
              <label class="block text-xs font-medium text-gray-600 mb-1">Ke Akun <span class="text-red-400">*</span></label>
              <select name="toAccountId" id="tx-to-account-select"
                class="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]">
                ${accounts.map(a => `<option value="${a.id}">${UI.escHtml(a.name)}</option>`).join('')}
              </select>
            </div>
            <!-- Date -->
            <div>
              <label class="block text-xs font-medium text-gray-600 mb-1">Tanggal <span class="text-red-400">*</span></label>
              <input type="date" name="date" id="tx-date" required
                value="${Finance.todayISO()}"
                max="${Finance.todayISO()}"
                class="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]">
            </div>
            <!-- Description -->
            <div>
              <label class="block text-xs font-medium text-gray-600 mb-1">Deskripsi / Catatan</label>
              <input type="text" name="description" id="tx-description" placeholder="Catatan opsional..."
                class="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]">
            </div>
            <div class="flex gap-3 pt-2">
              <button type="button" onclick="UI.closeModal('tx-modal')" class="flex-1 btn-secondary">Batal</button>
              <button type="submit" id="tx-submit-btn" class="flex-1 btn-primary">Simpan</button>
            </div>
          </form>
        </div>
      </div>`;
  }

  function applyFilters(transactions) {
    let result = [...transactions];
    const f = _filters;

    if (f.type !== 'all') result = result.filter(t => t.type === f.type);
    if (f.category !== 'all') result = result.filter(t => t.category === f.category);
    if (f.accountId !== 'all') result = result.filter(t => t.accountId === f.accountId || t.toAccountId === f.accountId);
    if (f.dateFrom) result = result.filter(t => t.date >= f.dateFrom);
    if (f.dateTo) result = result.filter(t => t.date <= f.dateTo);
    if (f.search) {
      const q = f.search.toLowerCase();
      result = result.filter(t =>
        (t.description || '').toLowerCase().includes(q) ||
        t.category.toLowerCase().includes(q) ||
        String(t.amount).includes(q)
      );
    }

    const sorts = {
      date_desc:   (a, b) => b.date.localeCompare(a.date),
      date_asc:    (a, b) => a.date.localeCompare(b.date),
      amount_desc: (a, b) => b.amount - a.amount,
      amount_asc:  (a, b) => a.amount - b.amount,
    };
    result.sort(sorts[f.sort] || sorts.date_desc);

    return result;
  }

  function validateForm(data) {
    const errors = [];
    const amount = parseFloat(data.amount);
    if (!data.amount || isNaN(amount) || amount <= 0) errors.push('Nominal harus lebih dari 0');
    if (!data.type) errors.push('Jenis transaksi harus dipilih');
    if (data.type !== 'transfer' && !data.category) errors.push('Kategori harus dipilih');
    if (!data.accountId) errors.push('Akun harus dipilih');
    if (data.type === 'transfer' && data.accountId === data.toAccountId) errors.push('Akun sumber dan tujuan tidak boleh sama');
    if (!data.date) errors.push('Tanggal harus diisi');
    if (data.date && !Finance.parseDate(data.date)) errors.push('Format tanggal tidak valid');
    return errors;
  }

  return {
    render,
    setFilter(key, value) {
      _filters[key] = value;
      render();
    },
    resetFilters() {
      _filters = { search: '', type: 'all', category: 'all', accountId: 'all', dateFrom: '', dateTo: '', sort: 'date_desc' };
      render();
    },
    selectType(type) {
      const input = document.getElementById('tx-type-input');
      if (input) input.value = type;
      // Update button styles
      document.querySelectorAll('.tx-type-btn').forEach(btn => {
        const active = btn.dataset.type === type;
        btn.className = `tx-type-btn flex-1 py-2 rounded-xl text-sm font-medium border transition-all ${
          active ? 'bg-[#1e3a5f] text-white border-[#1e3a5f]' : 'bg-white text-gray-600 border-gray-200 hover:border-[#1e3a5f]'
        }`;
      });
      // Show/hide category and to-account fields
      const catField = document.getElementById('tx-category-field');
      const toAccField = document.getElementById('tx-to-account-field');
      const catSel = document.getElementById('tx-category-select');
      const EXPENSE_CATS = EXPENSE_CATEGORIES;
      const INCOME_CATS  = INCOME_CATEGORIES;
      if (catField) catField.classList.toggle('hidden', type === 'transfer');
      if (toAccField) toAccField.classList.toggle('hidden', type !== 'transfer');
      if (catSel) {
        catSel.innerHTML = type === 'income'
          ? INCOME_CATS.map(c => `<option value="${c}">${c}</option>`).join('')
          : EXPENSE_CATS.map(c => `<option value="${c}">${c}</option>`).join('');
      }
    },
    openAdd() {
      _editingId = null;
      UI.resetForm('tx-form');
      document.getElementById('tx-modal-title').textContent = 'Tambah Transaksi';
      document.getElementById('tx-date').value = Finance.todayISO();
      this.selectType('expense');
      UI.openModal('tx-modal');
    },
    openEdit(id) {
      const tx = AppState.get('transactions').find(t => t.id === id);
      if (!tx) return;
      _editingId = id;
      document.getElementById('tx-modal-title').textContent = 'Edit Transaksi';
      this.selectType(tx.type);
      document.getElementById('tx-type-input').value = tx.type;
      document.getElementById('tx-amount').value = tx.amount;
      document.getElementById('tx-account-select').value = tx.accountId;
      document.getElementById('tx-date').value = tx.date;
      document.getElementById('tx-description').value = tx.description || '';
      if (tx.type !== 'transfer') {
        document.getElementById('tx-category-select').value = tx.category;
      }
      if (tx.type === 'transfer' && tx.toAccountId) {
        document.getElementById('tx-to-account-select').value = tx.toAccountId;
      }
      UI.openModal('tx-modal');
    },
    confirmDelete(id) {
      UI.confirm(
        'Hapus transaksi ini? Tindakan tidak dapat dibatalkan.',
        () => {
          AppState.deleteTransaction(id);
          UI.toast('Transaksi berhasil dihapus', 'success');
          render();
        }
      );
    },
    submitForm(e) {
      e.preventDefault();
      const formEl = document.getElementById('tx-form');
      const raw = {};
      new FormData(formEl).forEach((v, k) => { raw[k] = v.trim(); });
      raw.type = document.getElementById('tx-type-input').value;
      raw.amount = parseFloat(raw.amount);

      const errors = validateForm(raw);
      if (errors.length) { UI.toast(errors[0], 'error'); return; }

      const txData = {
        type:        raw.type,
        amount:      raw.amount,
        category:    raw.type === 'transfer' ? 'Transfer' : raw.category,
        accountId:   raw.accountId,
        toAccountId: raw.type === 'transfer' ? raw.toAccountId : undefined,
        date:        raw.date,
        description: raw.description || '',
        isDemo:      false,
      };

      if (_editingId) {
        AppState.updateTransaction(_editingId, txData);
        UI.toast('Transaksi berhasil diperbarui', 'success');
      } else {
        AppState.addTransaction(txData);
        UI.toast('Transaksi berhasil ditambahkan', 'success');
      }

      UI.closeModal('tx-modal');
      render();
    },
  };
})();
