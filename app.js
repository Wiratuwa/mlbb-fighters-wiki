/* Multi-source image fallback helper */
const IMG_FALLBACKS = {
  "Cici":     "https://mlbbcentral.com/wp-content/uploads/2024/11/cici-1.webp",
  "Khaleed":  "https://mlbbcentral.com/wp-content/uploads/2024/11/khaleed-1.webp",
  "Yu Zhong": "https://mlbbcentral.com/wp-content/uploads/2024/11/yu-zhong-1.webp",
  "Lukas":    "https://mlbbcentral.com/wp-content/uploads/2024/11/lukas-1.webp",
  "X.Borg":   "https://mlbbcentral.com/wp-content/uploads/2024/11/x-borg-1.webp",
  "Kalea":    "https://mlbbcentral.com/wp-content/uploads/2024/11/kalea-1.webp",
};

function imgWithFallback(src, heroName, alt, cssClass='', extraStyle='') {
  const fb2 = IMG_FALLBACKS[heroName] || '';
  const onerr = fb2
    ? `if(this.dataset.tried!=='1'){this.dataset.tried='1';this.src='${fb2}';}else{this.style.display='none';const n=this.nextElementSibling;if(n)n.style.display='flex';}`
    : `this.style.display='none';const n=this.nextElementSibling;if(n)n.style.display='flex';`;
  return `<img src="${src}" alt="${alt}" referrerpolicy="no-referrer" loading="lazy" onerror="${onerr}" ${cssClass?`class="${cssClass}"`:''}${extraStyle?` style="${extraStyle}"`:''}/>`;
}

/* ─────────────────────────────────────────
   COUNTER SCORING ENGINE
───────────────────────────────────────── */
function scoreHeroVsEnemies(fighter, enemies, draftMode){
  const data = FIGHTER_DATA[fighter.name];
  if(!data) return {score:0, reasons:[], avoidWarnings:[]};

  let score = 0;
  const reasons = [];
  const avoidWarnings = [];
  const enemyTraitSet = new Set();

  enemies.forEach(en => {
    const traits = ENEMY_TRAITS[en.name] || [en.role.toLowerCase()];
    traits.forEach(t => enemyTraitSet.add(t));
  });

  // Count counter matches
  let counterHits = 0;
  data.counters.forEach(ct => {
    if(enemyTraitSet.has(ct)){
      counterHits++;
      score += 25;
    }
  });

  // Count avoid matches (penalty)
  let avoidHits = 0;
  data.avoids.forEach(av => {
    if(enemyTraitSet.has(av)){
      avoidHits++;
      score -= 20;
    }
  });

  // Tier bonus
  const tierBonus = {S:15,A:10,B:5,C:0};
  score += (tierBonus[fighter.tier] || 0);

  // Draft mode bonus
  // First pick: reward safe, durable, less-punishable fighters
  // Second pick: reward direct counters more
  if(draftMode === 'second'){
    score += counterHits * 8; // extra reward for direct counter picks
  } else {
    // first pick: reward generalists
    const generalTraits = ['durable','mobile','sustain','regen'];
    let genCount = 0;
    data.tags.forEach(t => { if(generalTraits.includes(t)) genCount++; });
    score += genCount * 6;
  }

  // Build reasons
  if(counterHits > 0){
    const enemyRoles = enemies.map(e => e.role);
    const uniqueRoles = [...new Set(enemyRoles)];
    if(counterHits >= 3) reasons.push('Counters multiple enemies');
    if(enemyTraitSet.has('mobile') || enemyTraitSet.has('dash')) reasons.push('Anti-mobile');
    if(enemyTraitSet.has('burst') || enemyTraitSet.has('assassin')) reasons.push('Survives burst');
    if(enemyTraitSet.has('tank') || enemyTraitSet.has('durable')) reasons.push('Shreds tanks');
    if(enemyTraitSet.has('squishy') || enemyTraitSet.has('marksman') || enemyTraitSet.has('mage')) reasons.push('Punishes backline');
    if(enemyTraitSet.has('cc-heavy') || enemyTraitSet.has('suppression')) reasons.push('CC-resistant kit');
    if(enemyTraitSet.has('clustered') || enemyTraitSet.has('grouped')) reasons.push('AoE punisher');
    if(enemyTraitSet.has('immobile')) reasons.push('Easily locks down immobile enemies');
    if(draftMode==='first' && data.tags.includes('durable')) reasons.push('Safe first pick');
    if(draftMode==='second' && counterHits>=2) reasons.push('Strong counter pick');
  }

  if(avoidHits > 0){
    if(enemyTraitSet.has('suppression')) avoidWarnings.push('Weak vs suppression');
    if(enemyTraitSet.has('cc-heavy')) avoidWarnings.push('Risky vs heavy CC');
    if(enemyTraitSet.has('ranged-poke')) avoidWarnings.push('Poke comp tough matchup');
    if(enemyTraitSet.has('anti-cc') || enemyTraitSet.has('cc-immune')) avoidWarnings.push('Enemy has CC immunity');
    if(enemyTraitSet.has('anti-heal') || enemyTraitSet.has('anti-regen')) avoidWarnings.push('Anti-heal counters this hero');
  }

  // Unique reason (always show)
  const uniqueReason = data.reason;

  const baseScore = Math.max(0, score);
  const { finalScore, breakdown } = applyWeight(fighter.name, baseScore);
  return { score: finalScore, baseScore, breakdown, reasons: reasons.slice(0,3), avoidWarnings: avoidWarnings.slice(0,2), uniqueReason };
}

