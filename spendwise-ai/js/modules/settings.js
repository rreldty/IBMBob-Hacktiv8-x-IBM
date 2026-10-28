/**
 * SpendWise AI - Settings Module
 */

const SettingsModule = (() => {
  function render() {
    const page     = document.getElementById('page-settings');
    if (!page) return;
    const settings  = AppState.get('settings');
    const isDemoMode = AppState.get('isDemoMode');

    page.innerHTML = `
      <h2 class="text-lg font-bold text-gray-800 mb-5">Pengaturan</h2>

      <div class="space-y-4 max-w-2xl">
        <!-- Data management -->
        <div class="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h3 class="text-sm font-semibold text-gray-700 mb-4">Manajemen Data</h3>
          <div class="space-y-3">
            <div class="flex items-center justify-between py-2">
              <div>
                <p class="text-sm font-medium text-gray-700">Mode Demo</p>
                <p class="text-xs text-gray-400">Data saat ini adalah ${isDemoMode ? '⚠️ data contoh' : '✅ data Anda'}</p>
              </div>
              <span class="px-3 py-1 rounded-full text-xs font-medium ${isDemoMode ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}">
                ${isDemoMode ? 'Demo Aktif' : 'Data Asli'}
              </span>
            </div>
            <div class="border-t border-gray-50 pt-3 flex flex-col sm:flex-row gap-3">
              <button onclick="SettingsModule.resetDemo()" 
                class="flex-1 px-4 py-2.5 rounded-xl border border-amber-200 text-amber-700 text-sm font-medium hover:bg-amber-50 transition-colors">
                🔄 Reset ke Data Demo
              </button>
              <button onclick="SettingsModule.confirmClear()" 
                class="flex-1 px-4 py-2.5 rounded-xl border border-red-200 text-red-600 text-sm font-medium hover:bg-red-50 transition-colors">
                🗑️ Hapus Semua Data
              </button>
            </div>
            <p class="text-xs text-gray-400">Reset data demo akan menimpa semua transaksi, akun, anggaran, dan target yang ada.</p>
          </div>
        </div>

        <!-- AI Configuration -->
        <div class="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h3 class="text-sm font-semibold text-gray-700 mb-1">Konfigurasi AI Assistant</h3>
          <p class="text-xs text-gray-400 mb-4">
            Aktifkan integrasi dengan OpenAI untuk mendapatkan respons AI yang lebih canggih. 
            API key disimpan hanya di browser Anda (localStorage) dan tidak dikirim ke server selain OpenAI.
            <strong class="text-gray-600">Jangan gunakan di komputer publik.</strong>
          </p>
          
          <div class="space-y-3">
            <div>
              <label class="block text-xs font-medium text-gray-600 mb-2">Mode Asisten</label>
              <div class="flex gap-2">
                <button onclick="SettingsModule.setAiMode('demo')" 
                  class="flex-1 py-2 rounded-xl text-sm font-medium border transition-all ${settings.aiMode !== 'api' ? 'bg-[#1e3a5f] text-white border-[#1e3a5f]' : 'bg-white text-gray-600 border-gray-200 hover:border-[#1e3a5f]'}">
                  🔬 Mode Demo
                </button>
                <button onclick="SettingsModule.setAiMode('api')" 
                  class="flex-1 py-2 rounded-xl text-sm font-medium border transition-all ${settings.aiMode === 'api' ? 'bg-[#1e3a5f] text-white border-[#1e3a5f]' : 'bg-white text-gray-600 border-gray-200 hover:border-[#1e3a5f]'}">
                  🤖 Mode API (OpenAI)
                </button>
              </div>
            </div>

            <div id="api-key-section" class="${settings.aiMode === 'api' ? '' : 'hidden'}">
              <label class="block text-xs font-medium text-gray-600 mb-1">OpenAI API Key</label>
              <div class="flex gap-2">
                <input type="password" id="api-key-input" 
                  value="${settings.aiApiKey ? '•'.repeat(Math.min(settings.aiApiKey.length, 20)) : ''}"
                  placeholder="sk-..."
                  class="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]">
                <button onclick="SettingsModule.saveApiKey()" class="btn-primary text-sm px-4">Simpan</button>
              </div>
              <p class="text-xs text-red-500 mt-1">
                ⚠️ API key disimpan di localStorage browser Anda. Jangan gunakan di perangkat umum atau bersama.
              </p>
              ${settings.aiApiKey ? `<p class="text-xs text-emerald-600 mt-1">✅ API key tersimpan</p>` : ''}
            </div>

            <div class="p-3 bg-gray-50 rounded-xl text-xs text-gray-500">
              <strong>Mode Demo:</strong> Menggunakan perhitungan finansial lokal. Tidak ada koneksi ke AI eksternal. Semua jawaban dihitung dari data Anda.<br><br>
              <strong>Mode API:</strong> Menggunakan OpenAI GPT-4o-mini untuk menghasilkan respons. Memerlukan API key yang valid. Konteks keuangan (tanpa data sensitif seperti nama lengkap) dikirim ke OpenAI.
            </div>
          </div>
        </div>

        <!-- App info -->
        <div class="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h3 class="text-sm font-semibold text-gray-700 mb-3">Tentang SpendWise AI</h3>
          <div class="space-y-1.5 text-xs text-gray-500">
            <p>Versi: 1.0.0</p>
            <p>Data disimpan di: localStorage browser Anda</p>
            <p>Framework: Vanilla JavaScript + Tailwind CSS</p>
            <p>Grafik: Chart.js</p>
            <p>AI: OpenAI GPT-4o-mini (opsional) / Mode Demo lokal</p>
          </div>
          <div class="mt-4 p-3 bg-blue-50 rounded-xl text-xs text-blue-700">
            <strong>Batasan:</strong> Data hanya tersimpan di browser ini. Membersihkan data browser akan menghapus semua data aplikasi. 
            Gunakan fitur ekspor (jika tersedia) untuk backup data Anda.
          </div>
        </div>
      </div>
    `;
  }

  return {
    render,
    setAiMode(mode) {
      AppState.updateSettings({ aiMode: mode });
      const apiSection = document.getElementById('api-key-section');
      if (apiSection) apiSection.classList.toggle('hidden', mode !== 'api');
      render();
    },
    saveApiKey() {
      const input = document.getElementById('api-key-input');
      if (!input) return;
      const key = input.value.trim();
      // Don't save if it's the masked placeholder
      if (key.startsWith('•')) { UI.toast('API key tidak diubah', 'info'); return; }
      if (key && !key.startsWith('sk-')) {
        UI.toast('API key OpenAI harus dimulai dengan "sk-"', 'error');
        return;
      }
      AppState.updateSettings({ aiApiKey: key });
      UI.toast(key ? 'API key berhasil disimpan' : 'API key dihapus', 'success');
      render();
    },
    resetDemo() {
      UI.confirm(
        'Reset semua data ke data demonstrasi? Data Anda saat ini akan terhapus.',
        () => {
          AppState.resetToDemo();
          UI.toast('Data berhasil direset ke mode demo', 'success');
          render();
        },
        'Reset Data Demo'
      );
    },
    confirmClear() {
      UI.confirm(
        'Hapus SEMUA data? Ini tidak dapat dibatalkan. Semua transaksi, akun, anggaran, dan target akan dihapus.',
        () => {
          AppState.clearAllData();
          UI.toast('Semua data berhasil dihapus', 'success');
          render();
        },
        'Hapus Semua'
      );
    },
  };
})();
