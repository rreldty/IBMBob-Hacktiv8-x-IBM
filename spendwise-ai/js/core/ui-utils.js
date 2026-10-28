/**
 * SpendWise AI - UI Utilities
 * Reusable UI helpers: toast notifications, modals, loading states.
 */

const UI = {
  // ---- Toast Notifications ----
  _toastContainer: null,

  _getToastContainer() {
    if (!this._toastContainer) {
      this._toastContainer = document.getElementById('toast-container');
    }
    return this._toastContainer;
  },

  /**
   * Show a toast notification.
   * @param {string} message
   * @param {'success'|'error'|'warning'|'info'} type
   * @param {number} duration - ms
   */
  toast(message, type = 'info', duration = 3500) {
    const container = this._getToastContainer();
    if (!container) return;

    const icons = {
      success: `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>`,
      error:   `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>`,
      warning: `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/></svg>`,
      info:    `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>`,
    };
    const colors = {
      success: 'bg-emerald-50 border-emerald-400 text-emerald-800',
      error:   'bg-red-50 border-red-400 text-red-800',
      warning: 'bg-amber-50 border-amber-400 text-amber-800',
      info:    'bg-blue-50 border-blue-400 text-blue-800',
    };
    const iconColors = {
      success: 'text-emerald-500',
      error:   'text-red-500',
      warning: 'text-amber-500',
      info:    'text-blue-500',
    };

    const toast = document.createElement('div');
    toast.className = `flex items-start gap-3 px-4 py-3 rounded-xl border shadow-lg text-sm max-w-sm w-full transition-all duration-300 ${colors[type]}`;
    toast.style.cssText = 'opacity:0; transform:translateX(100%);';
    toast.innerHTML = `
      <span class="${iconColors[type]} flex-shrink-0 mt-0.5">${icons[type]}</span>
      <span class="flex-1">${this.escHtml(message)}</span>
      <button class="flex-shrink-0 opacity-60 hover:opacity-100 ml-1" onclick="this.closest('.flex').remove()">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
      </button>`;

    container.appendChild(toast);

    requestAnimationFrame(() => {
      toast.style.opacity = '1';
      toast.style.transform = 'translateX(0)';
    });

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(100%)';
      setTimeout(() => toast.remove(), 300);
    }, duration);
  },

  // ---- Modal ----
  /**
   * Open a modal by ID.
   */
  openModal(id) {
    const modal = document.getElementById(id);
    if (!modal) return;
    modal.classList.remove('hidden');
    modal.classList.add('flex');
    document.body.style.overflow = 'hidden';
  },

  closeModal(id) {
    const modal = document.getElementById(id);
    if (!modal) return;
    modal.classList.add('hidden');
    modal.classList.remove('flex');
    document.body.style.overflow = '';
  },

  closeAllModals() {
    document.querySelectorAll('[data-modal]').forEach(m => {
      m.classList.add('hidden');
      m.classList.remove('flex');
    });
    document.body.style.overflow = '';
  },

  /**
   * Show a confirmation dialog.
   * @param {string} message
   * @param {Function} onConfirm
   * @param {string} confirmLabel
   */
  confirm(message, onConfirm, confirmLabel = 'Hapus') {
    document.getElementById('confirm-message').textContent = message;
    document.getElementById('confirm-btn').textContent = confirmLabel;
    document.getElementById('confirm-btn').onclick = () => {
      this.closeModal('confirm-modal');
      onConfirm();
    };
    this.openModal('confirm-modal');
  },

  // ---- Loading ----
  setLoading(el, isLoading) {
    if (!el) return;
    if (isLoading) {
      el.disabled = true;
      el._origText = el.innerHTML;
      el.innerHTML = `<svg class="animate-spin w-4 h-4 inline mr-2" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path></svg>Memproses...`;
    } else {
      el.disabled = false;
      if (el._origText) el.innerHTML = el._origText;
    }
  },

  // ---- Form helpers ----
  getFormData(formId) {
    const form = document.getElementById(formId);
    if (!form) return {};
    const data = {};
    new FormData(form).forEach((val, key) => { data[key] = val; });
    return data;
  },

  resetForm(formId) {
    const form = document.getElementById(formId);
    if (form) form.reset();
  },

  setFormError(fieldId, message) {
    const field = document.getElementById(fieldId);
    if (!field) return;
    field.classList.add('border-red-400');
    let err = field.parentElement.querySelector('.field-error');
    if (!err) {
      err = document.createElement('p');
      err.className = 'field-error text-xs text-red-500 mt-1';
      field.parentElement.appendChild(err);
    }
    err.textContent = message;
  },

  clearFormErrors(formId) {
    const form = document.getElementById(formId);
    if (!form) return;
    form.querySelectorAll('.field-error').forEach(e => e.remove());
    form.querySelectorAll('.border-red-400').forEach(e => e.classList.remove('border-red-400'));
  },

  // ---- String escaping ----
  escHtml(str) {
    const div = document.createElement('div');
    div.appendChild(document.createTextNode(str));
    return div.innerHTML;
  },

  // ---- Empty state ----
  emptyState(message, icon = '📭') {
    return `<div class="flex flex-col items-center justify-center py-16 text-gray-400">
      <span class="text-5xl mb-4">${icon}</span>
      <p class="text-sm text-center max-w-xs">${this.escHtml(message)}</p>
    </div>`;
  },

  // ---- Category colors & icons ----
  CATEGORY_META: {
    'Makanan':      { color: '#f59e0b', icon: '🍽️' },
    'Transportasi': { color: '#3b82f6', icon: '🚗' },
    'Tagihan':      { color: '#ef4444', icon: '📋' },
    'Hiburan':      { color: '#8b5cf6', icon: '🎬' },
    'Belanja':      { color: '#ec4899', icon: '🛍️' },
    'Kesehatan':    { color: '#10b981', icon: '💊' },
    'Pendidikan':   { color: '#06b6d4', icon: '📚' },
    'Gaji':         { color: '#22c55e', icon: '💼' },
    'Freelance':    { color: '#84cc16', icon: '💻' },
    'Investasi':    { color: '#f97316', icon: '📈' },
    'Transfer':     { color: '#94a3b8', icon: '↔️' },
    'Tabungan':     { color: '#0ea5e9', icon: '🏦' },
    'Lainnya':      { color: '#6b7280', icon: '📌' },
  },

  getCategoryColor(category) {
    return (this.CATEGORY_META[category] || this.CATEGORY_META['Lainnya']).color;
  },

  getCategoryIcon(category) {
    return (this.CATEGORY_META[category] || this.CATEGORY_META['Lainnya']).icon;
  },

  ACCOUNT_TYPE_META: {
    'bank':    { label: 'Bank',          icon: '🏦' },
    'cash':    { label: 'Tunai',         icon: '💵' },
    'ewallet': { label: 'Dompet Digital', icon: '📱' },
    'other':   { label: 'Lainnya',       icon: '💳' },
  },

  getAccountTypeLabel(type) {
    return (this.ACCOUNT_TYPE_META[type] || this.ACCOUNT_TYPE_META['other']).label;
  },

  getAccountTypeIcon(type) {
    return (this.ACCOUNT_TYPE_META[type] || this.ACCOUNT_TYPE_META['other']).icon;
  },

  // ---- Transaction type badge ----
  txTypeBadge(type) {
    const map = {
      income:   'bg-emerald-100 text-emerald-700',
      expense:  'bg-red-100 text-red-700',
      transfer: 'bg-blue-100 text-blue-700',
    };
    const labels = { income: 'Pemasukan', expense: 'Pengeluaran', transfer: 'Transfer' };
    return `<span class="px-2 py-0.5 rounded-full text-xs font-medium ${map[type] || ''}">${labels[type] || type}</span>`;
  },

  // ---- Amount display ----
  amountHtml(amount, type) {
    if (type === 'income')   return `<span class="text-emerald-600 font-semibold">+${Finance.formatIDR(amount)}</span>`;
    if (type === 'expense')  return `<span class="text-red-500 font-semibold">−${Finance.formatIDR(amount)}</span>`;
    if (type === 'transfer') return `<span class="text-blue-500 font-semibold">${Finance.formatIDR(amount)}</span>`;
    return Finance.formatIDR(amount);
  },
};
