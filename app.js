/* ══════════════════════════════════════════════════════════════
   app.js — MLBB Fighter Encyclopedia
   Bootstrap 5 + Custom CSS — all features intact
   NOTE: activeTier, activeLane are declared in data.js — do NOT redeclare here
══════════════════════════════════════════════════════════════ */

/* ── Theme (IIFE — runs immediately on parse) ── */
(function () {
  const saved = localStorage.getItem('mlbb-theme');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const theme = saved || (prefersDark ? 'dark' : 'light');
  document.documentElement.setAttribute('data-theme', theme);
})();

function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme');
  const next = current === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem('mlbb-theme', next);
  const btn = document.getElementById('themeToggle');
  if (btn) {
    btn.style.transition = 'transform .35s cubic-bezier(.2,.8,.2,1)';
    btn.style.transform = 'rotate(180deg) scale(1.15)';
    setTimeout(() => { btn.style.transform = ''; }, 380);
  }
}

/* ── Image fallback helper ── */
const IMG_FALLBACKS = {
  "Cici":     "https://mlbbcentral.com/wp-content/uploads/2024/11/cici-1.webp",
  "Khaleed":  "https://mlbbcentral.com/wp-content/uploads/2024/11/khaleed-1.webp",
  "Yu Zhong": "https://mlbbcentral.com/wp-content/uploads/2024/11/yu-zhong-1.webp",
  "Lukas":    "https://mlbbcentral.com/wp-content/uploads/2024/11/lukas-1.webp",
  "X.Borg":   "https://mlbbcentral.com/wp-content/uploads/2024/11/x-borg-1.webp",
  "Kalea":    "https://mlbbcentral.com/wp-content/uploads/2024/11/kalea-1.webp",
};

function imgWithFallback(src, heroName, alt, cssClass, style) {
  const fb2 = IMG_FALLBACKS[heroName] || '';
  const onerr = fb2
    ? `if(this.dataset.tried!=='1'){this.dataset.tried='1';this.src='${fb2}';}else{this.style.display='none';const n=this.nextElementSibling;if(n)n.style.display='flex';}`
    : `this.style.display='none';const n=this.nextElementSibling;if(n)n.style.display='flex';`;
  const cls  = cssClass ? ` class="${cssClass}"` : '';
  const stl  = style    ? ` style="${style}"`    : '';
  return `<img src="${src}" alt="${alt}" referrerpolicy="no-referrer" loading="lazy" onerror="${onerr}"${cls}${stl}/>`;
}

/* ── Counter Scoring Engine ── */
function scoreHeroVsEnemies(fighter, enemies, draftMode) {
  const data = FIGHTER_DATA[fighter.name];
  if (!data) return { score: 0, reasons: [], avoidWarnings: [] };

  let score = 0;
  const reasons = [];
  const avoidWarnings = [];
  const enemyTraitSet = new Set();

  enemies.forEach(en => {
    const traits = ENEMY_TRAITS[en.name] || [en.role.toLowerCase()];
    traits.forEach(t => enemyTraitSet.add(t));
  });

  let counterHits = 0;
  data.counters.forEach(ct => { if (enemyTraitSet.has(ct)) { counterHits++; score += 25; } });

  let avoidHits = 0;
  data.avoids.forEach(av => { if (enemyTraitSet.has(av)) { avoidHits++; score -= 20; } });

  const tierBonus = { S: 15, A: 10, B: 5, C: 0 };
  score += (tierBonus[fighter.tier] || 0);

  if (draftMode === 'second') {
    score += counterHits * 8;
  } else {
    const generalTraits = ['durable', 'mobile', 'sustain', 'regen'];
    let gen = 0;
    data.tags.forEach(t => { if (generalTraits.includes(t)) gen++; });
    score += gen * 6;
  }

  if (counterHits > 0) {
    if (counterHits >= 3)                                                       reasons.push('Counters multiple enemies');
    if (enemyTraitSet.has('mobile') || enemyTraitSet.has('dash'))               reasons.push('Anti-mobile');
    if (enemyTraitSet.has('burst') || enemyTraitSet.has('assassin'))            reasons.push('Survives burst');
    if (enemyTraitSet.has('tank') || enemyTraitSet.has('durable'))              reasons.push('Shreds tanks');
    if (enemyTraitSet.has('squishy') || enemyTraitSet.has('mage'))              reasons.push('Punishes backline');
    if (enemyTraitSet.has('cc-heavy') || enemyTraitSet.has('suppression'))      reasons.push('CC-resistant kit');
    if (enemyTraitSet.has('clustered'))                                          reasons.push('AoE punisher');
    if (enemyTraitSet.has('immobile'))                                           reasons.push('Locks down immobile enemies');
    if (draftMode === 'first' && data.tags.includes('durable'))                 reasons.push('Safe first pick');
    if (draftMode === 'second' && counterHits >= 2)                             reasons.push('Strong counter pick');
  }
  if (avoidHits > 0) {
    if (enemyTraitSet.has('suppression'))                                       avoidWarnings.push('Weak vs suppression');
    if (enemyTraitSet.has('cc-heavy'))                                          avoidWarnings.push('Risky vs heavy CC');
    if (enemyTraitSet.has('ranged-poke'))                                       avoidWarnings.push('Poke comp tough matchup');
    if (enemyTraitSet.has('anti-heal') || enemyTraitSet.has('anti-regen'))      avoidWarnings.push('Anti-heal counters this hero');
  }

  const baseScore = Math.max(0, score);
  const { finalScore, breakdown } = applyWeight(fighter.name, baseScore);
  return {
    score: finalScore, baseScore, breakdown,
    reasons: reasons.slice(0, 3),
    avoidWarnings: avoidWarnings.slice(0, 2),
    uniqueReason: data.reason,
  };
}

