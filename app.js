// ═══════════════════════════════════════════════
// GREYHOUNDS CLUB — Hlavní logika appky
// ═══════════════════════════════════════════════

// Aktuální stav
let currentUser = null;
let allEvents = [];

// ─── INICIALIZACE ───────────────────────────────
window.addEventListener('load', async () => {
  // Zkontroluj přihlášení
  const savedEmail = localStorage.getItem('gh_email');
  const savedName = localStorage.getItem('gh_name');
  const savedId = localStorage.getItem('gh_id');

  if (savedEmail && savedId) {
    currentUser = { email: savedEmail, name: savedName, id: savedId };
    hideSplash();
    showMainApp();
    await loadAllData();
  } else {
    hideSplash();
    showLoginScreen();
  }
});

function hideSplash() {
  setTimeout(() => {
    const splash = document.getElementById('splash');
    splash.style.opacity = '0';
    setTimeout(() => splash.classList.add('hidden'), 500);
  }, 1500);
}

// ─── LOGIN ───────────────────────────────────────
async function login() {
  const emailInput = document.getElementById('login-email');
  const errorEl = document.getElementById('login-error');
  const btn = document.getElementById('login-btn');
  const email = emailInput.value.trim();

  if (!email) {
    errorEl.textContent = 'Zadej prosím svůj email.';
    errorEl.classList.remove('hidden');
    return;
  }

  btn.textContent = 'Ověřuji...';
  btn.disabled = true;
  errorEl.classList.add('hidden');

  try {
    const klient = await Sheets.getKlientByEmail(email);

    if (klient) {
      currentUser = {
        email: klient['Email'],
        name: klient['Jméno'],
        id: klient['ID Klienta']
      };
      localStorage.setItem('gh_email', currentUser.email);
      localStorage.setItem('gh_name', currentUser.name);
      localStorage.setItem('gh_id', currentUser.id);

      document.getElementById('login-screen').classList.add('hidden');
      showMainApp();
      await loadAllData();
    } else {
      errorEl.textContent = 'Email nenalezen. Kontaktuj studio — přidáme tě do klubu!';
      errorEl.classList.remove('hidden');
      btn.textContent = 'Přihlásit se';
      btn.disabled = false;
    }
  } catch (err) {
    errorEl.textContent = 'Chyba připojení. Zkus to znovu.';
    errorEl.classList.remove('hidden');
    btn.textContent = 'Přihlásit se';
    btn.disabled = false;
  }
}

// Enter key na loginu
document.addEventListener('DOMContentLoaded', () => {
  const emailInput = document.getElementById('login-email');
  if (emailInput) {
    emailInput.addEventListener('keypress', e => { if (e.key === 'Enter') login(); });
  }
});

function showLoginScreen() {
  document.getElementById('login-screen').classList.remove('hidden');
}

function showMainApp() {
  document.getElementById('main-app').classList.remove('hidden');
}

