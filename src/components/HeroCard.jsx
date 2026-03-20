import { useState, useRef, useCallback } from "react";
import { TIER_COLOR } from '../utils/helpers.js';
import { heroAvatarColor } from '../utils/helpers.js';
import TierBadge from './ui/TierBadge.jsx';
import RolePill from './ui/RolePill.jsx';

/* ─── HeroPortrait — handles image with fallback ─── */
export function HeroPortrait({ hero }) {
  const [failed, setFailed] = useState(false);
  const [bg, fg] = heroAvatarColor(hero.name);
  return (
    <div style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0, background: bg }}>
      {!failed ? (
        <img
          src={hero.img} alt={hero.name}
          referrerPolicy="no-referrer" loading="lazy"
          onError={() => setFailed(true)}
          style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top center' }}
        />
      ) : (
        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ color: fg, fontWeight: 900, fontSize: 40, letterSpacing: 2, opacity: 0.6 }}>{hero.icon}</span>
        </div>
      )}
    </div>
  );
}

/* ─── Hero Card (Encyclopedia) — 3D tilt on hover ─── */
export function HeroCard({ hero, onClick, index = 0 }) {
  const cardRef = useRef(null);
  const tc = TIER_COLOR[hero.tier];

  const handleMouseMove = useCallback((e) => {
    const card = cardRef.current;
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const cx = rect.left + rect.width  / 2;
    const cy = rect.top  + rect.height / 2;
    const dx = (e.clientX - cx) / (rect.width  / 2);
    const dy = (e.clientY - cy) / (rect.height / 2);
    card.style.transform = `perspective(600px) rotateX(${-dy * 6}deg) rotateY(${dx * 6}deg) translateY(-4px)`;
    card.style.boxShadow = `
      0 16px 40px rgba(0,0,0,0.55),
      0 4px 12px rgba(0,0,0,0.4),
      ${dx * 4}px ${dy * 4}px 20px ${tc}20
    `;
    card.style.borderColor = tc + '66';
  }, [tc]);

  const handleMouseLeave = useCallback(() => {
    const card = cardRef.current;
    if (!card) return;
    card.style.transform = '';
    card.style.boxShadow = '';
    card.style.borderColor = '#1e2836';
  }, []);

  return (
    <button
      ref={cardRef}
      onClick={() => onClick(hero)}
      className="card-enter"
      style={{
        all: 'unset', cursor: 'pointer',
        display: 'flex', flexDirection: 'column',
        background: '#131920', borderRadius: 14, overflow: 'hidden',
        border: '1px solid #1e2836',
        transition: 'transform 0.25s cubic-bezier(.2,.8,.2,1), box-shadow 0.25s, border-color 0.2s',
        width: '100%', textAlign: 'left',
        transformStyle: 'preserve-3d',
        animationDelay: `${index * 0.04}s`,
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {/* Portrait */}
      <div style={{ position: 'relative', aspectRatio: '3/2', overflow: 'hidden', background: '#0d1117' }}>
        <HeroPortrait hero={hero} />
        {/* Tier badge lifted in 3D */}
        <div style={{ position: 'absolute', top: 8, right: 8, transform: 'translateZ(8px)' }}>
          <TierBadge tier={hero.tier} />
        </div>
        {/* Role pills overlay */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          background: 'linear-gradient(transparent,#131920dd)',
          padding: '16px 10px 8px',
          display: 'flex', gap: 4, flexWrap: 'wrap',
        }}>
          {hero.roles.map(r => <RolePill key={r} role={r} />)}
          {hero.lanes.map(l => (
            <span key={l} style={{
              display: 'inline-block', padding: '1px 6px', borderRadius: 20,
              fontSize: 10, fontWeight: 700, letterSpacing: 0.8,
              background: '#ffffff12', color: '#8899aa',
            }}>{l.toUpperCase()}</span>
          ))}
        </div>
      </div>

      {/* Card body */}
      <div style={{ padding: '10px 12px 12px' }}>
        <div style={{ fontFamily: '"Outfit",sans-serif', fontWeight: 700, fontSize: 15, color: '#e8edf2', marginBottom: 2 }}>
          {hero.name}
        </div>
        <div style={{ fontSize: 11, color: '#5a6a7a', marginBottom: 6, fontStyle: 'italic' }}>
          {hero.title}
        </div>
        <div style={{ fontSize: 11, color: '#8899aa', background: '#0d1117', padding: '4px 8px', borderRadius: 6, display: 'inline-block' }}>
          {hero.spec}
        </div>
      </div>
    </button>
  );
}