/* ─────────────────────────────────────────
   COUNTER PICKER STATE & UI
───────────────────────────────────────── */
let draftMode = 'first';
let enemyPicks = [];   // [{name, role, img}]
const MAX_ENEMIES = 5;
let pickerSlotIndex = -1;
let pickerRoleFilter = 'All';
let pickerSearch = '';

function switchTab(tab){
  document.querySelectorAll('.tab-btn').forEach(b=>b.classList.toggle('active', b.dataset.tab===tab));
  document.querySelectorAll('.tab-pane').forEach(p=>p.classList.toggle('active', p.id==='pane-'+tab));
}

function setDraftMode(mode){
  draftMode = mode;
  document.querySelectorAll('.draft-btn').forEach(b=>b.classList.toggle('active',b.dataset.mode===mode));
  renderEnemySlots();
}

function renderEnemySlots(){
  const wrap = document.getElementById('enemySlots');
  let html = '';
  for(let i=0;i<enemyPicks.length;i++){
    const e = enemyPicks[i];
    html += `<div class="enemy-slot filled-outer" data-idx="${i}">
      <div class="enemy-slot-inner filled" onclick="openPicker(${i})">
        <img src="${e.img}" referrerpolicy="no-referrer" onerror="this.style.display='none'" alt="${e.name}"/>
        <div class="enemy-slot-remove" onclick="removeEnemy(event,${i})">✕</div>
      </div>
      <div class="enemy-slot-name">${e.name}</div>
    </div>`;
  }
  if(enemyPicks.length < MAX_ENEMIES){
    const minLabel = enemyPicks.length < 2 ? `${2-enemyPicks.length} more needed` : 'Add enemy';
    html += `<button class="add-enemy-btn" onclick="openPicker(-1)" title="Add enemy hero">+</button>`;
  }
  wrap.innerHTML = html;
  const canAnalyse = enemyPicks.length >= 2;
  document.getElementById('analyseBtn').disabled = !canAnalyse;
  document.getElementById('enemyCountLabel').innerHTML =
    `<span>${enemyPicks.length}</span> / ${MAX_ENEMIES} enemy heroes selected ${enemyPicks.length < 2 ? '— add at least 2' : ''}`;
}

function removeEnemy(e, idx){
  e.stopPropagation();
  enemyPicks.splice(idx,1);
  renderEnemySlots();
  document.getElementById('cpResults').innerHTML='';
}

function openPicker(slotIdx){
  pickerSlotIndex = slotIdx;
  pickerSearch = '';
  pickerRoleFilter = 'All';
  document.getElementById('pickerSearch').value = '';
  document.querySelectorAll('.role-chip').forEach(c=>c.classList.toggle('active',c.dataset.role==='All'));
  renderPickerGrid();
  document.getElementById('heroPickerBackdrop').classList.add('open');
  document.getElementById('pickerSearch').focus();
}

function closePicker(){
  document.getElementById('heroPickerBackdrop').classList.remove('open');
}

function setPickerRole(role, el){
  pickerRoleFilter = role;
  document.querySelectorAll('.role-chip').forEach(c=>c.classList.toggle('active',c.dataset.role===role));
  renderPickerGrid();
}

