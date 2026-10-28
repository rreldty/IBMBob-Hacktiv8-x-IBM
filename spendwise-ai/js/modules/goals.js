/**
 * SpendWise AI - Goals Module (Savings Targets)
 */

const GoalsModule = (() => {
  let _editingId = null;

  function render() {
    const page = document.getElementById('page-goals');
    if (!page) return;
    const goals = AppState.get('goals');

    page.innerHTML = `
      <div class="flex flex-wrap items-center justify-between gap-3 mb-5">
        <h2 class="text-lg font-bold text-gray-800">Target Tabungan</h2>
        <button onclick="GoalsModule.openAdd()" class="btn-primary flex items-center gap-2">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
          Tambah Target
        </button>
      </div>

      ${!goals.length ? UI.emptyState('Belum ada target tabungan. Mulai buat rencana finansialmu!', '🎯') : `
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          ${goals.map(g => renderGoalCard(g)).join('')}
        </div>
      `}

      ${renderFormModal()}
    `;
  }

  function renderGoalCard(goal) {
    const prog = Finance.goalProgress(goal);
    const pct  = prog.percentage;
    const barColor = pct >= 100 ? '#10b981' : pct >= 75 ? '#06b6d4' : pct >= 50 ? '#3b82f6' : '#f59e0b';

    return `
      <div class="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <div class="flex items-start justify-between mb-4">
          <div>
            <p class="font-semibold text-gray-800">${UI.escHtml(goal.name)}</p>
            ${goal.description ? `<p class="text-xs text-gray-400 mt-0.5">${UI.escHtml(goal.description)}</p>` : ''}
          </div>
          <div class="flex gap-1">
            <button onclick="GoalsModule.openEdit('${goal.id}')" class="p-1.5 rounded-lg text-gray-400 hover:text-[#1e3a5f] hover:bg-blue-50 transition-colors">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
            </button>
            <button onclick="GoalsModule.confirmDelete('${goal.id}')" class="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
            </button>
          </div>
        </div>

        <!-- Progress ring area -->
        <div class="flex items-center gap-4 mb-4">
          <div class="relative w-16 h-16 flex-shrink-0">
            <svg class="w-full h-full -rotate-90" viewBox="0 0 36 36">
              <circle cx="18" cy="18" r="15.9" fill="none" stroke="#f1f5f9" stroke-width="3"/>
              <circle cx="18" cy="18" r="15.9" fill="none" stroke="${barColor}" stroke-width="3"
                stroke-dasharray="${pct} ${100 - Math.min(pct, 100)}" stroke-linecap="round"/>
            </svg>
            <span class="absolute inset-0 flex items-center justify-center text-xs font-bold text-gray-700">${Math.round(pct)}%</span>
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-xs text-gray-500">Terkumpul</p>
            <p class="font-bold text-gray-800 text-sm">${Finance.formatIDR(goal.currentAmount)}</p>
            <p class="text-xs text-gray-400">dari ${Finance.formatIDR(goal.targetAmount)}</p>
          </div>
        </div>

        <!-- Details -->
        <div class="space-y-1.5 text-xs text-gray-500">
          <div class="flex justify-between">
            <span>Sisa yang diperlukan</span>
            <span class="font-medium text-gray-700">${Finance.formatIDR(prog.remaining)}</span>
          </div>
          ${goal.targetDate ? `
            <div class="flex justify-between">
              <span>Target tanggal</span>
              <span class="font-medium text-gray-700">${Finance.formatDate(goal.targetDate)}</span>
            </div>` : ''}
          ${prog.monthsLeft !== null ? `
            <div class="flex justify-between">
              <span>Sisa waktu</span>
              <span class="font-medium text-gray-700">${prog.monthsLeft} bulan</span>
            </div>` : ''}
          ${prog.requiredMonthly !== null && prog.remaining > 0 ? `
            <div class="flex justify-between border-t border-gray-50 pt-1.5">
              <span>Perlu menabung / bulan</span>
              <span class="font-semibold text-[#1e3a5f]">${Finance.formatIDR(prog.requiredMonthly)}</span>
            </div>
            <p class="text-gray-400 text-xs italic">*Asumsi: menabung secara konsisten setiap bulan</p>
          ` : ''}
        </div>

        ${pct >= 100 ? '<div class="mt-3 text-center text-sm font-medium text-emerald-600">🎉 Target tercapai!</div>' : ''}
        ${goal.isDemo ? '<div class="mt-2"><span class="text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">Demo</span></div>' : ''}
      </div>`;
  }

  function renderFormModal() {
    return `
      <div id="goal-modal" class="hidden fixed inset-0 bg-black/40 z-50 items-center justify-center p-4" data-modal>
        <div class="bg-white rounded-2xl w-full max-w-md shadow-xl">
          <div class="flex items-center justify-between p-5 border-b border-gray-100">
            <h3 id="goal-modal-title" class="text-base font-semibold text-gray-800">Tambah Target Tabungan</h3>
            <button onclick="UI.closeModal('goal-modal')" class="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
          </div>
          <form id="goal-form" class="p-5 space-y-4" onsubmit="GoalsModule.submitForm(event)">
            <div>
              <label class="block text-xs font-medium text-gray-600 mb-1">Nama Target <span class="text-red-400">*</span></label>
              <input type="text" name="name" id="goal-name" placeholder="Contoh: Dana Darurat" required
                class="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]">
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-600 mb-1">Nominal Target (Rp) <span class="text-red-400">*</span></label>
              <input type="number" name="targetAmount" id="goal-target" min="1" step="10000" placeholder="0" required
                class="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]">
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-600 mb-1">Jumlah Sudah Terkumpul (Rp)</label>
              <input type="number" name="currentAmount" id="goal-current" min="0" step="10000" placeholder="0" value="0"
                class="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]">
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-600 mb-1">Target Tanggal (opsional)</label>
              <input type="date" name="targetDate" id="goal-date"
                min="${Finance.todayISO()}"
                class="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]">
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-600 mb-1">Deskripsi (opsional)</label>
              <input type="text" name="description" id="goal-desc" placeholder="Catatan singkat..."
                class="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]">
            </div>
            <div class="flex gap-3 pt-2">
              <button type="button" onclick="UI.closeModal('goal-modal')" class="flex-1 btn-secondary">Batal</button>
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
      UI.resetForm('goal-form');
      document.getElementById('goal-modal-title').textContent = 'Tambah Target Tabungan';
      document.getElementById('goal-current').value = '0';
      UI.openModal('goal-modal');
    },
    openEdit(id) {
      const g = AppState.get('goals').find(g => g.id === id);
      if (!g) return;
      _editingId = id;
      document.getElementById('goal-modal-title').textContent = 'Edit Target';
      document.getElementById('goal-name').value = g.name;
      document.getElementById('goal-target').value = g.targetAmount;
      document.getElementById('goal-current').value = g.currentAmount;
      document.getElementById('goal-date').value = g.targetDate || '';
      document.getElementById('goal-desc').value = g.description || '';
      UI.openModal('goal-modal');
    },
    confirmDelete(id) {
      UI.confirm(
        'Hapus target tabungan ini?',
        () => {
          AppState.deleteGoal(id);
          UI.toast('Target berhasil dihapus', 'success');
          render();
        }
      );
    },
    submitForm(e) {
      e.preventDefault();
      const raw = {};
      new FormData(document.getElementById('goal-form')).forEach((v, k) => { raw[k] = v; });

      const targetAmt  = parseFloat(raw.targetAmount);
      const currentAmt = parseFloat(raw.currentAmount) || 0;

      if (!raw.name || !raw.name.trim()) { UI.toast('Nama target harus diisi', 'error'); return; }
      if (isNaN(targetAmt) || targetAmt <= 0) { UI.toast('Nominal target harus lebih dari 0', 'error'); return; }
      if (currentAmt < 0) { UI.toast('Jumlah terkumpul tidak boleh negatif', 'error'); return; }
      if (currentAmt > targetAmt) { UI.toast('Jumlah terkumpul tidak boleh melebihi target', 'error'); return; }
      if (raw.targetDate && !Finance.parseDate(raw.targetDate)) { UI.toast('Format tanggal tidak valid', 'error'); return; }

      const goalData = {
        name:          raw.name.trim(),
        targetAmount:  targetAmt,
        currentAmount: currentAmt,
        targetDate:    raw.targetDate || null,
        description:   raw.description || '',
        isDemo:        false,
      };

      if (_editingId) {
        AppState.updateGoal(_editingId, goalData);
        UI.toast('Target berhasil diperbarui', 'success');
      } else {
        AppState.addGoal(goalData);
        UI.toast('Target berhasil ditambahkan', 'success');
      }

      UI.closeModal('goal-modal');
      render();
    },
  };
})();
