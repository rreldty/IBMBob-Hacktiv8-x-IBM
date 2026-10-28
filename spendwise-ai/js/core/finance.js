/**
 * SpendWise AI - Financial Calculations Module
 * All monetary calculations are centralized here.
 * Rules:
 *   - 'income'   : adds to income total, adds to account balance
 *   - 'expense'  : adds to expense total, subtracts from account balance
 *   - 'transfer' : moves funds between accounts; NOT counted as income or expense
 */

const Finance = {
  /**
   * Format a number as Indonesian Rupiah.
   * @param {number} amount
   * @param {boolean} compact - Use compact notation (e.g. 1,2 Jt)
   */
  formatIDR(amount, compact = false) {
    if (typeof amount !== 'number' || isNaN(amount)) return 'Rp 0';
    if (compact && Math.abs(amount) >= 1_000_000) {
      const juta = amount / 1_000_000;
      return `Rp ${juta.toFixed(1).replace('.', ',')} Jt`;
    }
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  },

  /**
   * Format a percentage value.
   */
  formatPercent(value, decimals = 1) {
    if (typeof value !== 'number' || isNaN(value)) return '0%';
    return `${value.toFixed(decimals)}%`;
  },

  /**
   * Generate a unique ID.
   */
  generateId() {
    return `sw_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  },

  /**
   * Get today's date as YYYY-MM-DD string.
   */
  todayISO() {
    return new Date().toISOString().slice(0, 10);
  },

  /**
   * Get the first day of a given month (YYYY-MM-DD).
   * @param {number} year
   * @param {number} month - 0-indexed
   */
  firstDayOfMonth(year, month) {
    return new Date(year, month, 1).toISOString().slice(0, 10);
  },

  /**
   * Get the last day of a given month (YYYY-MM-DD).
   */
  lastDayOfMonth(year, month) {
    return new Date(year, month + 1, 0).toISOString().slice(0, 10);
  },

  /**
   * Filter transactions within a date range (inclusive).
   * @param {Array} transactions
   * @param {string} from - YYYY-MM-DD
   * @param {string} to   - YYYY-MM-DD
   */
  filterByDateRange(transactions, from, to) {
    return transactions.filter(t => t.date >= from && t.date <= to);
  },

  /**
   * Calculate total income from a list of transactions.
   * Transfers are excluded.
   */
  totalIncome(transactions) {
    return transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
  },

  /**
   * Calculate total expenses from a list of transactions.
   * Transfers are excluded.
   */
  totalExpense(transactions) {
    return transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
  },

  /**
   * Net cash flow for the period (income - expense).
   */
  netFlow(transactions) {
    return this.totalIncome(transactions) - this.totalExpense(transactions);
  },

  /**
   * Calculate expense totals grouped by category.
   * @param {Array} transactions
   * @returns {Object} { categoryName: totalAmount }
   */
  expenseByCategory(transactions) {
    return transactions
      .filter(t => t.type === 'expense')
      .reduce((acc, t) => {
        acc[t.category] = (acc[t.category] || 0) + t.amount;
        return acc;
      }, {});
  },

  /**
   * Calculate income totals grouped by category.
   */
  incomeByCategory(transactions) {
    return transactions
      .filter(t => t.type === 'income')
      .reduce((acc, t) => {
        acc[t.category] = (acc[t.category] || 0) + t.amount;
        return acc;
      }, {});
  },

  /**
   * Compute monthly summaries for a list of transactions.
   * Returns array sorted ascending by month.
   * @param {Array} transactions
   * @returns {Array} [{ month: 'YYYY-MM', income, expense, net }]
   */
  monthlyTrends(transactions) {
    const map = {};
    transactions.forEach(t => {
      if (t.type === 'transfer') return;
      const month = t.date.slice(0, 7); // YYYY-MM
      if (!map[month]) map[month] = { month, income: 0, expense: 0 };
      if (t.type === 'income') map[month].income += t.amount;
      if (t.type === 'expense') map[month].expense += t.amount;
    });
    return Object.values(map)
      .sort((a, b) => a.month.localeCompare(b.month))
      .map(m => ({ ...m, net: m.income - m.expense }));
  },

  /**
   * Compute the actual balance for each account based on all transactions.
   * This is the ground-truth balance recalculated from history.
   * @param {Array} accounts
   * @param {Array} transactions - ALL transactions (no date filter)
   * @returns {Object} { accountId: computedBalance }
   */
  computeAccountBalances(accounts, transactions) {
    const balances = {};
    accounts.forEach(a => {
      balances[a.id] = a.initialBalance || 0;
    });
    transactions.forEach(t => {
      if (t.type === 'income' && balances[t.accountId] !== undefined) {
        balances[t.accountId] += t.amount;
      } else if (t.type === 'expense' && balances[t.accountId] !== undefined) {
        balances[t.accountId] -= t.amount;
      } else if (t.type === 'transfer') {
        if (balances[t.accountId] !== undefined) balances[t.accountId] -= t.amount;
        if (balances[t.toAccountId] !== undefined) balances[t.toAccountId] += t.amount;
      }
    });
    return balances;
  },

  /**
   * Total balance across all accounts (computed).
   */
  totalBalance(accounts, transactions) {
    const balances = this.computeAccountBalances(accounts, transactions);
    return Object.values(balances).reduce((s, v) => s + v, 0);
  },

  /**
   * Budget usage for a single budget category.
   * @param {Object} budget - { id, category, amount, month } month = 'YYYY-MM'
   * @param {Array} transactions
   * @returns {{ spent, remaining, percentage, status }}
   *   status: 'ok' | 'warning' | 'exceeded'
   */
  budgetUsage(budget, transactions) {
    const from = `${budget.month}-01`;
    const [y, m] = budget.month.split('-').map(Number);
    const to = this.lastDayOfMonth(y, m - 1);
    const periodTx = this.filterByDateRange(transactions, from, to);
    const spent = periodTx
      .filter(t => t.type === 'expense' && t.category === budget.category)
      .reduce((s, t) => s + t.amount, 0);
    const remaining = budget.amount - spent;
    const percentage = budget.amount > 0 ? (spent / budget.amount) * 100 : 0;
    let status = 'ok';
    if (percentage >= 100) status = 'exceeded';
    else if (percentage >= 80) status = 'warning';
    return { spent, remaining, percentage, status };
  },

  /**
   * Savings goal progress.
   * @param {Object} goal - { targetAmount, currentAmount, targetDate }
   * @returns {{ percentage, remaining, monthsLeft, requiredMonthly }}
   */
  goalProgress(goal) {
    const percentage = goal.targetAmount > 0
      ? Math.min((goal.currentAmount / goal.targetAmount) * 100, 100)
      : 0;
    const remaining = Math.max(goal.targetAmount - goal.currentAmount, 0);
    let monthsLeft = null;
    let requiredMonthly = null;
    if (goal.targetDate) {
      const today = new Date();
      const target = new Date(goal.targetDate);
      const diffMs = target - today;
      monthsLeft = Math.max(Math.ceil(diffMs / (1000 * 60 * 60 * 24 * 30)), 0);
      requiredMonthly = monthsLeft > 0 ? remaining / monthsLeft : remaining;
    }
    return { percentage, remaining, monthsLeft, requiredMonthly };
  },

  /**
   * Daily spending limit calculation.
   * Based on remaining budget (across all categories) and days left in month.
   * @param {Array} budgets - all budgets for current month
   * @param {Array} transactions - all transactions
   * @param {string} month - 'YYYY-MM'
   */
  dailySpendingLimit(budgets, transactions, month) {
    const today = new Date();
    const [y, m] = month.split('-').map(Number);
    const lastDay = new Date(y, m, 0).getDate();
    const daysLeft = lastDay - today.getDate() + 1; // inclusive of today

    const totalBudgeted = budgets
      .filter(b => b.month === month)
      .reduce((s, b) => s + b.amount, 0);

    const from = `${month}-01`;
    const to = this.lastDayOfMonth(y, m - 1);
    const periodTx = this.filterByDateRange(transactions, from, to);
    const totalSpent = this.totalExpense(periodTx);

    const remaining = Math.max(totalBudgeted - totalSpent, 0);
    const dailyLimit = daysLeft > 0 ? remaining / daysLeft : 0;

    return {
      totalBudgeted,
      totalSpent,
      remaining,
      daysLeft,
      dailyLimit,
      month,
    };
  },

  /**
   * Average daily expense for the given transactions.
   * @param {Array} transactions
   * @param {string} from
   * @param {string} to
   */
  averageDailyExpense(transactions, from, to) {
    const filtered = this.filterByDateRange(transactions, from, to);
    const total = this.totalExpense(filtered);
    const fromDate = new Date(from);
    const toDate = new Date(to);
    const days = Math.max(
      Math.round((toDate - fromDate) / (1000 * 60 * 60 * 24)) + 1,
      1
    );
    return { total, days, average: total / days };
  },

  /**
   * Parse a date string safely. Returns null if invalid.
   */
  parseDate(str) {
    if (!str || typeof str !== 'string') return null;
    const d = new Date(str);
    return isNaN(d.getTime()) ? null : d;
  },

  /**
   * Format date to Indonesian locale string.
   */
  formatDate(isoStr) {
    const d = this.parseDate(isoStr);
    if (!d) return '-';
    return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
  },

  /**
   * Format month string (YYYY-MM) to readable form.
   */
  formatMonth(ym) {
    if (!ym || ym.length < 7) return ym;
    const [y, m] = ym.split('-');
    const date = new Date(parseInt(y), parseInt(m) - 1, 1);
    return date.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
  },
};
