/**
 * SpendWise AI - Accounts Module
 */

const AccountsModule = (() => {
  let _editingId = null;

  function render() {
    const page = document.getElementById('page-accounts');
    if (!page) return;

    const accounts     = AppState.get('accounts');
    const transactions = AppState.get('transactions');
    const balances     = Finance.computeAccountBalances(accounts, transactions);
    const totalBalance = Object.values(balances).reduce((s, v) => s + v, 0);

    page.innerHTML = `
      <div class="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div>
          <h2 class="text-lg font-bold text-gray-800">Akun Keuangan</h2>
          <p class="text-xs text-gray-500 mt-0.5">Total Saldo: <span class="font-semibold text-gray-700">${Finance.formatIDR(totalBalance)}</span></p>
        </div>
        <button onclick="AccountsModule.openAdd()" class="btn-primary flex items-center gap-2">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
          Tambah Akun
        </button>
      </div>

      ${!accounts.length ? UI.emptyState('Belum ada akun. Tambahkan akun pertama Anda.', '🏦') : `
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          ${accounts.map(a => renderAccountCard(a, balances[a.id] || 0, transactions)).join('')}
        </div>
      `}

      ${renderFormModal()}
    `;
  }

  function renderAccountCard(acc, balance, transactions) {
    const icon  = UI.getAccountTypeIcon(acc.type);
    const label = UI.getAccountTypeLabel(acc.type);
    const color = acc.color || '#1e3a5f';
    const txCount = transactions.filter(t => t.accountId === acc.id || t.toAccountId === acc.id).length;

    return `
      <div class="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div class="px-5 py-4 flex items-start justify-between" style="background: linear-gradient(135deg, ${color}15, ${color}05);">
          <div class="flex items-center gap-3">
            <span class="text-2xl">${icon}</span>
            <div>
              <p class="font-semibold text-gray-800 text-sm">${UI.escHtml(acc.name)}</p>
              <p class="text-xs text-gray-500">${label}</p>
            </div>
          </div>
          <div class="flex gap-1">
            <button onclick="AccountsModule.openEdit('${acc.id}')" 
              class="p-1.5 rounded-lg text-gray-400 hover:text-[#1e3a5f] hover:bg-white transition-colors" title="Edit">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
            </button>
            <button onclick="AccountsModule.confirmDelete('${acc.id}')" 
              class="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-white transition-colors" title="Hapus">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
            </button>
          </div>
        </div>
        <div class="px-5 py-4">
          <p class="text-xs text-gray-500 mb-1">Saldo Saat Ini</p>
          <p class="text-xl font-bold ${balance < 0 ? 'text-red-500' : 'text-gray-800'}">${Finance.formatIDR(balance)}</p>
          <p class="text-xs text-gray-400 mt-2">${txCount} transaksi</p>
        </div>
        ${acc.isDemo ? '<div class="px-5 pb-3"><span class="text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">Demo</span></div>' : ''}
      </div>`;
  }

  function renderFormModal() {
    return `
      <div id="acc-modal" class="hidden fixed inset-0 bg-black/40 z-50 items-center justify-center p-4" data-modal>
        <div class="bg-white rounded-2xl w-full max-w-md shadow-xl">
          <div class="flex items-center justify-between p-5 border-b border-gray-100">
            <h3 id="acc-modal-title" class="text-base font-semibold text-gray-800">Tambah Akun</h3>
            <button onclick="UI.closeModal('acc-modal')" class="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
          </div>
          <form id="acc-form" class="p-5 space-y-4" onsubmit="AccountsModule.submitForm(event)">
            <div>
              <label class="block text-xs font-medium text-gray-600 mb-1">Nama Akun <span class="text-red-400">*</span></label>
              <input type="text" name="name" id="acc-name" placeholder="Contoh: BCA Tabungan" required
                class="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]">
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-600 mb-1">Jenis Akun <span class="text-red-400">*</span></label>
              <select name="type" id="acc-type" required
                class="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]">
                <option value="bank">🏦 Bank</option>
                <option value="cash">💵 Tunai</option>
                <option value="ewallet">📱 Dompet Digital</option>
                <option value="other">💳 Lainnya</option>
              </select>
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-600 mb-1">Saldo Awal (Rp) <span class="text-red-400">*</span></label>
              <input type="number" name="initialBalance" id="acc-balance" min="0" step="1000" placeholder="0" value="0" required
                class="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]">
              <p class="text-xs text-gray-400 mt-1">Saldo awal tidak dapat diubah setelah akun dibuat. Transaksi akan memperbarui saldo secara otomatis.</p>
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-600 mb-1">Warna</label>
              <input type="color" name="color" id="acc-color" value="#1e3a5f"
                class="w-12 h-9 border border-gray-200 rounded-xl cursor-pointer">
            </div>
            <div class="flex gap-3 pt-2">
              <button type="button" onclick="UI.closeModal('acc-modal')" class="flex-1 btn-secondary">Batal</button>
              <button type="submit" class="flex-1 btn-primary">Simpan</button>
            </div>
          </form>
        </div>
      </div>`;
  }

  function validate(data) {
    const errors = [];
    if (!data.name || !data.name.trim()) errors.push('Nama akun harus diisi');
    if (!data.type) errors.push('Jenis akun harus dipilih');
    const balance = parseFloat(data.initialBalance);
    if (isNaN(balance) || balance < 0) errors.push('Saldo awal tidak valid');
    return errors;
  }

  return {
    render,
    openAdd() {
      _editingId = null;
      UI.resetForm('acc-form');
      document.getElementById('acc-modal-title').textContent = 'Tambah Akun';
      document.getElementById('acc-balance').disabled = false;
      document.getElementById('acc-color').value = '#1e3a5f';
      UI.openModal('acc-modal');
    },
    openEdit(id) {
      const acc = AppState.get('accounts').find(a => a.id === id);
      if (!acc) return;
      _editingId = id;
      document.getElementById('acc-modal-title').textContent = 'Edit Akun';
      document.getElementById('acc-name').value = acc.name;
      document.getElementById('acc-type').value = acc.type;
      document.getElementById('acc-balance').value = acc.initialBalance;
      document.getElementById('acc-balance').disabled = true; // Cannot change initial balance
      document.getElementById('acc-color').value = acc.color || '#1e3a5f';
      UI.openModal('acc-modal');
    },
    confirmDelete(id) {
      const acc = AppState.get('accounts').find(a => a.id === id);
      if (!acc) return;
      UI.confirm(
        `Hapus akun "${acc.name}"? Riwayat transaksi terkait akan tetap disimpan.`,
        () => {
          AppState.deleteAccount(id);
          UI.toast('Akun berhasil dihapus. Riwayat transaksi tetap tersimpan.', 'success');
          render();
        }
      );
    },
    submitForm(e) {
      e.preventDefault();
      const raw = {};
      new FormData(document.getElementById('acc-form')).forEach((v, k) => { raw[k] = v; });

      const errors = validate(raw);
      if (errors.length) { UI.toast(errors[0], 'error'); return; }

      const accData = {
        name:           raw.name.trim(),
        type:           raw.type,
        initialBalance: parseFloat(raw.initialBalance),
        color:          raw.color || '#1e3a5f',
        isDemo:         false,
      };

      if (_editingId) {
        // Don't allow changing initialBalance via edit
        const existing = AppState.get('accounts').find(a => a.id === _editingId);
        accData.initialBalance = existing.initialBalance;
        AppState.updateAccount(_editingId, accData);
        UI.toast('Akun berhasil diperbarui', 'success');
      } else {
        AppState.addAccount(accData);
        UI.toast('Akun berhasil ditambahkan', 'success');
      }

      UI.closeModal('acc-modal');
      render();
    },
  };
})();