/* ── Tag helpers ── */
function tagClass(r) {
  return r === 'Fighter' ? 'fighter' : (r === 'Assassin' || r === 'Marksman') ? 'assassin' : 'jungle';
}
function makeTag(label, cls) {
  return `<span class="tag tag-${cls}">${label}</span>`;
}

/* ── Filter functions (activeTier / activeLane live in data.js) ── */
function setTier(t, el) {
  activeTier = t;
  document.querySelectorAll('[data-tier]').forEach(b => b.classList.remove('active'));
  el.classList.add('active');
  applyFilters();
}
function setLane(l, el) {
  activeLane = l;
  document.querySelectorAll('[data-lane]').forEach(b => b.classList.remove('active'));
  el.classList.add('active');
  applyFilters();
}

/* ── Apply Filters ── */
function applyFilters() {
  const q    = document.getElementById('search').value.toLowerCase();
  const sort = document.getElementById('sortBy').value;

  let list = HEROES.filter(h => {
    if (activeTier !== 'all' && h.tier !== activeTier) return false;
    if (activeLane === 'exp'    && !h.lanes.includes('exp'))    return false;
    if (activeLane === 'jungle' && !h.lanes.includes('jungle')) return false;
    if (q && !h.name.toLowerCase().includes(q)
          && !h.spec.toLowerCase().includes(q)
          && !h.roles.join(' ').toLowerCase().includes(q)) return false;
    return true;
  });

  if (sort === 'alpha') {
    list.sort((a, b) => a.name.localeCompare(b.name));
  } else {
    const o = { S: 0, A: 1, B: 2, C: 3 };
    list.sort((a, b) => o[a.tier] - o[b.tier] || a.name.localeCompare(b.name));
  }

  document.getElementById('heroCount').textContent = list.length;
  const output = document.getElementById('heroOutput');
  const empty  = document.getElementById('emptyState');

  if (!list.length) {
    output.innerHTML = '';
    empty.classList.remove('d-none');
    return;
  }
  empty.classList.add('d-none');

  const TIER_NAMES = {
    S: 'Supreme Tier — Meta Dominators',
    A: 'A-Tier — Strong Picks',
    B: 'B-Tier — Situationally Viable',
    C: 'C-Tier — Comfort / Niche',
  };

  if (sort === 'tier' && activeTier === 'all') {
    let html = '';
    ['S', 'A', 'B', 'C'].forEach(t => {
      const group = list.filter(h => h.tier === t);
      if (!group.length) return;
      html += `
        <div class="tier-section">
          <div class="tier-header">
            <div class="tier-badge ${t}">${t}</div>
            <div class="tier-label">${TIER_NAMES[t]}</div>
            <div class="tier-divider"></div>
          </div>
          <div class="hero-grid">${group.map((h, i) => heroCard(h, i)).join('')}</div>
        </div>`;
    });
    output.innerHTML = html;
  } else {
    output.innerHTML = `<div class="hero-grid">${list.map((h, i) => heroCard(h, i)).join('')}</div>`;
  }
}