/* ── Avatar colour palette — deterministic per hero name ── */
const AVATAR_PALETTES = [
  ['#1a2a4a','#4a8eda'],['#2a1a1a','#da5a4a'],['#1a2a1a','#4ada6a'],
  ['#2a1a2a','#c04ada'],['#2a2a10','#daaa2a'],['#10252a','#2adacc'],
  ['#2a1018','#da2a6a'],['#10202a','#2a9ada'],['#1a1a2a','#7a4ada'],
  ['#2a1a10','#da7a2a'],['#0a2a1a','#2ada8a'],['#2a0a0a','#da2a2a'],
];
function heroAvatarColor(name){
  let h=0; for(let i=0;i<name.length;i++) h=(h*31+name.charCodeAt(i))>>>0;
  return AVATAR_PALETTES[h % AVATAR_PALETTES.length];
}
function roleColor(role){
  return {Tank:'#4a8eda',Fighter:'#daaa2a',Assassin:'#da5a4a',
          Mage:'#c04ada',Marksman:'#4ada6a',Support:'#2adacc'}[role]||'#888';
}

/* Build a picker card that always shows a styled SVG avatar,
   then attempts to load the actual portrait on top */
function pickerCard(h, isSel){
  const [bg, fg] = heroAvatarColor(h.name);
  const initials = h.name.split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase();
  const rc = roleColor(h.role);
  const nm = h.name.replace(/'/g,"\\'");
  return `<div class="picker-hero-item${isSel?' selected':''}" onclick="pickEnemy('${nm}')">
    <div class="picker-hero-img">
      <svg class="picker-avatar" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        <rect width="100" height="100" fill="${bg}"/>
        <rect x="0" y="82" width="100" height="18" fill="${rc}" opacity="0.25"/>
        <circle cx="50" cy="44" r="28" fill="${fg}" opacity="0.18"/>
        <circle cx="50" cy="44" r="18" fill="${fg}" opacity="0.28"/>
        <text x="50" y="52" text-anchor="middle" dominant-baseline="central"
          font-family="'Cinzel Decorative',serif" font-weight="700"
          font-size="${initials.length>1?'26':'32'}" fill="${fg}">${initials}</text>
        <rect x="6" y="6" width="88" height="88" rx="4" fill="none"
          stroke="${fg}" stroke-width="1" opacity="0.2"/>
      </svg>
      <img src="${h.img}" referrerpolicy="no-referrer" loading="lazy"
        class="picker-photo"
        onerror="this.style.opacity='0'" alt="${h.name}"/>
    </div>
    <div class="picker-hero-label">${h.name}</div>
  </div>`;
}

function renderPickerGrid(){
  const q = pickerSearch.toLowerCase();
  const alreadyPicked = new Set(enemyPicks.map(e=>e.name));
  let list = ALL_HEROES.filter(h=>{
    if(alreadyPicked.has(h.name) && enemyPicks[pickerSlotIndex]?.name !== h.name) return false;
    if(pickerRoleFilter !== 'All' && h.role !== pickerRoleFilter) return false;
    if(q && !h.name.toLowerCase().includes(q)) return false;
    return true;
  });
  const grid = document.getElementById('pickerGrid');
  if(!list.length){
    grid.innerHTML='<div style="grid-column:1/-1;text-align:center;padding:32px;color:var(--text-muted);font-style:italic">No heroes found</div>';
    return;
  }
  grid.innerHTML = list.map(h=>{
    const isSel = pickerSlotIndex>=0 && enemyPicks[pickerSlotIndex]?.name===h.name;
    return pickerCard(h, isSel);
  }).join('');
}

function pickEnemy(name){
  const h = ALL_HEROES.find(x=>x.name===name);
  if(!h) return;
  if(pickerSlotIndex >= 0 && pickerSlotIndex < enemyPicks.length){
    enemyPicks[pickerSlotIndex] = {name:h.name, role:h.role, img:h.img};
  } else {
    if(enemyPicks.length >= MAX_ENEMIES) return;
    enemyPicks.push({name:h.name, role:h.role, img:h.img});
  }
  closePicker();
  renderEnemySlots();
  document.getElementById('cpResults').innerHTML='';
}

function resetCounter(){
  enemyPicks=[];
  renderEnemySlots();
  document.getElementById('cpResults').innerHTML='';
}

function analyseCounter(){
  if(enemyPicks.length < 2) return;
  const results = HEROES.map(h=>{
    const s = scoreHeroVsEnemies(h, enemyPicks, draftMode);
    return {...h, ...s};
  }).filter(h=>h.score>0).sort((a,b)=>b.score-a.score);

  const draftLabel = draftMode==='first'
    ? 'First Pick — recommending safe, versatile fighters'
    : 'Second Pick — recommending direct counter picks';

  const scenarioIcon = draftMode==='first' ? '🏹' : '🗡️';
  const scenarioText = draftMode==='first'
    ? 'You are picking <strong>first</strong>. Recommendations favour durable, versatile fighters that work regardless of what the enemy picks next.'
    : 'You are picking <strong>second</strong>. You know the enemy lineup — recommendations favour direct counter picks that hard-exploit their weaknesses.';

  const enemySummary = enemyPicks.map(e=>
    `<div class="enemy-chip"><img src="${e.img}" referrerpolicy="no-referrer" onerror="this.style.display='none'" />${e.name}</div>`
  ).join('');

  const top = results.slice(0,8);
  const recHTML = top.length ? top.map((h,i)=>{
    const rt=h.roles.map(r=>`<span class="tag tag-${tagClass(r)}">${r.toUpperCase()}</span>`).join('');
    const lt=h.lanes.map(l=>`<span class="tag tag-exp">${l.toUpperCase()}</span>`).join('');
    const reasonTags = h.reasons.map(r=>`<span class="rec-reason">${r}</span>`).join('');
    const warnTags = h.avoidWarnings.map(w=>`<span class="rec-reason warn">${w}</span>`).join('');
    const nm=h.name.replace(/'/g,"\'");
    const safeId = h.name.replace(/[^a-z0-9]/gi,'_');
    const bdHtml = h.breakdown
      ? `<div id="rbd-${safeId}" class="score-breakdown ${h.breakdown.type}">${h.breakdown.label}</div>`
      : `<div id="rbd-${safeId}" class="score-breakdown"></div>`;
    const mlBadge = (typeof getWeight==='function' && getWeight(h.name) !== 1.0)
      ? `<span class="ml-badge">ML</span>` : '';
    return `<div class="rec-card rank-${i+1}" onclick="openModal('${nm}')">
      <div class="rec-portrait">
        ${imgWithFallback(h.img, h.name, h.name)}
        <div class="rpfb fallback-${h.tier}">${h.icon}</div>
      </div>
      <div class="rec-body">
        <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
          <div class="rec-name">${i===0?'⭐ ':''}${h.name}${mlBadge}</div>
          <div style="display:flex;gap:4px;flex-wrap:wrap">${rt}${lt}</div>
        </div>
        <div class="rec-subtitle">${h.uniqueReason}</div>
        <div class="rec-reasons">${reasonTags}${warnTags}</div>
      </div>
      <div class="rec-score-wrap">
        <div class="rec-score-num" id="rscore-${safeId}" data-base="${h.baseScore}">${h.score}</div>
        <div class="rec-score-label">Score</div>
        <div class="rec-tier-badge ${h.tier}">${h.tier}</div>
        ${bdHtml}
      </div>
      ${ratingWidget(h.name)}
    </div>`;
  }).join('')
  : '<div class="no-results">No strong counter picks found. Try adjusting the enemy selection.</div>';

  document.getElementById('cpResults').innerHTML = `
    <div class="cp-results">
      <div class="cp-results-header">
        <h3>Counter Recommendations</h3>
        <p>${draftLabel}</p>
      </div>
      <div class="scenario-box">
        <div class="scenario-icon">${scenarioIcon}</div>
        <div class="scenario-text">${scenarioText}</div>
      </div>
      <div class="enemy-summary">${enemySummary}</div>
      <div class="rec-list">${recHTML}</div>
    </div>`;
  /* Append community stats note */
  const totalVotesCast = Object.values(heroVotes).reduce((s,v)=>s+v.up+v.down, 0);
  const statsNote = totalVotesCast > 0
    ? `<div style="text-align:center;margin-top:20px;font-family:'Cinzel',serif;font-size:9px;letter-spacing:2px;color:var(--text-muted)">
        ML MODEL · <span style="color:var(--gold)">${totalVotesCast}</span> COMMUNITY VOTES RECORDED · RATINGS PERSIST ACROSS SESSIONS
       </div>`
    : `<div style="text-align:center;margin-top:20px;font-family:'Cinzel',serif;font-size:9px;letter-spacing:2px;color:var(--text-muted)">
        ▲ ▼  VOTE ON EACH RECOMMENDATION TO TRAIN THE MODEL
       </div>`;
  document.getElementById('cpResults').innerHTML += statsNote;
  document.getElementById('cpResults').scrollIntoView({behavior:'smooth',block:'start'});
}


function handlePickerBackdrop(e){if(e.target===document.getElementById('heroPickerBackdrop'))closePicker();}
document.addEventListener('keydown',e=>{if(e.key==='Escape'){closeModal();closePicker();}});

renderEnemySlots();