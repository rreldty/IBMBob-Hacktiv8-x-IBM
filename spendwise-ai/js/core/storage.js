/**
 * SpendWise AI - Storage Module
 * Handles all localStorage persistence operations.
 */

const STORAGE_KEYS = {
  TRANSACTIONS: 'sw_transactions',
  ACCOUNTS: 'sw_accounts',
  BUDGETS: 'sw_budgets',
  GOALS: 'sw_goals',
  SETTINGS: 'sw_settings',
  DEMO_MODE: 'sw_demo_mode',
};

const Storage = {
  get(key) {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : null;
    } catch (e) {
      console.error(`Storage.get error for key ${key}:`, e);
      return null;
    }
  },

  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (e) {
      console.error(`Storage.set error for key ${key}:`, e);
      return false;
    }
  },

  remove(key) {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (e) {
      console.error(`Storage.remove error for key ${key}:`, e);
      return false;
    }
  },

  clearAll() {
    Object.values(STORAGE_KEYS).forEach(key => localStorage.removeItem(key));
  },

  // --- Transactions ---
  getTransactions() {
    return this.get(STORAGE_KEYS.TRANSACTIONS) || [];
  },
  setTransactions(transactions) {
    return this.set(STORAGE_KEYS.TRANSACTIONS, transactions);
  },

  // --- Accounts ---
  getAccounts() {
    return this.get(STORAGE_KEYS.ACCOUNTS) || [];
  },
  setAccounts(accounts) {
    return this.set(STORAGE_KEYS.ACCOUNTS, accounts);
  },

  // --- Budgets ---
  getBudgets() {
    return this.get(STORAGE_KEYS.BUDGETS) || [];
  },
  setBudgets(budgets) {
    return this.set(STORAGE_KEYS.BUDGETS, budgets);
  },

  // --- Goals ---
  getGoals() {
    return this.get(STORAGE_KEYS.GOALS) || [];
  },
  setGoals(goals) {
    return this.set(STORAGE_KEYS.GOALS, goals);
  },

  // --- Settings ---
  getSettings() {
    return this.get(STORAGE_KEYS.SETTINGS) || {
      currency: 'IDR',
      locale: 'id-ID',
      theme: 'light',
      aiMode: 'demo',
      aiApiKey: '',
    };
  },
  setSettings(settings) {
    return this.set(STORAGE_KEYS.SETTINGS, settings);
  },

  // --- Demo Mode ---
  isDemoMode() {
    return this.get(STORAGE_KEYS.DEMO_MODE) !== false;
  },
  setDemoMode(val) {
    return this.set(STORAGE_KEYS.DEMO_MODE, val);
  },
};