/* ── Hero Card HTML ── */
function heroCard(h, i) {
  const roleTags = h.roles.map(r => makeTag(r.toUpperCase(), tagClass(r))).join('');
  const laneTags = h.lanes.map(l => makeTag(l.toUpperCase(), 'exp')).join('');
  const nm = h.name.replace(/'/g, "\\'");
  const delay = (i * 0.035).toFixed(2);
  return `
  <div class="hero-card tier-${h.tier}" style="animation-delay:${delay}s" onclick="openModal('${nm}')">
    <div class="hero-portrait-wrap">
      ${imgWithFallback(h.img, h.name, h.name)}
      <div class="portrait-fallback fallback-${h.tier}">${h.icon}</div>
      <div class="portrait-tier ${h.tier}">${h.tier}</div>
      <div class="portrait-role-bar">${roleTags}${laneTags}</div>
    </div>
    <div class="card-body">
      <div class="hero-name">${h.name}</div>
      <div class="hero-title-sub">${h.title}</div>
      <div class="hero-spec-line">${h.spec}</div>
      <div class="card-tap-hint">TAP FOR FULL DETAILS</div>
    </div>
  </div>`;
}

/* ── Modal ── */
function openModal(name) {
  const h = HEROES.find(x => x.name === name);
  if (!h) return;

  // Stripe
  const stripe = document.getElementById('modalStripe');
  stripe.className = `modal-accent-line tier-${h.tier}`;

  // Portrait
  const mi = document.getElementById('modalImg');
  mi.innerHTML = `
    ${imgWithFallback(h.img, h.name, h.name, '', 'width:100%;height:100%;object-fit:cover;object-position:top center;display:block')}
    <div class="modal-portrait-fallback fallback-${h.tier}" style="display:none">${h.icon}</div>`;

  // Text info
  document.getElementById('modalName').textContent      = h.name;
  document.getElementById('modalHeroTitle').textContent = h.title;

  const tierColors = { S: '#f5c842', A: '#7ec8e3', B: '#9dc88d', C: '#c8a0b0' };
  const tc = tierColors[h.tier] || '#ef233c';
  const roleTags = h.roles.map(r => `<span class="tag tag-${tagClass(r)}">${r.toUpperCase()}</span>`).join('');
  const laneTags = h.lanes.map(l => `<span class="tag tag-exp">${l.toUpperCase()}</span>`).join('');
  document.getElementById('modalTags').innerHTML =
    `<span class="tag" style="color:${tc};border-color:${tc}55;background:${tc}14">${h.tier}-TIER</span>${roleTags}${laneTags}`;

  // Overview
  document.getElementById('modalOverview').textContent = h.overview;

  // Spec badge
  document.getElementById('modalSpecRow').textContent = h.spec;

  // Strengths / Weaknesses
  document.getElementById('modalStrengths').innerHTML  = h.strengths.map(s => `<li>${s}</li>`).join('');
  document.getElementById('modalWeaknesses').innerHTML = h.weaknesses.map(w => `<li>${w}</li>`).join('');

  // Build
  document.getElementById('modalBuild').innerHTML = h.build.map(item => `<span class="build-pill">${item}</span>`).join('');

  // Counters
  document.getElementById('modalCounters').innerHTML = h.counter.map(c => `<span class="counter-pill">${c}</span>`).join('');

  // Released
  document.getElementById('modalReleased').textContent = h.released ? `Released: ${h.released}` : '';

  // Open
  document.getElementById('modalBackdrop').classList.add('open');
  document.body.style.overflow = 'hidden';
  document.getElementById('modalBodyScroll').scrollTop = 0;
}

function closeModal() {
  document.getElementById('modalBackdrop').classList.remove('open');
  document.body.style.overflow = '';
}
function handleBackdropClick(e) {
  if (e.target === document.getElementById('modalBackdrop')) closeModal();
}
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') { closeModal(); closePicker(); }
});

/* ── Tab switch ── */
function switchTab(tab) {
  document.querySelectorAll('.nav-tab').forEach(b =>
    b.classList.toggle('active', b.dataset.tab === tab));
  document.querySelectorAll('.tab-pane').forEach(p => {
    const isActive = p.id === 'pane-' + tab;
    p.classList.toggle('d-none', !isActive);
  });
}

