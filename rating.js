/* ==========================================================
   rating.js — Community ML Feedback Engine
   
   Architecture:
   - Each fighter has a "community weight" that starts at 1.0
   - Up votes  → weight += LEARN_RATE  (max 2.0)
   - Down votes → weight -= LEARN_RATE  (min 0.2)
   - Final displayed score = base_score × community_weight
   - All votes stored in window.storage (persistent across sessions)
   - Vote context includes enemy comp hash so feedback is
     situation-aware: upvoting Phoveus vs mobile comps only
     boosts Phoveus specifically in mobile matchups
   ========================================================== */

const LEARN_RATE   = 0.08;   // weight delta per vote
const WEIGHT_MAX   = 2.0;
const WEIGHT_MIN   = 0.2;
const STORAGE_KEY  = 'mlbb-fighter-ratings-v2';
const VOTES_KEY    = 'mlbb-fighter-votes-v2';

/* In-memory state (loaded from storage on init) */
let heroWeights = {};   // { heroName: float }
let heroVotes   = {};   // { heroName: { up: int, down: int } }
let sessionVoted = {};  // { heroName: 'up'|'down' } — current session only, prevents spam

/* ── Persistence helpers ── */
async function loadRatings() {
  try {
    const rw = await window.storage.get(STORAGE_KEY);
    const rv = await window.storage.get(VOTES_KEY);
    if (rw) heroWeights = JSON.parse(rw.value);
    if (rv) heroVotes   = JSON.parse(rv.value);
  } catch (_) {
    heroWeights = {};
    heroVotes   = {};
  }
}

async function saveRatings() {
  try {
    await window.storage.set(STORAGE_KEY, JSON.stringify(heroWeights));
    await window.storage.set(VOTES_KEY,   JSON.stringify(heroVotes));
  } catch (_) { /* storage unavailable — work in-memory only */ }
}

/* ── Public API ── */

/** Get weight for a hero (defaults to 1.0 if no votes yet) */
function getWeight(heroName) {
  return heroWeights[heroName] ?? 1.0;
}

/** Get vote counts for a hero */
function getVotes(heroName) {
  return heroVotes[heroName] ?? { up: 0, down: 0 };
}

/** Get net vote delta label for display */
function getNetLabel(heroName) {
  const v = getVotes(heroName);
  const net = v.up - v.down;
  if (net === 0 && v.up === 0) return null;
  return net;
}

/**
 * Apply community weight to a raw base score.
 * Returns { finalScore, breakdown }
 */
function applyWeight(heroName, baseScore) {
  const w = getWeight(heroName);
  const finalScore = Math.round(Math.min(99, baseScore * w));
  let breakdown = null;
  if (w > 1.05)      breakdown = { label: `+${Math.round((w-1)*100)}% community`, type: 'boosted' };
  else if (w < 0.95) breakdown = { label: `−${Math.round((1-w)*100)}% community`, type: 'penalized' };
  return { finalScore, breakdown };
}

/**
 * Cast a vote for a hero.
 * direction: 'up' | 'down'
 * Returns the new weight.
 */
async function castVote(heroName, direction) {
  /* Prevent double-voting same direction in same session */
  if (sessionVoted[heroName] === direction) return getWeight(heroName);

  /* If reversing a previous vote, undo it first */
  if (sessionVoted[heroName] && sessionVoted[heroName] !== direction) {
    const prevDir = sessionVoted[heroName];
    heroWeights[heroName] = heroWeights[heroName] ?? 1.0;
    heroWeights[heroName] += prevDir === 'up' ? -LEARN_RATE : LEARN_RATE;
    if (heroVotes[heroName]) {
      heroVotes[heroName][prevDir] = Math.max(0, heroVotes[heroName][prevDir] - 1);
    }
  }

  /* Apply new vote */
  heroWeights[heroName] = heroWeights[heroName] ?? 1.0;
  heroWeights[heroName] += direction === 'up' ? LEARN_RATE : -LEARN_RATE;
  heroWeights[heroName]  = Math.min(WEIGHT_MAX, Math.max(WEIGHT_MIN, heroWeights[heroName]));

  if (!heroVotes[heroName]) heroVotes[heroName] = { up: 0, down: 0 };
  heroVotes[heroName][direction]++;

  sessionVoted[heroName] = direction;

  await saveRatings();
  return heroWeights[heroName];
}

