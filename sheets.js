// ═══════════════════════════════════════════════
// GREYHOUNDS CLUB — Google Sheets connector
// Čte data z veřejně sdíleného Google Sheets
// ═══════════════════════════════════════════════

const Sheets = {

  // Cache pro data
  _cache: {},
  _cacheTime: {},
  CACHE_TTL: 5 * 60 * 1000, // 5 minut

  // Načte list ze Sheets jako pole objektů
  async getSheet(sheetName) {
    const cacheKey = sheetName;
    const now = Date.now();

    // Vrať z cache pokud je čerstvá
    if (this._cache[cacheKey] && (now - this._cacheTime[cacheKey]) < this.CACHE_TTL) {
      return this._cache[cacheKey];
    }

    try {
      const encodedName = encodeURIComponent(sheetName);
      const url = `https://docs.google.com/spreadsheets/d/${CONFIG.SHEETS_ID}/gviz/tq?tqx=out:json&sheet=${encodedName}`;

      const res = await fetch(url);
      const text = await res.text();

      // Google vrací JSONP — odstraníme wrapper
      const json = JSON.parse(text.substring(text.indexOf('{'), text.lastIndexOf('}') + 1));

      if (!json.table || !json.table.rows) return [];

      // Získej hlavičky (první řádek)
      const headers = json.table.cols.map(col => col.label || '');

      // Převeď řádky na objekty
      const rows = json.table.rows.map(row => {
        const obj = {};
        headers.forEach((header, i) => {
          if (!header) return;
          const cell = row.c && row.c[i];
          if (cell === null || cell === undefined) {
            obj[header] = '';
          } else if (cell.v !== null && cell.v !== undefined) {
            obj[header] = cell.v;
          } else {
            obj[header] = '';
          }
        });
        return obj;
      });

      // Filtruj prázdné řádky
      const filtered = rows.filter(row => Object.values(row).some(v => v !== '' && v !== null));

      this._cache[cacheKey] = filtered;
      this._cacheTime[cacheKey] = now;

      return filtered;

    } catch (err) {
      console.error('Sheets error:', err);
      return this._cache[cacheKey] || [];
    }
  },

  // Najde klienta podle emailu
  async getKlientByEmail(email) {
    const klienti = await this.getSheet(CONFIG.SHEETS.KLIENTI);
    return klienti.find(k =>
      (k['Email'] || '').toLowerCase().trim() === email.toLowerCase().trim()
    ) || null;
  },

  // Načte návštěvy klienta
  async getNavstevy(klientId) {
    const navstevy = await this.getSheet(CONFIG.SHEETS.NAVSTEVY);
    return navstevy.filter(n => n['Klient ID'] === klientId);
  },

  // Načte hojení klienta
  async getHojeni(klientId) {
    const hojeni = await this.getSheet(CONFIG.SHEETS.HOJENI);
    return hojeni.filter(h => h['Klient ID'] === klientId);
  },

  // Načte aktivní odměny
  async getOdmeny() {
    const odmeny = await this.getSheet(CONFIG.SHEETS.ODMENY);
    return odmeny
      .filter(o => o['Aktivní'] === true || o['Aktivní'] === 'TRUE' || o['Aktivní'] === 1)
      .sort((a, b) => (a['Pořadí'] || 0) - (b['Pořadí'] || 0));
  },

  // Načte aktivní akce
  async getAkce() {
    const akce = await this.getSheet(CONFIG.SHEETS.AKCE);
    return akce
      .filter(a => a['Aktivní'] === true || a['Aktivní'] === 'TRUE' || a['Aktivní'] === 1)
      .sort((a, b) => new Date(a['Datum']) - new Date(b['Datum']));
  },

  // Načte umělce
  async getUmelci() {
    return await this.getSheet(CONFIG.SHEETS.UMELCI);
  },

  // Načte doporučení klienta
  async getDoporuceni(klientId) {
    const d = await this.getSheet(CONFIG.SHEETS.DOPORUCENI);
    return d.filter(x => x['Doporučil (Klient ID)'] === klientId);
  },

  // Vyčisti cache
  clearCache() {
    this._cache = {};
    this._cacheTime = {};
  }
};