/* ── Draft Mode ── */
let draftMode = 'first';

function setDraftMode(mode, el) {
  draftMode = mode;
  document.querySelectorAll('.draft-btn').forEach(b =>
    b.classList.toggle('active', b.dataset.mode === mode));
}

/* ── Enemy slots ── */
let enemyPicks = [];
const MAX_ENEMIES = 5;
let pickerSlotIndex = -1;
let pickerRoleFilter = 'All';
let pickerSearch = '';

function renderEnemySlots() {
  const wrap = document.getElementById('enemySlots');
  let html = '';

  for (let i = 0; i < enemyPicks.length; i++) {
    const e = enemyPicks[i];
    html += `
      <div class="enemy-slot-wrap" data-idx="${i}">
        <div class="enemy-slot-img" onclick="openPicker(${i})">
          <img src="${e.img}" referrerpolicy="no-referrer"
            onerror="this.style.display='none'" alt="${e.name}"/>
          <div class="enemy-slot-remove" onclick="removeEnemy(event,${i})">✕</div>
        </div>
        <div class="enemy-slot-label">${e.name}</div>
      </div>`;
  }
  if (enemyPicks.length < MAX_ENEMIES) {
    html += `<button class="add-enemy-btn" onclick="openPicker(-1)" title="Add enemy hero">+</button>`;
  }
  wrap.innerHTML = html;

  const canAnalyse = enemyPicks.length >= 2;
  document.getElementById('analyseBtn').disabled = !canAnalyse;
  document.getElementById('enemyCountLabel').innerHTML =
    `<span class="ec-num">${enemyPicks.length}</span> / ${MAX_ENEMIES} enemy heroes selected${enemyPicks.length < 2 ? ' — add at least 2' : ''}`;
}

function removeEnemy(e, idx) {
  e.stopPropagation();
  enemyPicks.splice(idx, 1);
  renderEnemySlots();
  document.getElementById('cpResults').innerHTML = '';
}

/* ── Hero Picker ── */
const AVATAR_PALETTES = [
  ['#1a2a4a','#4a8eda'],['#2a1a1a','#da5a4a'],['#1a2a1a','#4ada6a'],
  ['#2a1a2a','#c04ada'],['#2a2a10','#daaa2a'],['#10252a','#2adacc'],
  ['#2a1018','#da2a6a'],['#10202a','#2a9ada'],['#1a1a2a','#7a4ada'],
  ['#2a1a10','#da7a2a'],['#0a2a1a','#2ada8a'],['#2a0a0a','#da2a2a'],
];
function heroAvatarColor(name) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return AVATAR_PALETTES[h % AVATAR_PALETTES.length];
}
function roleColor(role) {
  return { Tank:'#4a8eda',Fighter:'#daaa2a',Assassin:'#da5a4a',
           Mage:'#c04ada',Marksman:'#4ada6a',Support:'#2adacc' }[role] || '#888';
}

function openPicker(slotIdx) {
  pickerSlotIndex = slotIdx;
  pickerSearch = '';
  pickerRoleFilter = 'All';
  const inp = document.getElementById('pickerSearch');
  if (inp) inp.value = '';
  document.querySelectorAll('.role-chip').forEach(c =>
    c.classList.toggle('active', c.dataset.role === 'All'));
  renderPickerGrid();
  // Reset scroll
  const grid = document.getElementById('pickerGrid');
  if (grid) grid.scrollTop = 0;
  document.getElementById('heroPickerBackdrop').classList.add('open');
  setTimeout(() => document.getElementById('pickerSearch')?.focus(), 80);
}
function closePicker() {
  document.getElementById('heroPickerBackdrop').classList.remove('open');
}
function setPickerRole(role, el) {
  pickerRoleFilter = role;
  document.querySelectorAll('.role-chip').forEach(c =>
    c.classList.toggle('active', c.dataset.role === role));
  renderPickerGrid();
}

/* Role CSS class map */
/* Role constants for picker cards */
const ROLE_ABBR = {
  Tank:'TAN', Fighter:'FIG', Assassin:'ASS',
  Mage:'MAG', Marksman:'MAR', Support:'SUP',
};
const ROLE_TAG_COLOR = {
  Tank:'#7ec8e3', Fighter:'#f5c842', Assassin:'#ef8888',
  Mage:'#c084f5', Marksman:'#7dc8a0', Support:'#5bc8e8',
};
const ROLE_CSS_CLASS = {
  Fighter:'role-fighter', Tank:'role-tank', Assassin:'role-assassin',
  Mage:'role-mage', Marksman:'role-marksman', Support:'role-support',
};

