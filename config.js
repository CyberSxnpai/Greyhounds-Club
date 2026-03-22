// ═══════════════════════════════════════════════
// GREYHOUNDS CLUB — Konfigurace
// ═══════════════════════════════════════════════

const CONFIG = {
  // ID tvého Google Sheets souboru
  SHEETS_ID: '1-6BGWJ44p3UvKkf9z-i4y2Ir8XgoCE58E-_BMCITdJk',

  // Názvy listů (musí přesně odpovídat názvům v Sheets)
  SHEETS: {
    KLIENTI:     '🧑 Klienti',
    NAVSTEVY:    '📅 Návštěvy',
    HOJENI:      '🩹 Hojení',
    ODMENY:      '🏅 Odměny',
    AKCE:        '📢 Akce',
    UMELCI:      '🎨 Umělci',
    DOPORUCENI:  '👥 Doporučení',
  },

  // Tier systém
  TIERS: [
    { name: 'Bronze', min: 0,    max: 749,   next: 'Silver', color: '#cd7f32' },
    { name: 'Silver', min: 750,  max: 1499,  next: 'Gold',   color: '#c9c9c9' },
    { name: 'Gold',   min: 1500, max: 2999,  next: 'VIP',    color: '#c9a84c' },
    { name: 'VIP',    min: 3000, max: 99999, next: null,     color: '#9b59b6' },
  ],

  // Emoji pro typy služeb
  SERVICE_EMOJI: {
    'Tetování': '🎨',
    'Piercing': '💎',
    'Beauty': '💅',
    'PMU': '✨',
    'default': '⭐'
  },

  // Emoji pro typy akcí
  EVENT_EMOJI: {
    'Flash Day': '⚡',
    'Novinka': '📢',
    'Akce': '🎉',
    'Guest Artist': '🌟',
    'Tip': '💡',
    'default': '📌'
  }
};
