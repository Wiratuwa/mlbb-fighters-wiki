const TIER_COLOR = { S: '#f59e0b', A: '#22c55e', B: '#3b82f6', C: '#8b5cf6' };
const TIER_BG = { S: 'rgba(245,158,11,0.15)', A: 'rgba(34,197,94,0.12)', B: 'rgba(59,130,246,0.12)', C: 'rgba(139,92,246,0.12)' };
const ROLE_COLOR = { Fighter: '#f59e0b', Assassin: '#ef4444', Tank: '#3b82f6', Mage: '#a855f7', Marksman: '#22c55e', Support: '#06b6d4' };

function roleColor(role) { return ROLE_COLOR[role] || '#888'; }

const AVATAR_PALETTES = [
  ['#1a2a4a','#4a8eda'],['#2a1a1a','#da5a4a'],['#1a2a1a','#4ada6a'],
  ['#2a1a2a','#c04ada'],['#2a2a10','#daaa2a'],['#10252a','#2adacc'],
];
function heroAvatarColor(name) {
  let h = 0; for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return AVATAR_PALETTES[h % AVATAR_PALETTES.length];
}

export { TIER_COLOR, TIER_BG, ROLE_COLOR, roleColor, AVATAR_PALETTES, heroAvatarColor };
