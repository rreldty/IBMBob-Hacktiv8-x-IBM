/**
 * SpendWise AI - Main Application Router & Shell
 * Handles navigation, page rendering, and module lifecycle.
 */

const App = (() => {
  const PAGES = {
    dashboard:    { label: 'Dashboard',      icon: 'home',        module: 'DashboardModule' },
    transactions: { label: 'Transaksi',      icon: 'transaction', module: 'TransactionsModule' },
    accounts:     { label: 'Akun',           icon: 'wallet',      module: 'AccountsModule' },
    budgets:      { label: 'Anggaran',       icon: 'chart-bar',   module: 'BudgetsModule' },
    analytics:    { label: 'Analisis',       icon: 'analytics',   module: 'AnalyticsModule' },
    ai:           { label: 'AI Assistant',   icon: 'ai',          module: 'AIAssistant' },
    goals:        { label: 'Target Nabung',  icon: 'target',      module: 'GoalsModule' },
    settings:     { label: 'Pengaturan',     icon: 'settings',    module: 'SettingsModule' },
  };

  const ICONS = {
    home:        `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/></svg>`,
    transaction: `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"/></svg>`,
    wallet:      `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"/></svg>`,
    'chart-bar': `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg>`,
    analytics:   `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z"/></svg>`,
    ai:          `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/></svg>`,
    target:      `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2" fill="none"/><circle cx="12" cy="12" r="6" stroke="currentColor" stroke-width="2" fill="none"/><circle cx="12" cy="12" r="2" stroke="currentColor" stroke-width="2" fill="none"/></svg>`,
    settings:    `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg>`,
  };

  function renderNav(currentPage) {
    return Object.entries(PAGES).map(([key, page]) => {
      const isActive = key === currentPage;
      return `
        <button onclick="App.navigate('${key}')"
          class="nav-item flex items-center gap-3 w-full px-4 py-2.5 rounded-xl text-sm font-medium transition-all
            ${isActive
              ? 'bg-white text-[#1e3a5f] shadow-sm'
              : 'text-blue-200 hover:bg-white/10 hover:text-white'}">
          ${ICONS[page.icon]}
          <span>${page.label}</span>
          ${key === 'ai' ? '<span class="ml-auto text-xs bg-[#06b6d4] text-white px-1.5 py-0.5 rounded">AI</span>' : ''}
        </button>`;
    }).join('');
  }

  function renderMobileNav(currentPage) {
    const topPages = ['dashboard', 'transactions', 'budgets', 'ai', 'goals'];
    return topPages.map(key => {
      const page = PAGES[key];
      const isActive = key === currentPage;
      return `
        <button onclick="App.navigate('${key}')"
          class="flex flex-col items-center gap-1 px-2 py-1.5 rounded-xl transition-all min-w-0 flex-1
            ${isActive ? 'text-[#1e3a5f]' : 'text-gray-400 hover:text-gray-600'}">
          ${ICONS[page.icon]}
          <span class="text-xs font-medium truncate w-full text-center">${page.label}</span>
        </button>`;
    }).join('');
  }

  function renderShell(currentPage) {
    const isDemoMode = AppState.get('isDemoMode');
    document.getElementById('app').innerHTML = `
      <!-- Sidebar (desktop) -->
      <aside class="hidden lg:flex flex-col w-60 bg-[#1e3a5f] text-white fixed left-0 top-0 bottom-0 z-30">
        <!-- Logo -->
        <div class="px-5 py-5 border-b border-white/10">
          <div class="flex items-center gap-3">
            <div class="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center">
              <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
            </div>
            <div>
              <p class="font-bold text-sm">SpendWise AI</p>
              <p class="text-xs text-blue-200">Keuangan Pintar</p>
            </div>
          </div>
        </div>

        ${isDemoMode ? `
          <div class="mx-3 mt-3 px-3 py-2 bg-amber-500/20 rounded-xl border border-amber-400/30">
            <p class="text-xs text-amber-200 font-medium">⚠️ Mode Demo Aktif</p>
          </div>` : ''}

        <!-- Nav -->
        <nav class="flex-1 px-3 py-4 overflow-y-auto space-y-1">
          ${renderNav(currentPage)}
        </nav>

        <!-- Bottom -->
        <div class="px-4 py-4 border-t border-white/10">
          <p class="text-xs text-blue-300">© 2025 SpendWise AI</p>
        </div>
      </aside>

      <!-- Mobile top bar -->
      <div class="lg:hidden fixed top-0 left-0 right-0 z-30 bg-[#1e3a5f] px-4 py-3 flex items-center justify-between shadow-md">
        <div class="flex items-center gap-2">
          <div class="w-7 h-7 bg-white/20 rounded-lg flex items-center justify-center">
            <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
          </div>
          <span class="font-bold text-white text-sm">SpendWise AI</span>
          ${isDemoMode ? '<span class="text-xs bg-amber-400/30 text-amber-200 px-1.5 py-0.5 rounded">Demo</span>' : ''}
        </div>
        <button onclick="App.navigate('settings')" class="p-1.5 text-white/60 hover:text-white">
          ${ICONS.settings}
        </button>
      </div>

      <!-- Main content -->
      <main class="lg:ml-60 min-h-screen bg-gray-50">
        <div class="pt-16 lg:pt-0 pb-24 lg:pb-6 px-4 lg:px-6 py-4 lg:py-6 max-w-7xl mx-auto">
          <!-- Page containers -->
          <div id="page-dashboard"    class="page ${currentPage === 'dashboard'    ? '' : 'hidden'}"></div>
          <div id="page-transactions" class="page ${currentPage === 'transactions' ? '' : 'hidden'}"></div>
          <div id="page-accounts"     class="page ${currentPage === 'accounts'     ? '' : 'hidden'}"></div>
          <div id="page-budgets"      class="page ${currentPage === 'budgets'      ? '' : 'hidden'}"></div>
          <div id="page-analytics"    class="page ${currentPage === 'analytics'    ? '' : 'hidden'}"></div>
          <div id="page-ai"           class="page ${currentPage === 'ai'           ? '' : 'hidden'}"></div>
          <div id="page-goals"        class="page ${currentPage === 'goals'        ? '' : 'hidden'}"></div>
          <div id="page-settings"     class="page ${currentPage === 'settings'     ? '' : 'hidden'}"></div>
        </div>
      </main>

      <!-- Mobile bottom nav -->
      <nav class="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-gray-100 px-2 py-1 flex shadow-lg">
        ${renderMobileNav(currentPage)}
      </nav>

      <!-- Global confirm modal -->
      <div id="confirm-modal" class="hidden fixed inset-0 bg-black/40 z-50 items-center justify-center p-4" data-modal>
        <div class="bg-white rounded-2xl w-full max-w-sm shadow-xl p-6">
          <div class="flex items-start gap-3 mb-4">
            <span class="text-2xl">⚠️</span>
            <div>
              <p id="confirm-message" class="text-sm text-gray-700">Apakah Anda yakin?</p>
            </div>
          </div>
          <div class="flex gap-3">
            <button onclick="UI.closeModal('confirm-modal')" class="flex-1 btn-secondary">Batal</button>
            <button id="confirm-btn" class="flex-1 px-4 py-2 rounded-xl bg-red-500 text-white text-sm font-medium hover:bg-red-600 transition-colors">Hapus</button>
          </div>
        </div>
      </div>

      <!-- Toast container -->
      <div id="toast-container" class="fixed top-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
      </div>
    `;
  }

  function renderCurrentPage(page) {
    // Show/hide pages
    document.querySelectorAll('.page').forEach(p => p.classList.add('hidden'));
    const pageEl = document.getElementById(`page-${page}`);
    if (pageEl) pageEl.classList.remove('hidden');

    // Render the page module
    const modules = {
      dashboard:    DashboardModule,
      transactions: TransactionsModule,
      accounts:     AccountsModule,
      budgets:      BudgetsModule,
      analytics:    AnalyticsModule,
      ai:           AIAssistant,
      goals:        GoalsModule,
      settings:     SettingsModule,
    };

    const mod = modules[page];
    if (mod && mod.render) mod.render();
  }

  return {
    init() {
      // Load data
      DemoData.loadIfEmpty();
      AppState.loadFromStorage();

      const currentPage = AppState.get('currentPage') || 'dashboard';

      // Initial shell render
      renderShell(currentPage);
      renderCurrentPage(currentPage);

      // Subscribe to navigation events
      AppState.on('navigate', (page) => {
        renderShell(page);
        renderCurrentPage(page);
      });

      // Re-render current page on data changes
      AppState.on('transactions_changed', () => {
        const cp = AppState.get('currentPage');
        if (['dashboard', 'transactions', 'analytics', 'budgets'].includes(cp)) {
          renderCurrentPage(cp);
        }
      });
      AppState.on('accounts_changed', () => {
        const cp = AppState.get('currentPage');
        if (['dashboard', 'accounts', 'transactions'].includes(cp)) {
          renderCurrentPage(cp);
        }
      });
      AppState.on('budgets_changed', () => {
        const cp = AppState.get('currentPage');
        if (['dashboard', 'budgets'].includes(cp)) {
          renderCurrentPage(cp);
        }
      });
      AppState.on('goals_changed', () => {
        const cp = AppState.get('currentPage');
        if (cp === 'goals') renderCurrentPage(cp);
      });
      AppState.on('data_reset', () => {
        const cp = AppState.get('currentPage');
        renderShell(cp);
        renderCurrentPage(cp);
      });
    },

    navigate(page) {
      AppState.navigate(page);
    },

    getIcons() { return ICONS; },
  };
})();

// Boot
document.addEventListener('DOMContentLoaded', () => {
  App.init();
});