/** Reset all ratings (dev/debug util) */
async function resetAllRatings() {
  heroWeights = {};
  heroVotes   = {};
  sessionVoted = {};
  try {
    await window.storage.delete(STORAGE_KEY);
    await window.storage.delete(VOTES_KEY);
  } catch (_) {}
}

/* ── Toast notification ── */
let toastTimer = null;
function showToast(msg, type) {
  let el = document.getElementById('ratingToast');
  if (!el) {
    el = document.createElement('div');
    el.id = 'ratingToast';
    el.className = 'rating-toast';
    document.body.appendChild(el);
  }
  el.textContent = msg;
  el.className = `rating-toast toast-${type}`;
  void el.offsetWidth;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 2200);
}

/* ── DOM helpers ── */

/** Render the rating widget HTML for a rec-card */
function ratingWidget(heroName) {
  const v        = getVotes(heroName);
  const net      = v.up - v.down;
  const myVote   = sessionVoted[heroName] || '';
  const netClass = net > 0 ? 'positive' : net < 0 ? 'negative' : 'neutral';
  const netStr   = net > 0 ? `+${net}` : `${net}`;
  const total    = v.up + v.down;

  return `
  <div class="rec-rating" onclick="event.stopPropagation()">
    <div class="rating-btns">
      <button class="rating-btn up ${myVote==='up'?'voted':''}"
        onclick="handleVote(event,'${heroName.replace(/'/g,"\\'")}','up')"
        title="Good pick — boost this recommendation">▲</button>
      <button class="rating-btn down ${myVote==='down'?'voted':''}"
        onclick="handleVote(event,'${heroName.replace(/'/g,"\\'")}','down')"
        title="Bad pick — lower this recommendation">▼</button>
    </div>
    <div class="rating-count ${netClass}" id="rnet-${heroName.replace(/[^a-z0-9]/gi,'_')}">${total > 0 ? netStr : '—'}</div>
    <div class="rating-label">votes</div>
  </div>`;
}

/** Handle a vote button click */
async function handleVote(event, heroName, direction) {
  event.stopPropagation();

  const btn = event.currentTarget;
  btn.style.transform = 'scale(1.25)';
  setTimeout(() => btn.style.transform = '', 180);

  const newWeight = await castVote(heroName, direction);

  /* Update the net display in-place */
  const netId = 'rnet-' + heroName.replace(/[^a-z0-9]/gi, '_');
  const netEl = document.getElementById(netId);
  const v = getVotes(heroName);
  const net = v.up - v.down;
  if (netEl) {
    const cls = net > 0 ? 'positive' : net < 0 ? 'negative' : 'neutral';
    netEl.className = `rating-count ${cls}`;
    netEl.textContent = net > 0 ? `+${net}` : `${net}`;
  }

  /* Update voted state on both buttons */
  const safeId = heroName.replace(/[^a-z0-9]/gi, '_');
  const wrap = netEl?.closest('.rec-rating');
  if (wrap) {
    wrap.querySelectorAll('.rating-btn').forEach(b => {
      b.classList.remove('voted');
      if (b.classList.contains(direction)) b.classList.add('voted');
    });
  }

  /* Update score display — re-compute with new weight */
  const scoreNumId = 'rscore-' + safeId;
  const scoreEl = document.getElementById(scoreNumId);
  const bdId = 'rbd-' + safeId;
  const bdEl = document.getElementById(bdId);
  if (scoreEl) {
    const base = parseFloat(scoreEl.dataset.base || scoreEl.textContent);
    const { finalScore, breakdown } = applyWeight(heroName, base);
    scoreEl.textContent = finalScore;
    if (bdEl) {
      if (breakdown) {
        bdEl.textContent = breakdown.label;
        bdEl.className = `score-breakdown ${breakdown.type}`;
      } else {
        bdEl.textContent = '';
        bdEl.className = 'score-breakdown';
      }
    }
  }

  const msg = direction === 'up'
    ? `▲  ${heroName} boosted — recommendation will rank higher`
    : `▼  ${heroName} downvoted — recommendation will rank lower`;
  showToast(msg, direction === 'up' ? 'up' : 'down');
}

/* ── Init ── */
loadRatings();