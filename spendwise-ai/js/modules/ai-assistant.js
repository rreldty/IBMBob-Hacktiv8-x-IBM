/**
 * SpendWise AI - AI Financial Assistant Module
 *
 * Architecture:
 * - The assistant runs in DEMO MODE by default, using local financial calculations
 *   to answer questions. All responses are clearly labelled as "Mode Demo".
 * - If an OpenAI-compatible API key is configured in Settings, it uses that API
 *   to generate AI-powered responses enriched with the user's financial context.
 * - The assistant NEVER fabricates transactions, balances, or trends.
 * - It NEVER claims to be AI-connected when running in demo mode.
 * - Financial calculations are always performed locally first, then passed to
 *   the AI (if available) for natural language generation.
 */

const AIAssistant = (() => {
  const EXAMPLE_QUESTIONS = [
    'Uang saya paling banyak habis untuk apa bulan ini?',
    'Berapa total pengeluaran saya bulan ini?',
    'Kategori mana yang sudah melewati anggaran?',
    'Bandingkan pengeluaran saya bulan ini dengan bulan lalu.',
    'Pengeluaran apa yang bisa saya kurangi?',
    'Berapa batas pengeluaran harian saya sampai akhir bulan?',
    'Bantu saya membuat rencana menabung yang realistis.',
    'Bagaimana kondisi keuangan saya secara keseluruhan?',
  ];

  let _messages = []; // { role: 'user'|'assistant', text, timestamp }

  function render() {
    const page = document.getElementById('page-ai');
    if (!page) return;
    const settings   = AppState.get('settings');
    const isAiMode   = settings.aiMode === 'api' && settings.aiApiKey;
    const isDemoMode = AppState.get('isDemoMode');

    page.innerHTML = `
      <div class="flex flex-col h-full" style="min-height: calc(100vh - 8rem);">
        <!-- Header -->
        <div class="flex flex-wrap items-start justify-between gap-3 mb-4">
          <div>
            <h2 class="text-lg font-bold text-gray-800 flex items-center gap-2">
              <span class="text-xl">🤖</span> AI Financial Assistant
            </h2>
            <p class="text-xs text-gray-400 mt-0.5">Bertanya tentang keuangan Anda dalam Bahasa Indonesia</p>
          </div>
          <div class="flex items-center gap-2">
            <span class="px-3 py-1 rounded-full text-xs font-medium ${isAiMode ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'} border ${isAiMode ? 'border-emerald-200' : 'border-amber-200'}">
              ${isAiMode ? '✅ Mode AI Aktif' : '🔬 Mode Demo'}
            </span>
            ${!isAiMode ? `<button onclick="AppState.navigate('settings')" class="text-xs text-[#1e3a5f] underline">Aktifkan AI</button>` : ''}
          </div>
        </div>

        ${!isAiMode ? `
          <div class="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-700">
            <strong>Mode Demo Aktif:</strong> Asisten menggunakan perhitungan finansial lokal — bukan model AI eksternal. 
            Semua angka yang ditampilkan dihitung dari data Anda. Tidak ada koneksi ke layanan AI eksternal.
          </div>` : ''}

        <!-- Chat messages -->
        <div id="ai-chat" class="flex-1 overflow-y-auto space-y-4 mb-4 pr-1" style="max-height: 55vh; min-height: 280px;">
          ${_messages.length === 0 ? renderWelcome() : _messages.map(m => renderMessage(m)).join('')}
        </div>

        <!-- Example questions -->
        ${_messages.length === 0 ? `
          <div class="mb-4">
            <p class="text-xs text-gray-400 mb-2 font-medium">Contoh pertanyaan:</p>
            <div class="flex flex-wrap gap-2">
              ${EXAMPLE_QUESTIONS.slice(0, 6).map(q => `
                <button onclick="AIAssistant.sendQuestion(${JSON.stringify(q)})"
                  class="px-3 py-1.5 bg-white border border-gray-200 rounded-full text-xs text-gray-600 hover:border-[#1e3a5f] hover:text-[#1e3a5f] transition-all text-left">
                  ${UI.escHtml(q)}
                </button>`).join('')}
            </div>
          </div>` : ''}

        <!-- Input -->
        <div class="bg-white rounded-2xl border border-gray-200 shadow-sm p-3 flex gap-3 items-end">
          <textarea id="ai-input" rows="2" placeholder="Tanyakan sesuatu tentang keuangan Anda..."
            class="flex-1 resize-none text-sm text-gray-700 focus:outline-none leading-relaxed"
            onkeydown="AIAssistant.handleKey(event)"></textarea>
          <button onclick="AIAssistant.sendFromInput()" id="ai-send-btn"
            class="flex-shrink-0 bg-[#1e3a5f] text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-[#162d4a] transition-colors flex items-center gap-1.5">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/></svg>
            Kirim
          </button>
        </div>

        <!-- Clear button -->
        ${_messages.length > 0 ? `
          <button onclick="AIAssistant.clearChat()" class="mt-2 text-xs text-gray-400 hover:text-gray-600 transition-colors self-end">
            Bersihkan percakapan
          </button>` : ''}
      </div>
    `;
  }

  function renderWelcome() {
    return `
      <div class="flex items-start gap-3">
        <span class="w-8 h-8 rounded-full bg-[#1e3a5f] flex items-center justify-center text-white text-xs flex-shrink-0 mt-0.5">AI</span>
        <div class="bg-gray-50 rounded-2xl rounded-tl-sm px-4 py-3 max-w-lg">
          <p class="text-sm text-gray-700">
            Halo! Saya asisten keuangan SpendWise AI. Saya bisa membantu Anda menganalisis pengeluaran, memantau anggaran, 
            dan memberikan saran keuangan berdasarkan data Anda. Apa yang ingin Anda ketahui?
          </p>
          <p class="text-xs text-gray-400 mt-1.5">${new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</p>
        </div>
      </div>`;
  }

  function renderMessage(msg) {
    if (msg.role === 'user') {
      return `
        <div class="flex items-start gap-3 justify-end">
          <div class="bg-[#1e3a5f] rounded-2xl rounded-tr-sm px-4 py-3 max-w-lg">
            <p class="text-sm text-white">${UI.escHtml(msg.text)}</p>
            <p class="text-xs text-blue-200 mt-1.5 text-right">${msg.timestamp}</p>
          </div>
          <span class="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 text-xs flex-shrink-0 mt-0.5">Anda</span>
        </div>`;
    } else {
      return `
        <div class="flex items-start gap-3">
          <span class="w-8 h-8 rounded-full bg-[#1e3a5f] flex items-center justify-center text-white text-xs flex-shrink-0 mt-0.5">AI</span>
          <div class="bg-gray-50 rounded-2xl rounded-tl-sm px-4 py-3 max-w-lg">
            <div class="text-sm text-gray-700 whitespace-pre-wrap ai-response">${msg.text}</div>
            <p class="text-xs text-gray-400 mt-1.5">${msg.timestamp} ${msg.isDemo ? '· Mode Demo' : '· AI'}</p>
          </div>
        </div>`;
    }
  }

  function addMessage(role, text, isDemo = true) {
    _messages.push({
      role,
      text,
      timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
      isDemo,
    });
    refreshChat();
  }

  function refreshChat() {
    const chat = document.getElementById('ai-chat');
    if (!chat) return;
    chat.innerHTML = _messages.map(m => renderMessage(m)).join('');
    chat.scrollTop = chat.scrollHeight;

    // Hide example questions after first message
    const examplesEl = chat.nextElementSibling;
    if (examplesEl && _messages.length > 0) examplesEl.style.display = 'none';
  }

  // ---- Financial context builder ----
  function buildContext() {
    const transactions = AppState.get('transactions');
    const accounts     = AppState.get('accounts');
    const budgets      = AppState.get('budgets');
    const goals        = AppState.get('goals');
    const today        = new Date();
    const currentMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
    const lastMonth    = (() => {
      const d = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    })();

    const thisFrom = Finance.firstDayOfMonth(today.getFullYear(), today.getMonth());
    const thisTo   = Finance.lastDayOfMonth(today.getFullYear(), today.getMonth());
    const lastFrom = Finance.firstDayOfMonth(today.getFullYear(), today.getMonth() - 1);
    const lastTo   = Finance.lastDayOfMonth(today.getFullYear(), today.getMonth() - 1);

    const thisTx = Finance.filterByDateRange(transactions, thisFrom, thisTo);
    const lastTx = Finance.filterByDateRange(transactions, lastFrom, lastTo);

    const balances    = Finance.computeAccountBalances(accounts, transactions);
    const totalBalance = Object.values(balances).reduce((s, v) => s + v, 0);
    const thisIncome  = Finance.totalIncome(thisTx);
    const thisExpense = Finance.totalExpense(thisTx);
    const lastIncome  = Finance.totalIncome(lastTx);
    const lastExpense = Finance.totalExpense(lastTx);
    const thisCatExp  = Finance.expenseByCategory(thisTx);
    const lastCatExp  = Finance.expenseByCategory(lastTx);
    const monthBudgets = budgets.filter(b => b.month === currentMonth);
    // budgetSummaries[i] corresponds to monthBudgets[i]
    const budgetSummaries = monthBudgets.map(b => ({ ...Finance.budgetUsage(b, transactions), category: b.category, budgetAmount: b.amount }));
    const dailyLimit  = Finance.dailySpendingLimit(monthBudgets, transactions, currentMonth);

    return {
      today: today.toLocaleDateString('id-ID'),
      currentMonth: Finance.formatMonth(currentMonth),
      totalBalance, balances, accounts,
      thisMonth: { income: thisIncome, expense: thisExpense, byCategory: thisCatExp, tx: thisTx },
      lastMonth: { income: lastIncome, expense: lastExpense, byCategory: lastCatExp },
      budgets: monthBudgets, budgetSummaries, dailyLimit,
      goals,
      trends: Finance.monthlyTrends(transactions).slice(-6),
    };
  }

  // ---- Demo mode response engine ----
  function demoAnswer(question) {
    const q   = question.toLowerCase();
    const ctx = buildContext();
    const isDemoData = AppState.get('isDemoMode');

    const fmt = Finance.formatIDR;

    // Biggest expense category this month
    if (q.includes('paling banyak') || q.includes('terbesar') || q.includes('terbanyak')) {
      const cats = Object.entries(ctx.thisMonth.byCategory).sort((a, b) => b[1] - a[1]);
      if (!cats.length) return `Di bulan ${ctx.currentMonth}, belum ada data pengeluaran yang tercatat.`;
      const [topCat, topAmt] = cats[0];
      const pct = ctx.thisMonth.expense > 0 ? (topAmt / ctx.thisMonth.expense * 100).toFixed(1) : 0;
      let response = `Di bulan ${ctx.currentMonth}, pengeluaran terbesar Anda ada di kategori **${topCat}** sebesar ${fmt(topAmt)} (${pct}% dari total pengeluaran).\n\n`;
      response += `Rincian pengeluaran per kategori:\n`;
      cats.slice(0, 5).forEach(([c, v]) => {
        const p = ctx.thisMonth.expense > 0 ? (v / ctx.thisMonth.expense * 100).toFixed(0) : 0;
        response += `• ${c}: ${fmt(v)} (${p}%)\n`;
      });
      return response;
    }

    // Total expense this month
    if ((q.includes('total') || q.includes('berapa')) && (q.includes('pengeluaran') || q.includes('keluar')) && (q.includes('bulan ini') || !q.includes('bulan lalu'))) {
      return `Total pengeluaran Anda di bulan ${ctx.currentMonth} adalah **${fmt(ctx.thisMonth.expense)}**.\n\nTotal pemasukan: ${fmt(ctx.thisMonth.income)}\nSelisih (arus kas): ${fmt(ctx.thisMonth.income - ctx.thisMonth.expense)}\n\nCatatan: Transfer antar akun tidak dihitung sebagai pengeluaran.`;
    }

    // Budget exceeded
    if (q.includes('anggaran') && (q.includes('lewat') || q.includes('lampaui') || q.includes('melewati') || q.includes('melebihi') || q.includes('habis'))) {
      if (!ctx.budgets.length) return 'Anda belum membuat anggaran. Buat anggaran di menu Anggaran untuk memantau pengeluaran.';
      const exceeded = ctx.budgetSummaries.filter(s => s.status === 'exceeded');
      const warning  = ctx.budgetSummaries.filter(s => s.status === 'warning');
      if (!exceeded.length && !warning.length) {
        return `Selamat! 🎉 Semua anggaran bulan ${ctx.currentMonth} masih dalam batas aman.`;
      }
      let resp = '';
      if (exceeded.length) {
        resp += `⚠️ **Anggaran yang sudah melampaui batas:**\n`;
        exceeded.forEach(s => {
          resp += `• ${s.category}: terpakai ${fmt(s.spent)} dari ${fmt(s.budgetAmount)} (${Finance.formatPercent(s.percentage)})\n`;
        });
      }
      if (warning.length) {
        resp += `\n🔶 **Anggaran yang mendekati batas (>80%):**\n`;
        warning.forEach(s => {
          resp += `• ${s.category}: ${Finance.formatPercent(s.percentage)} terpakai\n`;
        });
      }
      return resp;
    }

    // Compare this month vs last month
    if (q.includes('bandingkan') || q.includes('dibanding') || q.includes('bulan lalu')) {
      if (ctx.lastMonth.expense === 0 && ctx.lastMonth.income === 0) {
        return `Data bulan lalu (${Finance.formatMonth(''+new Date(new Date().getFullYear(), new Date().getMonth()-1, 1).getFullYear()+'-'+String(new Date().getMonth()).padStart(2,'0'))}) tidak tersedia. Minimal diperlukan dua bulan data untuk perbandingan.`;
      }
      const expChange = ctx.lastMonth.expense > 0
        ? ((ctx.thisMonth.expense - ctx.lastMonth.expense) / ctx.lastMonth.expense * 100)
        : null;
      const incChange = ctx.lastMonth.income > 0
        ? ((ctx.thisMonth.income - ctx.lastMonth.income) / ctx.lastMonth.income * 100)
        : null;
      let resp = `**Perbandingan Bulan Ini vs Bulan Lalu:**\n\n`;
      resp += `Pengeluaran:\n• Bulan lalu: ${fmt(ctx.lastMonth.expense)}\n• Bulan ini: ${fmt(ctx.thisMonth.expense)}\n`;
      if (expChange !== null) resp += `• Perubahan: ${expChange >= 0 ? '+' : ''}${expChange.toFixed(1)}% ${expChange >= 0 ? '(naik)' : '(turun)'}\n`;
      resp += `\nPemasukan:\n• Bulan lalu: ${fmt(ctx.lastMonth.income)}\n• Bulan ini: ${fmt(ctx.thisMonth.income)}\n`;
      if (incChange !== null) resp += `• Perubahan: ${incChange >= 0 ? '+' : ''}${incChange.toFixed(1)}%\n`;
      return resp;
    }

    // Savings recommendation
    if (q.includes('hemat') || q.includes('kurangi') || q.includes('potong') || q.includes('rekomendasi')) {
      const cats = Object.entries(ctx.thisMonth.byCategory).sort((a, b) => b[1] - a[1]);
      if (!cats.length) return 'Belum ada data pengeluaran bulan ini untuk memberikan rekomendasi.';
      let resp = `Berdasarkan pengeluaran Anda bulan ${ctx.currentMonth}, berikut beberapa rekomendasi:\n\n`;
      const discretionary = cats.filter(([c]) => ['Hiburan', 'Belanja', 'Makanan'].includes(c));
      if (discretionary.length) {
        resp += `Kategori yang berpotensi dihemat:\n`;
        discretionary.forEach(([c, v]) => {
          resp += `• **${c}**: ${fmt(v)} — pertimbangkan mengurangi 10–20% untuk menghemat ${fmt(v * 0.15)} per bulan.\n`;
        });
      }
      const exceeded = ctx.budgetSummaries.filter(s => s.status === 'exceeded');
      if (exceeded.length) {
        resp += `\nPrioritaskan pengendalian pada kategori yang melampaui anggaran.`;
      }
      resp += `\n\n*Ini adalah saran berdasarkan data historis Anda, bukan nasihat keuangan profesional.*`;
      return resp;
    }

    // Daily spending limit
    if (q.includes('harian') || q.includes('per hari') || q.includes('batas') && q.includes('hari')) {
      const dl = ctx.dailyLimit;
      if (!dl.totalBudgeted) {
        return `Anda belum membuat anggaran untuk ${ctx.currentMonth}. Buat anggaran terlebih dahulu agar bisa menghitung batas pengeluaran harian.`;
      }
      return `**Estimasi Batas Pengeluaran Harian (${ctx.currentMonth}):**\n\n` +
        `• Total anggaran: ${fmt(dl.totalBudgeted)}\n` +
        `• Sudah terpakai: ${fmt(dl.totalSpent)}\n` +
        `• Sisa anggaran: ${fmt(dl.remaining)}\n` +
        `• Sisa hari di bulan ini: ${dl.daysLeft} hari\n\n` +
        `**Batas pengeluaran harian: ${fmt(dl.dailyLimit)}**\n\n` +
        `*Asumsi: Sisa anggaran dibagi merata hingga akhir bulan. Tidak termasuk saldo akun yang bukan bagian dari anggaran.*`;
    }

    // Savings plan
    if (q.includes('menabung') || q.includes('tabungan') || q.includes('rencana') || q.includes('target')) {
      const totalSaved = ctx.goals.reduce((s, g) => s + g.currentAmount, 0);
      const totalTarget = ctx.goals.reduce((s, g) => s + g.targetAmount, 0);
      const savingsRate = ctx.thisMonth.income > 0
        ? ((ctx.thisMonth.income - ctx.thisMonth.expense) / ctx.thisMonth.income * 100)
        : null;
      let resp = `**Rencana Menabung Berdasarkan Data Anda:**\n\n`;
      if (ctx.goals.length) {
        resp += `Target tabungan aktif:\n`;
        ctx.goals.forEach(g => {
          const p = Finance.goalProgress(g);
          resp += `• ${g.name}: ${fmt(g.currentAmount)} / ${fmt(g.targetAmount)} (${p.percentage.toFixed(0)}%)`;
          if (p.requiredMonthly && p.remaining > 0) resp += ` — perlu menabung ${fmt(p.requiredMonthly)}/bulan`;
          resp += `\n`;
        });
        resp += `\n`;
      }
      if (savingsRate !== null) {
        resp += `Tingkat tabungan saat ini: ${savingsRate.toFixed(1)}% dari pemasukan\n`;
        if (savingsRate < 20) resp += `Idealnya, alokasikan minimal 20% dari pemasukan untuk tabungan.\n`;
        else resp += `Bagus! Tingkat tabungan Anda sudah di atas 20%.\n`;
      }
      resp += `\n*Perkiraan ini berdasarkan pola pemasukan dan pengeluaran Anda. Konsultasikan dengan perencana keuangan untuk rencana yang lebih komprehensif.*`;
      return resp;
    }

    // Overall financial health
    if (q.includes('kondisi') || q.includes('situasi') || q.includes('keseluruhan') || q.includes('ringkasan') || q.includes('summary')) {
      const savingsRate = ctx.thisMonth.income > 0
        ? ((ctx.thisMonth.income - ctx.thisMonth.expense) / ctx.thisMonth.income * 100)
        : null;
      const healthStatus = savingsRate === null ? 'tidak dapat dihitung' : savingsRate >= 20 ? '✅ Baik' : savingsRate >= 10 ? '⚠️ Cukup' : '❗ Perlu perhatian';
      const exceededBudgets = ctx.budgetSummaries.filter(s => s.status === 'exceeded').length;
      let resp = `**Ringkasan Kondisi Keuangan Anda (${ctx.currentMonth}):**\n\n`;
      resp += `💰 Total saldo seluruh akun: **${fmt(ctx.totalBalance)}**\n`;
      resp += `📈 Pemasukan bulan ini: ${fmt(ctx.thisMonth.income)}\n`;
      resp += `📉 Pengeluaran bulan ini: ${fmt(ctx.thisMonth.expense)}\n`;
      resp += `💾 Arus kas bersih: ${fmt(ctx.thisMonth.income - ctx.thisMonth.expense)}\n`;
      if (savingsRate !== null) resp += `📊 Tingkat tabungan: ${savingsRate.toFixed(1)}% — ${healthStatus}\n`;
      if (ctx.budgets.length) resp += `\n📋 Anggaran melampaui batas: ${exceededBudgets} dari ${ctx.budgets.length} kategori\n`;
      if (ctx.goals.length) resp += `🎯 Target tabungan aktif: ${ctx.goals.length}\n`;
      return resp;
    }

    // Balance query
    if (q.includes('saldo') || q.includes('balance') || q.includes('simpanan')) {
      let resp = `**Saldo Akun Anda:**\n\n`;
      ctx.accounts.forEach(a => {
        const bal = ctx.balances[a.id] || 0;
        resp += `• ${a.name}: **${fmt(bal)}**\n`;
      });
      resp += `\n**Total Saldo: ${fmt(ctx.totalBalance)}**`;
      return resp;
    }

    // Fallback
    return `Maaf, saya belum dapat memahami pertanyaan tersebut dengan tepat. Saya dapat membantu dengan:\n\n` +
      `• Analisis pengeluaran berdasarkan kategori\n` +
      `• Perbandingan pemasukan dan pengeluaran\n` +
      `• Status anggaran\n` +
      `• Estimasi batas pengeluaran harian\n` +
      `• Rekomendasi penghematan\n` +
      `• Rencana tabungan\n\n` +
      `Coba tanyakan salah satu topik di atas!`;
  }

  // ---- API mode ----
  async function apiAnswer(question) {
    const settings = AppState.get('settings');
    const ctx = buildContext();

    // Build financial summary for AI context
    const financialSummary = `
Data keuangan pengguna (${ctx.today}):
- Total saldo semua akun: ${Finance.formatIDR(ctx.totalBalance)}
- Pemasukan bulan ini (${ctx.currentMonth}): ${Finance.formatIDR(ctx.thisMonth.income)}
- Pengeluaran bulan ini: ${Finance.formatIDR(ctx.thisMonth.expense)}
- Pengeluaran per kategori bulan ini: ${JSON.stringify(ctx.thisMonth.byCategory)}
- Pengeluaran bulan lalu: ${Finance.formatIDR(ctx.lastMonth.expense)}
- Jumlah anggaran aktif: ${ctx.budgets.length}
- Anggaran melampaui batas: ${ctx.budgetSummaries.filter(s => s.status === 'exceeded').length}
- Batas pengeluaran harian (estimasi): ${Finance.formatIDR(ctx.dailyLimit.dailyLimit)}
- Target tabungan aktif: ${ctx.goals.length}
    `.trim();

    const systemPrompt = `Anda adalah asisten keuangan pribadi SpendWise AI. Jawablah dalam Bahasa Indonesia yang jelas dan mudah dipahami.
Gunakan data keuangan pengguna yang diberikan untuk menjawab pertanyaan secara akurat.
JANGAN mengarang angka yang tidak ada dalam data. JANGAN memberi saran investasi spesifik.
Berikan jawaban yang ringkas, praktis, dan didukung angka dari data pengguna.

${financialSummary}`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${settings.aiApiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          ..._messages.slice(-10).map(m => ({ role: m.role === 'assistant' ? 'assistant' : 'user', content: m.text })),
          { role: 'user', content: question },
        ],
        max_tokens: 800,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error?.message || `HTTP ${response.status}`);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || 'Tidak ada respons dari API.';
  }

  async function processQuestion(question) {
    if (!question.trim()) return;

    addMessage('user', question);

    const settings = AppState.get('settings');
    const useApi   = settings.aiMode === 'api' && settings.aiApiKey;

    // Show typing indicator
    const chat = document.getElementById('ai-chat');
    const typingId = 'typing-indicator';
    if (chat) {
      const typingDiv = document.createElement('div');
      typingDiv.id = typingId;
      typingDiv.className = 'flex items-start gap-3';
      typingDiv.innerHTML = `
        <span class="w-8 h-8 rounded-full bg-[#1e3a5f] flex items-center justify-center text-white text-xs flex-shrink-0 mt-0.5">AI</span>
        <div class="bg-gray-50 rounded-2xl rounded-tl-sm px-4 py-3">
          <div class="flex gap-1 items-center h-4">
            <span class="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style="animation-delay:0ms"></span>
            <span class="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style="animation-delay:150ms"></span>
            <span class="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style="animation-delay:300ms"></span>
          </div>
        </div>`;
      chat.appendChild(typingDiv);
      chat.scrollTop = chat.scrollHeight;
    }

    try {
      let answer;
      let isDemo = true;
      if (useApi) {
        try {
          answer = await apiAnswer(question);
          isDemo = false;
        } catch (apiErr) {
          console.warn('API error, falling back to demo mode:', apiErr.message);
          answer = demoAnswer(question) + `\n\n⚠️ *Catatan: Koneksi ke API gagal (${apiErr.message}). Jawaban menggunakan Mode Demo.*`;
          isDemo = true;
        }
      } else {
        // Small delay for UX
        await new Promise(r => setTimeout(r, 600));
        answer = demoAnswer(question);
      }

      document.getElementById(typingId)?.remove();
      addMessage('assistant', answer, isDemo);
    } catch (err) {
      document.getElementById(typingId)?.remove();
      addMessage('assistant', `Terjadi kesalahan: ${err.message}. Silakan coba lagi.`, true);
    }
  }

  return {
    render,
    sendQuestion(q) {
      processQuestion(q);
    },
    sendFromInput() {
      const input = document.getElementById('ai-input');
      if (!input) return;
      const q = input.value.trim();
      if (!q) return;
      input.value = '';
      processQuestion(q);
    },
    handleKey(e) {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this.sendFromInput();
      }
    },
    clearChat() {
      _messages = [];
      render();
    },
  };
})();
