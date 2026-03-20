import { useEffect } from "react";
import { TIER_COLOR } from '../utils/helpers.js';
import { HeroPortrait } from './HeroCard.jsx';
import TierBadge from './ui/TierBadge.jsx';
import RolePill from './ui/RolePill.jsx';

export default function HeroModal({ hero, onClose }) {
  /* Lock body scroll while modal is open */
  useEffect(() => {
    if (!hero) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [hero]);

  /* Escape key */
  useEffect(() => {
    if (!hero) return;
    const handler = e => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose, hero]);

  if (!hero) return null;
  const tc = TIER_COLOR[hero.tier];

  return (
    <div
      className="backdrop-enter"
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(0,0,0,0.78)', backdropFilter: 'blur(5px)',
        display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
      }}
    >
      <div
        className="modal-enter"
        onClick={e => e.stopPropagation()}
        style={{
          background: '#0d1117', borderRadius: '20px 20px 0 0',
          width: '100%', maxWidth: 600,
          maxHeight: '92dvh', overflowY: 'auto',
          border: `1px solid ${tc}30`, borderBottom: 'none',
          boxShadow: `0 -8px 40px ${tc}25`,
        }}
      >
        {/* Drag handle */}
        <div style={{ display: 'flex', justifyContent: 'center', padding: '10px 0 0' }}>
          <div style={{ width: 40, height: 4, borderRadius: 2, background: '#2a3444' }} />
        </div>

        {/* Tier accent line */}
        <div style={{ height: 2, background: `linear-gradient(90deg,transparent,${tc},transparent)`, margin: '8px 0 0' }} />

        {/* Banner */}
        <div style={{
          display: 'flex', gap: 14, padding: '14px 18px 16px',
          borderBottom: '1px solid #1a2233',
          background: `linear-gradient(135deg,${tc}10,transparent)`,
        }}>
          <div style={{
            width: 72, height: 72, borderRadius: 12, overflow: 'hidden',
            flexShrink: 0, border: `2px solid ${tc}44`,
            boxShadow: `0 4px 16px ${tc}22`,
            position: 'relative',
          }}>
            <HeroPortrait hero={hero} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
              <span style={{ fontFamily: '"Outfit",sans-serif', fontWeight: 800, fontSize: 20, color: '#e8edf2' }}>
                {hero.name}
              </span>
              <TierBadge tier={hero.tier} />
            </div>
            <div style={{ fontSize: 12, color: '#5a7090', fontStyle: 'italic', marginBottom: 6 }}>
              {hero.title}
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
              {hero.roles.map(r => <RolePill key={r} role={r} />)}
              {hero.lanes.map(l => (
                <span key={l} style={{
                  display: 'inline-block', padding: '1px 6px', borderRadius: 20,
                  fontSize: 10, fontWeight: 700, background: '#1a2333', color: '#6a7a8a',
                }}>{l.toUpperCase()}</span>
              ))}
            </div>
          </div>
          <button onClick={onClose} style={{
            all: 'unset', cursor: 'pointer', width: 32, height: 32, flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#4a5a6a', borderRadius: 8, background: '#1a2333', fontSize: 16,
            transition: 'color 0.15s, background 0.15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.color = '#e8edf2'; e.currentTarget.style.background = '#2a3444'; }}
          onMouseLeave={e => { e.currentTarget.style.color = '#4a5a6a'; e.currentTarget.style.background = '#1a2333'; }}
          >✕</button>
        </div>

        {/* Body */}
        <div style={{ padding: '16px 18px 32px', display: 'flex', flexDirection: 'column', gap: 18 }}>
          <p style={{ fontSize: 14, lineHeight: 1.65, color: '#8899aa', margin: 0 }}>{hero.overview}</p>

          {/* Spec badge */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '8px 12px', background: '#131920', borderRadius: 8, border: '1px solid #1e2836',
          }}>
            <span style={{ fontSize: 12, color: '#4a5a6a', fontWeight: 600, letterSpacing: 1 }}>SPEC</span>
            <span style={{ fontSize: 13, color: tc, fontWeight: 700 }}>{hero.spec}</span>
            {hero.released && (
              <span style={{ marginLeft: 'auto', fontSize: 11, color: '#3a4a5a' }}>Released {hero.released}</span>
            )}
          </div>

          {/* Strengths & Weaknesses */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.5, color: '#22c55e', marginBottom: 8 }}>STRENGTHS</div>
              <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 6 }}>
                {hero.strengths.map((s, i) => (
                  <li key={i} style={{ display: 'flex', gap: 6, alignItems: 'flex-start', fontSize: 12, color: '#8899aa', lineHeight: 1.5 }}>
                    <span style={{ color: '#22c55e', flexShrink: 0, marginTop: 2 }}>▸</span>{s}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.5, color: '#ef4444', marginBottom: 8 }}>WEAKNESSES</div>
              <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 6 }}>
                {hero.weaknesses.map((w, i) => (
                  <li key={i} style={{ display: 'flex', gap: 6, alignItems: 'flex-start', fontSize: 12, color: '#8899aa', lineHeight: 1.5 }}>
                    <span style={{ color: '#ef4444', flexShrink: 0, marginTop: 2 }}>▸</span>{w}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Build */}
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.5, color: '#f59e0b', marginBottom: 10 }}>RECOMMENDED BUILD</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {hero.build.map((item, i) => (
                <span key={i} style={{
                  padding: '5px 10px', borderRadius: 8, fontSize: 12, fontWeight: 600,
                  background: '#1a2333', color: '#c8d8e8', border: '1px solid #2a3444',
                  display: 'flex', alignItems: 'center', gap: 5,
                  transition: 'background 0.15s',
                }}>
                  <span style={{ color: '#f59e0b', fontSize: 10, fontWeight: 800 }}>{i + 1}</span>
                  {item}
                </span>
              ))}
            </div>
          </div>

          {/* Counters */}
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.5, color: '#ef4444', marginBottom: 10 }}>COUNTERED BY</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {hero.counter.map((c, i) => (
                <span key={i} style={{
                  padding: '4px 10px', borderRadius: 20, fontSize: 12,
                  background: '#2a1515', color: '#ef8888', border: '1px solid #3a2222',
                }}>{c}</span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