function renderPickerGrid() {
  const q = pickerSearch.toLowerCase();
  const picked = new Set(enemyPicks.map(e => e.name));

  let list = ALL_HEROES.filter(h => {
    if (picked.has(h.name) && enemyPicks[pickerSlotIndex]?.name !== h.name) return false;
    if (pickerRoleFilter !== 'All' && h.role !== pickerRoleFilter) return false;
    if (q && !h.name.toLowerCase().includes(q)) return false;
    return true;
  });

  const countEl = document.getElementById('pickerResultCount');
  if (countEl) countEl.textContent = list.length;

  const grid = document.getElementById('pickerGrid');
  if (!list.length) {
    grid.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:40px 0;color:var(--text-3);font-style:italic;font-family:'Barlow',sans-serif">No heroes found</div>`;
    return;
  }

  grid.innerHTML = list.map(h => {
    const isSel    = picked.has(h.name);
    const [bg]     = heroAvatarColor(h.name);
    const initials = h.name.split(/[\s\-\.&]+/).map(w => w[0]).filter(Boolean).join('').slice(0, 2).toUpperCase();
    const abbr     = ROLE_ABBR[h.role]      || h.role.slice(0, 3).toUpperCase();
    const tagColor = ROLE_TAG_COLOR[h.role]  || '#8d99ae';
    const roleClass= ROLE_CSS_CLASS[h.role]  || '';
    const nm       = h.name.replace(/'/g, "\\'");

    return `
      <div class="picker-hero-card ${roleClass}${isSel ? ' selected' : ''}" onclick="pickEnemy('${nm}')">
        <div class="picker-avatar-circle" style="background:${bg}">
          <span>${initials}</span>
        </div>
        <div class="picker-hero-name">${h.name}</div>
        <div class="picker-role-tag" style="color:${tagColor}">${abbr}</div>
      </div>`;
  }).join('');

  grid.scrollTop = 0;
}

function pickEnemy(name) {
  const h = ALL_HEROES.find(x => x.name === name);
  if (!h) return;
  if (pickerSlotIndex >= 0 && pickerSlotIndex < enemyPicks.length) {
    enemyPicks[pickerSlotIndex] = { name: h.name, role: h.role, img: h.img };
  } else {
    if (enemyPicks.length >= MAX_ENEMIES) return;
    enemyPicks.push({ name: h.name, role: h.role, img: h.img });
  }
  closePicker();
  renderEnemySlots();
  document.getElementById('cpResults').innerHTML = '';
}

function resetCounter() {
  enemyPicks = [];
  renderEnemySlots();
  document.getElementById('cpResults').innerHTML = '';
}
function handlePickerBackdrop(e) {
  if (e.target === document.getElementById('heroPickerBackdrop')) closePicker();
}

/* ── Analyse Counter ── */
function analyseCounter() {
  if (enemyPicks.length < 2) return;

  const results = HEROES
    .map(h => ({ ...h, ...scoreHeroVsEnemies(h, enemyPicks, draftMode) }))
    .filter(h => h.score > 0)
    .sort((a, b) => b.score - a.score);

  const draftLabel = draftMode === 'first'
    ? 'First Pick — recommending safe, versatile fighters'
    : 'Second Pick — recommending direct counter picks';

  const scenarioText = draftMode === 'first'
    ? 'You are picking <strong>first</strong>. Recommendations favour durable, versatile fighters that work regardless of what the enemy picks next.'
    : 'You are picking <strong>second</strong>. You know the enemy lineup — recommendations favour direct counter picks that hard-exploit their weaknesses.';

  const enemyChips = enemyPicks.map(e =>
    `<div class="enemy-chip">
      <img src="${e.img}" referrerpolicy="no-referrer" onerror="this.style.display='none'"/>
      ${e.name}
    </div>`).join('');

  const top = results.slice(0, 8);
  const rank = ['⭐', '🥈', '🥉'];

  const recHTML = top.length
    ? top.map((h, i) => {
        const roleTags = h.roles.map(r => `<span class="tag tag-${tagClass(r)}">${r.toUpperCase()}</span>`).join('');
        const laneTags = h.lanes.map(l => `<span class="tag tag-exp">${l.toUpperCase()}</span>`).join('');
        const reasonTags  = h.reasons.map(r => `<span class="rtag">${r}</span>`).join('');
        const warnTags    = h.avoidWarnings.map(w => `<span class="rtag rtag-warn">⚠ ${w}</span>`).join('');
        const nm          = h.name.replace(/'/g, "\\'");
        const safeId      = h.name.replace(/[^a-z0-9]/gi, '_');
        const scoreClass  = h.score >= 65 ? 'score-high' : h.score >= 40 ? 'score-mid' : 'score-low';
        const bdHtml      = h.breakdown
          ? `<div id="rbd-${safeId}" class="score-breakdown ${h.breakdown.type}">${h.breakdown.label}</div>`
          : `<div id="rbd-${safeId}" class="score-breakdown"></div>`;
        const mlBadge = (typeof getWeight === 'function' && getWeight(h.name) !== 1.0)
          ? `<span class="ml-badge">ML</span>` : '';
        const rankLabel = rank[i] || '';
        return `
        <div class="rec-card rank-${i + 1}" onclick="openModal('${nm}')">
          <div class="rec-portrait">
            ${imgWithFallback(h.img, h.name, h.name)}
            <div class="rec-portrait-fb fallback-${h.tier}">${h.icon}</div>
          </div>
          <div class="rec-body">
            <div class="rec-name">${rankLabel} ${h.name}${mlBadge}</div>
            <div style="display:flex;gap:3px;flex-wrap:wrap;margin:2px 0">${roleTags}${laneTags}</div>
            <div class="rec-reason-text">${h.uniqueReason}</div>
            <div class="rec-tags">${reasonTags}${warnTags}</div>
          </div>
          <div class="rec-score-col">
            <div class="rec-score-num ${scoreClass}" id="rscore-${safeId}" data-base="${h.baseScore}">${h.score}</div>
            <div class="rec-score-lbl">Score</div>
            <div class="rec-tier-pip ${h.tier}">${h.tier}</div>
            ${bdHtml}
          </div>
          ${ratingWidget(h.name)}
        </div>`;
      }).join('')
    : '<div class="no-results">No strong counter picks found. Try adjusting the enemy selection.</div>';

  document.getElementById('cpResults').innerHTML = `
    <div class="cp-results">
      <div class="cp-results-hd">
        <h3>Counter Recommendations</h3>
        <p>${draftLabel}</p>
      </div>
      <div class="scenario-context">
        <span style="font-size:18px;flex-shrink:0">${draftMode === 'first' ? '🏹' : '🗡️'}</span>
        <div>${scenarioText}</div>
      </div>
      <div class="enemy-chip-row">${enemyChips}</div>
      <div class="rec-list">${recHTML}</div>
    </div>`;

  const totalVotes = Object.values(heroVotes).reduce((s, v) => s + v.up + v.down, 0);
  const statsNote = totalVotes > 0
    ? `<div style="text-align:center;margin-top:18px;font-family:'Barlow Condensed',sans-serif;font-size:9px;letter-spacing:2px;color:var(--text-3)">
        ML MODEL · <span style="color:var(--accent)">${totalVotes}</span> COMMUNITY VOTES RECORDED
       </div>`
    : `<div style="text-align:center;margin-top:18px;font-family:'Barlow Condensed',sans-serif;font-size:9px;letter-spacing:2px;color:var(--text-3)">
        ▲ ▼  VOTE ON EACH RECOMMENDATION TO TRAIN THE MODEL
       </div>`;
  document.getElementById('cpResults').innerHTML += statsNote;
  document.getElementById('cpResults').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

/* ── Desktop 3D tilt on hover ── */
function init3DTilt() {
  if (window.matchMedia('(hover: none)').matches) return;
  document.addEventListener('mousemove', e => {
    const card = e.target.closest('.hero-card');
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const dx = ((e.clientX - rect.left) / rect.width  - 0.5) * 2;
    const dy = ((e.clientY - rect.top)  / rect.height - 0.5) * 2;
    card.style.transform = `translateY(-6px) rotateX(${-dy * 5}deg) rotateY(${dx * 5}deg)`;
  });
  document.addEventListener('mouseleave', e => {
    const card = e.target.closest?.('.hero-card');
    if (card) card.style.transform = '';
  }, true);
}
init3DTilt();

/* ── Init ── */
renderEnemySlots();
applyFilters();
