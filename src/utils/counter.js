import { FIGHTER_DATA, ENEMY_TRAITS } from '../data/heroes.js';

function scoreHeroVsEnemies(fighter, enemies, draftMode) {
  const data = FIGHTER_DATA[fighter.name];
  if (!data) return { score: 0, reasons: [], avoidWarnings: [] };
  let score = 0;
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
    let genCount = 0;
    data.tags.forEach(t => { if (generalTraits.includes(t)) genCount++; });
    score += genCount * 6;
  }
  const reasons = [];
  const avoidWarnings = [];
  if (counterHits > 0) {
    if (counterHits >= 3) reasons.push('Counters multiple enemies');
    if (enemyTraitSet.has('mobile') || enemyTraitSet.has('dash')) reasons.push('Anti-mobile');
    if (enemyTraitSet.has('burst') || enemyTraitSet.has('assassin')) reasons.push('Survives burst');
    if (enemyTraitSet.has('tank') || enemyTraitSet.has('durable')) reasons.push('Shreds tanks');
    if (enemyTraitSet.has('squishy') || enemyTraitSet.has('marksman') || enemyTraitSet.has('mage')) reasons.push('Punishes backline');
    if (enemyTraitSet.has('cc-heavy') || enemyTraitSet.has('suppression')) reasons.push('CC-resistant kit');
    if (enemyTraitSet.has('clustered') || enemyTraitSet.has('grouped')) reasons.push('AoE punisher');
    if (enemyTraitSet.has('immobile')) reasons.push('Locks down immobile enemies');
    if (draftMode === 'first' && data.tags.includes('durable')) reasons.push('Safe first pick');
    if (draftMode === 'second' && counterHits >= 2) reasons.push('Strong counter pick');
  }
  if (avoidHits > 0) {
    if (enemyTraitSet.has('suppression')) avoidWarnings.push('Weak vs suppression');
    if (enemyTraitSet.has('cc-heavy')) avoidWarnings.push('Risky vs heavy CC');
    if (enemyTraitSet.has('ranged-poke')) avoidWarnings.push('Poke comp tough matchup');
    if (enemyTraitSet.has('anti-heal') || enemyTraitSet.has('anti-regen')) avoidWarnings.push('Anti-heal counters this hero');
  }
  const baseScore = Math.max(0, score);
  const finalScore = Math.round(Math.min(99, baseScore));
  return { score: finalScore, baseScore, reasons: reasons.slice(0, 3), avoidWarnings: avoidWarnings.slice(0, 2), uniqueReason: data.reason };
}

export { scoreHeroVsEnemies };