// ─── NAVIGACE ────────────────────────────────────
function showPage(name) {
  document.querySelectorAll('.page').forEach(p => p.classList.add('hidden'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  document.getElementById('page-' + name).classList.remove('hidden');
  document.getElementById('nav-' + name).classList.add('active');
  document.getElementById('page-' + name).scrollTop = 0;
}

// ─── NAČTENÍ DAT ─────────────────────────────────
async function loadAllData() {
  if (!currentUser) return;
  await Promise.all([
    loadKlientData(),
    loadHojeni(),
    loadGallery(),
    loadEvents(),
    loadRewards(),
  ]);
}

// ─── KLIENT DATA ─────────────────────────────────
async function loadKlientData() {
  try {
    const klienti = await Sheets.getSheet(CONFIG.SHEETS.KLIENTI);
    const klient = klienti.find(k => k['ID Klienta'] === currentUser.id);
    if (!klient) return;

    // Jméno
    const parts = (klient['Jméno'] || '').split(' ');
    const firstName = parts[0] || '';
    const lastName = parts.slice(1).join(' ') || '';
    document.getElementById('username-display').innerHTML = `${firstName} <span>${lastName}</span>`;

    // Pozdrav
    const hour = new Date().getHours();
    let greet = hour < 12 ? 'Dobré ráno' : hour < 18 ? 'Dobrý den' : 'Dobrý večer';
    document.getElementById('greeting').textContent = greet;

    // Body
    const body = parseInt(klient['Body celkem'] || 0);
    document.getElementById('card-points').textContent = body;
    document.getElementById('hero-points').textContent = body;

    // Tier
    const tier = getTier(body);
    document.getElementById('card-tier').textContent = `✦ ${tier.name}`;
    document.getElementById('tier-label').textContent = `${tier.name} tier`;

    if (tier.next) {
      const remaining = tier.max + 1 - body;
      document.getElementById('tier-next').textContent = `${remaining} bodů do ${tier.next}`;
      document.getElementById('hero-next').innerHTML = `Ještě <strong>${remaining} bodů</strong> do ${tier.next}`;
      const pct = ((body - tier.min) / (tier.max - tier.min + 1)) * 100;
      document.getElementById('progress-fill').style.width = Math.min(pct, 100) + '%';
    } else {
      document.getElementById('tier-next').textContent = 'Nejvyšší tier! 👑';
      document.getElementById('hero-next').innerHTML = '<strong>Nejvyšší tier VIP! 👑</strong>';
      document.getElementById('progress-fill').style.width = '100%';
    }

    // Umělec
    const umelci = await Sheets.getUmelci();
    const umelecId = klient['Umělec ID'];
    const umelec = umelci.find(u => u['ID'] === umelecId);
    document.getElementById('card-artist').textContent = umelec ? umelec['Jméno'] : '—';
    document.getElementById('card-id').textContent = `#${currentUser.id}`;

    // Statistiky
    const navstevy = await Sheets.getNavstevy(currentUser.id);
    document.getElementById('stat-navstevy').textContent = navstevy.length;
    document.getElementById('stat-tetovani').textContent = navstevy.filter(n => n['Typ služby'] === 'Tetování').length;

    const doporuceni = await Sheets.getDoporuceni(currentUser.id);
    document.getElementById('stat-doporuceni').textContent = doporuceni.length;

  } catch (err) {
    console.error('Klient data error:', err);
  }
}

function getTier(body) {
  for (const tier of CONFIG.TIERS) {
    if (body >= tier.min && body <= tier.max) return tier;
  }
  return CONFIG.TIERS[0];
}

// ─── HOJENÍ ──────────────────────────────────────
async function loadHojeni() {
  try {
    const hojeni = await Sheets.getHojeni(currentUser.id);
    const navstevy = await Sheets.getNavstevy(currentUser.id);

    // Home preview
    const homeList = document.getElementById('home-healing-list');
    // Full page
    const fullList = document.getElementById('healing-list');

    if (hojeni.length === 0) {
      homeList.innerHTML = '<div class="empty-state">Zatím žádné záznamy hojení</div>';
      fullList.innerHTML = '<div class="empty-state">Záznamy hojení se objeví po tvé první návštěvě</div>';
      return;
    }

    let homeHtml = '';
    let fullHtml = '';

    hojeni.forEach(h => {
      const navsteva = navstevy.find(n => n['ID návštěvy'] === h['Návštěva ID']);
      const popis = navsteva ? navsteva['Popis zákroku'] : h['Návštěva ID'];
      const typSluzby = navsteva ? navsteva['Typ služby'] : 'Tetování';
      const emoji = CONFIG.SERVICE_EMOJI[typSluzby] || CONFIG.SERVICE_EMOJI.default;
      const isHealing = h['Status'] === 'Hojí se';
      const den = parseInt(h['Aktuální den'] || 1);
      const komentar = h['Komentář umělce'] || '';
      const datumStr = formatDate(h['Datum zahájení']);

      // Dny indikátory
      let dnyHtml = '';
      const totalDays = isHealing ? Math.max(den + 2, 8) : den;
      for (let d = 1; d <= Math.min(totalDays, 10); d++) {
        if (d < den) dnyHtml += `<div class="day-dot day-done">${d}</div>`;
        else if (d === den) dnyHtml += `<div class="day-dot day-today">${d}</div>`;
        else dnyHtml += `<div class="day-dot day-future">${d}</div>`;
      }

      const cardHtml = `
        <div class="healing-card">
          <div class="healing-header">
            <div class="healing-thumb">${emoji}</div>
            <div class="healing-info">
              <div class="healing-name">${popis}</div>
              <div class="healing-sub">${datumStr}</div>
            </div>
            <div class="healing-badge ${isHealing ? 'badge-healing' : 'badge-done'}">
              ${isHealing ? 'Hojí se' : 'Zahojeno ✓'}
            </div>
          </div>
          ${isHealing ? `<div class="healing-days">${dnyHtml}</div>` : ''}
          ${komentar ? `<div class="comment-box" style="margin:0 16px 14px;"><div class="comment-from">💬 Umělec</div><div class="comment-text">${komentar}</div></div>` : ''}
        </div>`;

      homeHtml += cardHtml;
      fullHtml += cardHtml;
    });

    homeList.innerHTML = homeHtml;
    fullList.innerHTML = fullHtml;

  } catch (err) {
    console.error('Hojení error:', err);
  }
}

// ─── GALERIE ─────────────────────────────────────
async function loadGallery() {
  try {
    const navstevy = await Sheets.getNavstevy(currentUser.id);
    const galleryEl = document.getElementById('gallery-list');

    if (navstevy.length === 0) {
      galleryEl.innerHTML = '<div class="empty-state">Tvoje galerie bude plná po první návštěvě 🎨</div>';
      return;
    }

    // Seskup po letech
    const byYear = {};
    navstevy.sort((a, b) => new Date(b['Datum']) - new Date(a['Datum'])).forEach(n => {
      const year = new Date(n['Datum']).getFullYear() || 'Neznámo';
      if (!byYear[year]) byYear[year] = [];
      byYear[year].push(n);
    });

    let html = '';
    const isFirstYear = true;
    Object.keys(byYear).sort((a, b) => b - a).forEach((year, yi) => {
      html += `<div class="year-label">${year}</div>`;
      byYear[year].forEach((n, i) => {
        const emoji = CONFIG.SERVICE_EMOJI[n['Typ služby']] || CONFIG.SERVICE_EMOJI.default;
        const isRecent = yi === 0 && i === 0;
        html += `
          <div class="gallery-entry">
            <div class="ge-header">
              <div class="ge-dot ${isRecent ? 'active' : ''}"></div>
              <div class="ge-info">
                <div class="ge-title">${n['Popis zákroku'] || n['Typ služby']}</div>
                <div class="ge-meta">${formatDate(n['Datum'])} · ${n['Typ služby']}</div>
              </div>
              <div class="healing-badge badge-done" style="font-size:10px;padding:3px 8px;">✓</div>
            </div>
            <div style="padding:0 16px 14px;display:flex;gap:8px;overflow-x:auto;">
              <div style="width:80px;height:80px;border-radius:10px;background:var(--card2);border:1px solid var(--border);display:flex;align-items:center;justify-content:center;font-size:32px;flex-shrink:0;">${emoji}</div>
            </div>
          </div>`;
      });
    });

    galleryEl.innerHTML = html;
  } catch (err) {
    console.error('Gallery error:', err);
  }
}

// ─── AKCE ────────────────────────────────────────
async function loadEvents() {
  try {
    allEvents = await Sheets.getAkce();
    renderEvents('vse');
  } catch (err) {
    console.error('Akce error:', err);
  }
}

function renderEvents(filter) {
  const list = document.getElementById('events-list');
  const homeList = document.getElementById('home-events-list');

  let filtered = filter === 'vse' ? allEvents : allEvents.filter(a => a['Typ'] === filter);

  if (filtered.length === 0) {
    list.innerHTML = '<div class="empty-state">Zatím žádné akce tohoto typu</div>';
    return;
  }

  let html = '';
  let homeHtml = '';

  filtered.forEach((a, i) => {
    const datum = new Date(a['Datum']);
    const den = isNaN(datum) ? '?' : datum.getDate();
    const mesic = isNaN(datum) ? '?' : datum.toLocaleString('cs-CZ', { month: 'short' }).toUpperCase();
    const emoji = CONFIG.EVENT_EMOJI[a['Typ']] || CONFIG.EVENT_EMOJI.default;
    const tagClass = `tag-${(a['Typ'] || 'default').toLowerCase().replace(' ', '-').replace('flash day', 'flash')}`;

    const card = `
      <div class="event-card">
        <div class="event-card-left">
          <div class="event-date-box">
            <span class="edb-day">${den}</span>
            <span class="edb-month">${mesic}</span>
          </div>
        </div>
        <div class="event-card-right">
          <div class="feed-tag ${tagClass}">${a['Typ'] || 'Akce'}</div>
          <div class="ev-title">${a['Název akce']}</div>
          <div class="ev-desc">${a['Popis'] || ''}</div>
          <div class="ev-meta">${a['Umělci'] ? '👤 ' + a['Umělci'] : ''} ${a['Míst zbývá'] ? '· ' + a['Míst zbývá'] + ' míst' : ''}</div>
        </div>
      </div>`;

    html += card;
    if (i < 2) homeHtml += `
      <div class="feed-item">
        <div class="feed-avatar">${emoji}</div>
        <div class="feed-content">
          <div class="feed-tag ${tagClass}">${a['Typ'] || 'Akce'}</div>
          <div class="feed-title">${a['Název akce']}</div>
          <div class="feed-sub">${(a['Popis'] || '').substring(0, 80)}${(a['Popis'] || '').length > 80 ? '...' : ''}</div>
          <div class="feed-time">${formatDate(a['Datum'])}</div>
        </div>
      </div>`;
  });

  list.innerHTML = html;
  if (homeList) homeList.innerHTML = homeHtml;
}

function filterEvents(type, el) {
  document.querySelectorAll('.ftab').forEach(t => t.classList.remove('active'));
  el.classList.add('active');
  renderEvents(type);
}

// ─── ODMĚNY ──────────────────────────────────────
async function loadRewards() {
  try {
    const odmeny = await Sheets.getOdmeny();
    const klienti = await Sheets.getSheet(CONFIG.SHEETS.KLIENTI);
    const klient = klienti.find(k => k['ID Klienta'] === currentUser.id);
    const body = klient ? parseInt(klient['Body celkem'] || 0) : 0;

    // Home scroll
    const homeScroll = document.getElementById('home-rewards-list');
    let homeHtml = '';
    odmeny.forEach(o => {
      const pts = parseInt(o['Potřebné body'] || 0);
      const unlocked = body >= pts;
      homeHtml += `
        <div class="reward-card ${unlocked ? 'unlocked' : ''}" onclick="showPage('rewards')">
          <div class="reward-icon">${o['Emoji'] || '⭐'}</div>
          <div class="reward-name">${o['Název odměny']}</div>
          <div class="reward-pts ${unlocked ? 'gold' : ''}">${unlocked ? '✓ Odemčeno' : pts + ' pts'}</div>
        </div>`;
    });
    homeScroll.innerHTML = homeHtml;

    // Rewards grid
    const grid = document.getElementById('rewards-grid');
    let gridHtml = '';
    odmeny.forEach(o => {
      const pts = parseInt(o['Potřebné body'] || 0);
      const unlocked = body >= pts;
      gridHtml += `
        <div class="rg-card ${unlocked ? 'unlocked' : ''}">
          ${!unlocked ? '<div class="rg-lock">🔒</div>' : ''}
          <div class="rg-icon">${o['Emoji'] || '⭐'}</div>
          <div class="rg-name">${o['Název odměny']}</div>
          <div class="rg-req ${unlocked ? 'unlocked-text' : ''}">${unlocked ? '✓ Odemčeno' : pts + ' pts · chybí ' + (pts - body)}</div>
        </div>`;
    });
    grid.innerHTML = gridHtml;

  } catch (err) {
    console.error('Odměny error:', err);
  }
}

// ─── UTILS ───────────────────────────────────────
function formatDate(dateVal) {
  if (!dateVal) return '';
  try {
    // Google Sheets vrací datum jako "Date(year,month,day)"
    if (typeof dateVal === 'string' && dateVal.startsWith('Date(')) {
      const parts = dateVal.replace('Date(', '').replace(')', '').split(',');
      const d = new Date(parseInt(parts[0]), parseInt(parts[1]), parseInt(parts[2]));
      return d.toLocaleDateString('cs-CZ', { day: 'numeric', month: 'long', year: 'numeric' });
    }
    const d = new Date(dateVal);
    if (isNaN(d)) return dateVal;
    return d.toLocaleDateString('cs-CZ', { day: 'numeric', month: 'long', year: 'numeric' });
  } catch { return String(dateVal); }
}
