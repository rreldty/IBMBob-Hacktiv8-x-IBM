/**
 * SpendWise AI - Demo Data
 * Realistic sample data labelled clearly as demonstration data.
 * Users can reset to this data or clear it entirely.
 */

const DemoData = {
  /**
   * Generate demo data for the current and previous 2 months.
   */
  generate() {
    const today = new Date();
    const y = today.getFullYear();
    const m = today.getMonth(); // 0-indexed

    // Accounts
    const accounts = [
      {
        id: 'acc_demo_1',
        name: 'BCA Tabungan',
        type: 'bank',
        initialBalance: 5_500_000,
        color: '#3b82d4',
        isDemo: true,
      },
      {
        id: 'acc_demo_2',
        name: 'Kas Tunai',
        type: 'cash',
        initialBalance: 800_000,
        color: '#10b981',
        isDemo: true,
      },
      {
        id: 'acc_demo_3',
        name: 'GoPay',
        type: 'ewallet',
        initialBalance: 350_000,
        color: '#f59e0b',
        isDemo: true,
      },
    ];

    // Helper to build ISO date string
    function d(year, month, day) {
      return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    }

    const transactions = [
      // ---- 2 months ago ----
      { id: 'tx_d01', type: 'income',   amount: 4_500_000, category: 'Gaji',           accountId: 'acc_demo_1', date: d(y, m-2, 1),  description: 'Gaji bulanan', isDemo: true },
      { id: 'tx_d02', type: 'expense',  amount: 800_000,   category: 'Makanan',        accountId: 'acc_demo_1', date: d(y, m-2, 3),  description: 'Belanja bulanan', isDemo: true },
      { id: 'tx_d03', type: 'expense',  amount: 350_000,   category: 'Transportasi',   accountId: 'acc_demo_1', date: d(y, m-2, 5),  description: 'Bensin & parkir', isDemo: true },
      { id: 'tx_d04', type: 'expense',  amount: 250_000,   category: 'Hiburan',        accountId: 'acc_demo_3', date: d(y, m-2, 8),  description: 'Netflix & Spotify', isDemo: true },
      { id: 'tx_d05', type: 'expense',  amount: 1_200_000, category: 'Tagihan',        accountId: 'acc_demo_1', date: d(y, m-2, 10), description: 'Sewa kos', isDemo: true },
      { id: 'tx_d06', type: 'expense',  amount: 180_000,   category: 'Kesehatan',      accountId: 'acc_demo_2', date: d(y, m-2, 15), description: 'Vitamin & suplemen', isDemo: true },
      { id: 'tx_d07', type: 'expense',  amount: 320_000,   category: 'Belanja',        accountId: 'acc_demo_3', date: d(y, m-2, 18), description: 'Baju & perlengkapan', isDemo: true },
      { id: 'tx_d08', type: 'expense',  amount: 150_000,   category: 'Pendidikan',     accountId: 'acc_demo_1', date: d(y, m-2, 20), description: 'Kursus online', isDemo: true },
      { id: 'tx_d09', type: 'income',   amount: 500_000,   category: 'Freelance',      accountId: 'acc_demo_1', date: d(y, m-2, 22), description: 'Proyek desain', isDemo: true },
      { id: 'tx_d10', type: 'transfer', amount: 300_000,   category: 'Transfer',       accountId: 'acc_demo_1', toAccountId: 'acc_demo_3', date: d(y, m-2, 25), description: 'Top up GoPay', isDemo: true },

      // ---- Last month ----
      { id: 'tx_d11', type: 'income',   amount: 4_500_000, category: 'Gaji',           accountId: 'acc_demo_1', date: d(y, m-1, 1),  description: 'Gaji bulanan', isDemo: true },
      { id: 'tx_d12', type: 'expense',  amount: 950_000,   category: 'Makanan',        accountId: 'acc_demo_1', date: d(y, m-1, 4),  description: 'Belanja bulanan', isDemo: true },
      { id: 'tx_d13', type: 'expense',  amount: 300_000,   category: 'Transportasi',   accountId: 'acc_demo_1', date: d(y, m-1, 6),  description: 'Bensin & Grab', isDemo: true },
      { id: 'tx_d14', type: 'expense',  amount: 250_000,   category: 'Hiburan',        accountId: 'acc_demo_3', date: d(y, m-1, 9),  description: 'Bioskop & streaming', isDemo: true },
      { id: 'tx_d15', type: 'expense',  amount: 1_200_000, category: 'Tagihan',        accountId: 'acc_demo_1', date: d(y, m-1, 10), description: 'Sewa kos', isDemo: true },
      { id: 'tx_d16', type: 'expense',  amount: 200_000,   category: 'Kesehatan',      accountId: 'acc_demo_2', date: d(y, m-1, 13), description: 'Obat & konsultasi', isDemo: true },
      { id: 'tx_d17', type: 'expense',  amount: 450_000,   category: 'Belanja',        accountId: 'acc_demo_3', date: d(y, m-1, 16), description: 'Sepatu baru', isDemo: true },
      { id: 'tx_d18', type: 'income',   amount: 750_000,   category: 'Freelance',      accountId: 'acc_demo_1', date: d(y, m-1, 20), description: 'Proyek web', isDemo: true },
      { id: 'tx_d19', type: 'expense',  amount: 180_000,   category: 'Makanan',        accountId: 'acc_demo_2', date: d(y, m-1, 22), description: 'Makan di luar', isDemo: true },
      { id: 'tx_d20', type: 'transfer', amount: 200_000,   category: 'Transfer',       accountId: 'acc_demo_1', toAccountId: 'acc_demo_2', date: d(y, m-1, 28), description: 'Tarik tunai', isDemo: true },

      // ---- This month ----
      { id: 'tx_d21', type: 'income',   amount: 4_500_000, category: 'Gaji',           accountId: 'acc_demo_1', date: d(y, m, 1),    description: 'Gaji bulanan', isDemo: true },
      { id: 'tx_d22', type: 'expense',  amount: 1_200_000, category: 'Tagihan',        accountId: 'acc_demo_1', date: d(y, m, 2),    description: 'Sewa kos', isDemo: true },
      { id: 'tx_d23', type: 'expense',  amount: 420_000,   category: 'Makanan',        accountId: 'acc_demo_1', date: d(y, m, 5),    description: 'Belanja supermarket', isDemo: true },
      { id: 'tx_d24', type: 'expense',  amount: 180_000,   category: 'Transportasi',   accountId: 'acc_demo_1', date: d(y, m, 7),    description: 'Bensin motor', isDemo: true },
      { id: 'tx_d25', type: 'expense',  amount: 250_000,   category: 'Hiburan',        accountId: 'acc_demo_3', date: d(y, m, 9),    description: 'Langganan streaming', isDemo: true },
      { id: 'tx_d26', type: 'expense',  amount: 350_000,   category: 'Makanan',        accountId: 'acc_demo_2', date: d(y, m, 11),   description: 'Makan di restoran', isDemo: true },
      { id: 'tx_d27', type: 'income',   amount: 300_000,   category: 'Lainnya',        accountId: 'acc_demo_1', date: d(y, m, 12),   description: 'Penjualan barang bekas', isDemo: true },
      { id: 'tx_d28', type: 'expense',  amount: 150_000,   category: 'Kesehatan',      accountId: 'acc_demo_2', date: d(y, m, 14),   description: 'Vitamin harian', isDemo: true },
    ].filter(t => {
      // Remove transactions with invalid dates (e.g. month goes negative)
      const parsed = new Date(t.date);
      return !isNaN(parsed.getTime());
    });

    // Budgets for current month
    const currentMonth = `${y}-${String(m + 1).padStart(2, '0')}`;
    const budgets = [
      { id: 'bgt_d1', category: 'Makanan',      amount: 1_200_000, month: currentMonth, isDemo: true },
      { id: 'bgt_d2', category: 'Transportasi', amount:   400_000, month: currentMonth, isDemo: true },
      { id: 'bgt_d3', category: 'Hiburan',       amount:   300_000, month: currentMonth, isDemo: true },
      { id: 'bgt_d4', category: 'Tagihan',       amount: 1_200_000, month: currentMonth, isDemo: true },
      { id: 'bgt_d5', category: 'Belanja',       amount:   500_000, month: currentMonth, isDemo: true },
      { id: 'bgt_d6', category: 'Kesehatan',     amount:   200_000, month: currentMonth, isDemo: true },
    ];

    // Savings goals
    const goals = [
      {
        id: 'goal_d1',
        name: 'Dana Darurat',
        targetAmount: 15_000_000,
        currentAmount: 3_500_000,
        targetDate: `${y + 1}-06-30`,
        description: '3x pengeluaran bulanan',
        isDemo: true,
      },
      {
        id: 'goal_d2',
        name: 'Liburan Bali',
        targetAmount: 5_000_000,
        currentAmount: 1_200_000,
        targetDate: `${y}-12-31`,
        description: 'Liburan akhir tahun',
        isDemo: true,
      },
    ];

    return { accounts, transactions, budgets, goals };
  },

  /**
   * Load demo data into storage if storage is empty.
   */
  loadIfEmpty() {
    const existingTx = Storage.getTransactions();
    const existingAcc = Storage.getAccounts();
    if (existingTx.length === 0 && existingAcc.length === 0) {
      this.load();
      return true;
    }
    return false;
  },

  /**
   * Force-load demo data (replaces existing).
   */
  load() {
    const { accounts, transactions, budgets, goals } = this.generate();
    Storage.setAccounts(accounts);
    Storage.setTransactions(transactions);
    Storage.setBudgets(budgets);
    Storage.setGoals(goals);
    Storage.setDemoMode(true);
  },

  /**
   * Clear all data (including demo data).
   */
  clear() {
    Storage.setAccounts([]);
    Storage.setTransactions([]);
    Storage.setBudgets([]);
    Storage.setGoals([]);
    Storage.setDemoMode(false);
  },
};
