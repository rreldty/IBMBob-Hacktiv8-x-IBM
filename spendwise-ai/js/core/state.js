/**
 * SpendWise AI - Application State
 * Central reactive state store with pub/sub event system.
 */

const AppState = (() => {
  // Internal state
  let _state = {
    currentPage: 'dashboard',
    transactions: [],
    accounts: [],
    budgets: [],
    goals: [],
    settings: {},
    isDemoMode: true,
    // Period filter used across dashboard/analytics
    period: {
      type: 'this_month', // 'this_month' | 'last_month' | 'custom'
      from: '',
      to: '',
    },
  };

  // Subscribers: { event: [callbacks] }
  const _subscribers = {};

  function emit(event, data) {
    (_subscribers[event] || []).forEach(fn => fn(data));
    (_subscribers['*'] || []).forEach(fn => fn({ event, data }));
  }

  return {
    /**
     * Subscribe to a state change event.
     * @param {string} event - event name or '*' for all
     * @param {Function} cb
     */
    on(event, cb) {
      if (!_subscribers[event]) _subscribers[event] = [];
      _subscribers[event].push(cb);
    },

    off(event, cb) {
      if (_subscribers[event]) {
        _subscribers[event] = _subscribers[event].filter(fn => fn !== cb);
      }
    },

    // ---- Getters ----
    get(key) { return _state[key]; },
    getAll() { return { ..._state }; },

    // ---- Page navigation ----
    navigate(page) {
      _state.currentPage = page;
      emit('navigate', page);
    },

    // ---- Data loaders (from storage) ----
    loadFromStorage() {
      _state.transactions = Storage.getTransactions();
      _state.accounts     = Storage.getAccounts();
      _state.budgets      = Storage.getBudgets();
      _state.goals        = Storage.getGoals();
      _state.settings     = Storage.getSettings();
      _state.isDemoMode   = Storage.isDemoMode();
      this._updatePeriodDefaults();
      emit('loaded', _state);
    },

    _updatePeriodDefaults() {
      const today = new Date();
      const y = today.getFullYear();
      const m = today.getMonth();
      _state.period.from = Finance.firstDayOfMonth(y, m);
      _state.period.to   = Finance.lastDayOfMonth(y, m);
    },

    // ---- Period filter ----
    setPeriod(type, from, to) {
      const today = new Date();
      const y = today.getFullYear();
      const m = today.getMonth();
      if (type === 'this_month') {
        _state.period = { type, from: Finance.firstDayOfMonth(y, m), to: Finance.lastDayOfMonth(y, m) };
      } else if (type === 'last_month') {
        _state.period = { type, from: Finance.firstDayOfMonth(y, m - 1), to: Finance.lastDayOfMonth(y, m - 1) };
      } else if (type === 'custom') {
        _state.period = { type, from, to };
      }
      emit('period_changed', _state.period);
    },

    currentPeriod() {
      return { ..._state.period };
    },

    // ---- Derived data helpers ----
    periodTransactions() {
      return Finance.filterByDateRange(
        _state.transactions,
        _state.period.from,
        _state.period.to
      );
    },

    currentMonthString() {
      return _state.period.from ? _state.period.from.slice(0, 7) : '';
    },

    // ---- CRUD: Transactions ----
    addTransaction(tx) {
      const newTx = { ...tx, id: Finance.generateId() };
      _state.transactions.push(newTx);
      Storage.setTransactions(_state.transactions);
      emit('transactions_changed', _state.transactions);
      return newTx;
    },

    updateTransaction(id, updates) {
      const idx = _state.transactions.findIndex(t => t.id === id);
      if (idx === -1) return false;
      _state.transactions[idx] = { ..._state.transactions[idx], ...updates };
      Storage.setTransactions(_state.transactions);
      emit('transactions_changed', _state.transactions);
      return true;
    },

    deleteTransaction(id) {
      _state.transactions = _state.transactions.filter(t => t.id !== id);
      Storage.setTransactions(_state.transactions);
      emit('transactions_changed', _state.transactions);
      return true;
    },

    // ---- CRUD: Accounts ----
    addAccount(acc) {
      const newAcc = { ...acc, id: Finance.generateId() };
      _state.accounts.push(newAcc);
      Storage.setAccounts(_state.accounts);
      emit('accounts_changed', _state.accounts);
      return newAcc;
    },

    updateAccount(id, updates) {
      const idx = _state.accounts.findIndex(a => a.id === id);
      if (idx === -1) return false;
      _state.accounts[idx] = { ..._state.accounts[idx], ...updates };
      Storage.setAccounts(_state.accounts);
      emit('accounts_changed', _state.accounts);
      return true;
    },

    deleteAccount(id) {
      // Keep transactions — mark account as deleted but preserve history
      _state.accounts = _state.accounts.filter(a => a.id !== id);
      Storage.setAccounts(_state.accounts);
      emit('accounts_changed', _state.accounts);
      return true;
    },

    // ---- CRUD: Budgets ----
    addBudget(b) {
      const newB = { ...b, id: Finance.generateId() };
      _state.budgets.push(newB);
      Storage.setBudgets(_state.budgets);
      emit('budgets_changed', _state.budgets);
      return newB;
    },

    updateBudget(id, updates) {
      const idx = _state.budgets.findIndex(b => b.id === id);
      if (idx === -1) return false;
      _state.budgets[idx] = { ..._state.budgets[idx], ...updates };
      Storage.setBudgets(_state.budgets);
      emit('budgets_changed', _state.budgets);
      return true;
    },

    deleteBudget(id) {
      _state.budgets = _state.budgets.filter(b => b.id !== id);
      Storage.setBudgets(_state.budgets);
      emit('budgets_changed', _state.budgets);
      return true;
    },

    // ---- CRUD: Goals ----
    addGoal(g) {
      const newG = { ...g, id: Finance.generateId() };
      _state.goals.push(newG);
      Storage.setGoals(_state.goals);
      emit('goals_changed', _state.goals);
      return newG;
    },

    updateGoal(id, updates) {
      const idx = _state.goals.findIndex(g => g.id === id);
      if (idx === -1) return false;
      _state.goals[idx] = { ..._state.goals[idx], ...updates };
      Storage.setGoals(_state.goals);
      emit('goals_changed', _state.goals);
      return true;
    },

    deleteGoal(id) {
      _state.goals = _state.goals.filter(g => g.id !== id);
      Storage.setGoals(_state.goals);
      emit('goals_changed', _state.goals);
      return true;
    },

    // ---- Settings ----
    updateSettings(updates) {
      _state.settings = { ..._state.settings, ...updates };
      Storage.setSettings(_state.settings);
      emit('settings_changed', _state.settings);
    },

    // ---- Demo mode ----
    resetToDemo() {
      DemoData.load();
      this.loadFromStorage();
      emit('data_reset', true);
    },

    clearAllData() {
      DemoData.clear();
      this.loadFromStorage();
      emit('data_reset', false);
    },
  };
})();
