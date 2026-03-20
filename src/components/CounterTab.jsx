import { useState, useCallback } from "react";
import { HEROES } from '../data/heroes.js';
import { TIER_COLOR } from '../utils/helpers.js';
import { scoreHeroVsEnemies } from '../utils/counter.js';
import HeroAvatar from './ui/HeroAvatar.jsx';
import TierBadge from './ui/TierBadge.jsx';
import HeroModal from './HeroModal.jsx';
import HeroPickerModal from './HeroPickerModal.jsx';

/* ─── Section wrapper ─── */
function Section({ num, title, children }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <div style={{
          width: 22, height: 22, borderRadius: 6,
          background: '#1a2d4a', color: '#60aaff',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 11, fontWeight: 800, border: '1px solid #2a4a7a', flexShrink: 0,
          boxShadow: '0 0 8px #2a4a8a44',
        }}>{num}</div>
        <span style={{ fontFamily: '"Outfit",sans-serif', fontWeight: 700, fontSize: 14, color: '#8899aa' }}>
          {title}
        </span>
      </div>
      {children}
    </div>
  );
}

/* ─── DraftBtn defined OUTSIDE CounterTab so it's not recreated ─── */
function DraftBtn({ mode, label, desc, isActive, onClick }) {
  return (
    <button
      onClick={() => onClick(mode)}
      className="btn-press"
      style={{
        all: 'unset', cursor: 'pointer', flex: 1,
        padding: '12px 14px', borderRadius: 12,
        background: isActive ? '#1a2d4a' : '#0d1117',
        border: isActive ? '1px solid #2a4a7a' : '1px solid #1e2836',
        transition: 'all 0.2s cubic-bezier(.2,.8,.2,1)',
        boxShadow: isActive ? '0 0 16px #1a4a8a33' : 'none',
      }}
    >
      <div style={{ fontWeight: 700, fontSize: 13, color: isActive ? '#60aaff' : '#4a5a6a', marginBottom: 3 }}>
        {label}
      </div>
      <div style={{ fontSize: 11, color: '#3a4a5a', lineHeight: 1.4 }}>{desc}</div>
    </button>
  );
}

/* ─── Counter Results ─── */
function CounterResults({ results, enemies, draftMode }) {
  const [selectedHero, setSelectedHero] = useState(null);

  return (
    <div className="result-enter" style={{ marginTop: 24 }}>
      {/* Enemy summary */}
      <div style={{
        padding: '12px 14px', background: '#0a0e14', borderRadius: 12,
        border: '1px solid #1e2836', marginBottom: 16,
        display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8,
      }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: '#3a4a5a', letterSpacing: 1 }}>VS</span>
        {enemies.map(e => (
          <div key={e.name} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <HeroAvatar hero={e} size={28} />
            <span style={{ fontSize: 11, color: '#6a7a8a' }}>{e.name}</span>
          </div>
        ))}
        <span style={{
          marginLeft: 'auto', fontSize: 11, color: '#3a4a5a',
          background: '#131920', padding: '3px 8px', borderRadius: 6, border: '1px solid #1e2836',
        }}>
          {draftMode === 'first' ? 'First Pick' : 'Second Pick'}
        </span>
      </div>

      <div style={{ fontFamily: '"Outfit",sans-serif', fontWeight: 800, fontSize: 16, color: '#e8edf2', marginBottom: 12 }}>
        Rekomendasi Counter
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {results.map((h, i) => {
          const tc = TIER_COLOR[h.tier];
          return (
            <button
              key={h.name}
              onClick={() => setSelectedHero(h)}
              className="counter-row btn-press"
              style={{
                all: 'unset', cursor: 'pointer',
                display: 'flex', gap: 12, alignItems: 'center',
                padding: '12px 14px', borderRadius: 12,
                background: i === 0
                  ? 'linear-gradient(135deg,#1a2d1a,#0d1117)'
                  : 'linear-gradient(135deg,#111827,#0d1117)',
                border: `1px solid ${i === 0 ? '#22c55e33' : '#1e2836'}`,
                position: 'relative', overflow: 'hidden',
                animationDelay: `${i * 0.06}s`,
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = tc + '55';
                e.currentTarget.style.boxShadow = `0 4px 20px ${tc}15`;
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = i === 0 ? '#22c55e33' : '#1e2836';
                e.currentTarget.style.boxShadow = '';
              }}
            >
              {/* Rank accent bar */}
              {i === 0 && (
                <div style={{
                  position: 'absolute', top: 0, left: 0, right: 0, height: 2,
                  background: 'linear-gradient(90deg,#22c55e,transparent)',
                }} />
              )}

              {/* Avatar + rank badge */}
              <div style={{ position: 'relative', flexShrink: 0 }}>
                <HeroAvatar hero={h} size={48} />
                {i < 3 && (
                  <div style={{
                    position: 'absolute', bottom: -2, right: -2,
                    width: 16, height: 16, borderRadius: '50%',
                    background: ['#f59e0b', '#9ca3af', '#cd7c3a'][i],
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 9, fontWeight: 900, color: '#000',
                    boxShadow: '0 1px 4px rgba(0,0,0,0.5)',
                  }}>{i + 1}</div>
                )}
              </div>

              {/* Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                  <span style={{ fontWeight: 700, fontSize: 14, color: '#e8edf2' }}>
                    {i === 0 ? '⭐ ' : ''}{h.name}
                  </span>
                  <TierBadge tier={h.tier} />
                </div>
                <div style={{ fontSize: 11, color: '#5a6a7a', marginBottom: 5, lineHeight: 1.4 }}>
                  {h.uniqueReason}
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                  {h.reasons.map((r, j) => (
                    <span key={j} style={{
                      fontSize: 10, padding: '2px 7px', borderRadius: 10,
                      background: '#1a2d1a', color: '#22c55e', border: '1px solid #1a3a1a',
                    }}>{r}</span>
                  ))}
                  {h.avoidWarnings.map((w, j) => (
                    <span key={j} style={{
                      fontSize: 10, padding: '2px 7px', borderRadius: 10,
                      background: '#2d1a1a', color: '#ef6666', border: '1px solid #3a1a1a',
                    }}>⚠ {w}</span>
                  ))}
                </div>
              </div>

              {/* Score */}
              <div style={{ flexShrink: 0, textAlign: 'center', minWidth: 44 }}>
                <div style={{
                  fontWeight: 900, fontSize: 22,
                  color: h.score >= 60 ? '#22c55e' : h.score >= 40 ? '#f59e0b' : '#ef4444',
                  animation: 'scaleIn 0.3s cubic-bezier(.2,.8,.2,1) both',
                  animationDelay: `${i * 0.06 + 0.1}s`,
                  display: 'inline-block',
                }}>{h.score}</div>
                <div style={{ fontSize: 9, color: '#3a4a5a', fontWeight: 700, letterSpacing: 1 }}>SCORE</div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Hero detail modal — z-index 1000 is above content but picker (2000) is closed by now */}
      {selectedHero && <HeroModal hero={selectedHero} onClose={() => setSelectedHero(null)} />}
    </div>
  );
}

/* ─── Counter Picker Tab ─── */
export default function CounterTab() {
  const [draftMode, setDraftMode] = useState('first');
  const [enemyPicks, setEnemyPicks] = useState([]);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [results, setResults] = useState(null);
  const MAX_ENEMIES = 5;

  const addEnemy = useCallback((h) => {
    setEnemyPicks(prev => {
      if (prev.length >= MAX_ENEMIES || prev.find(e => e.name === h.name)) return prev;
      return [...prev, h];
    });
    setPickerOpen(false);
    setResults(null);
  }, []);

  const removeEnemy = useCallback((idx) => {
    setEnemyPicks(prev => prev.filter((_, i) => i !== idx));
    setResults(null);
  }, []);

  const analyse = useCallback(() => {
    if (enemyPicks.length < 2) return;
    const scored = HEROES
      .map(h => ({ ...h, ...scoreHeroVsEnemies(h, enemyPicks, draftMode) }))
      .filter(h => h.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 8);
    setResults(scored);
  }, [enemyPicks, draftMode]);

  const canAnalyse = enemyPicks.length >= 2;

  return (
    <div style={{ padding: '16px 16px 100px' }}>

      {/* Step 1: Draft Mode */}
      <Section num={1} title="Skenario Draft">
        <div style={{ display: 'flex', gap: 8 }}>
          <DraftBtn
            mode="first" label="🏹 First Pick" desc="Kamu pilih sebelum musuh reveal semua hero"
            isActive={draftMode === 'first'} onClick={setDraftMode}
          />
          <DraftBtn
            mode="second" label="🗡 Second Pick" desc="Kamu pilih setelah melihat lineup musuh"
            isActive={draftMode === 'second'} onClick={setDraftMode}
          />
        </div>
      </Section>

      {/* Step 2: Enemy Heroes */}
      <Section
        num={2}
        title={
          <>
            Pilih Hero Musuh{' '}
            <span style={{ fontSize: 11, fontWeight: 400, color: '#3a4a5a', fontStyle: 'italic' }}>
              (2–5 hero)
            </span>
          </>
        }
      >
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
          {enemyPicks.map((e, i) => (
            <div key={e.name} className="enemy-enter" style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
              animationDelay: `${i * 0.06}s`,
            }}>
              <div style={{ position: 'relative' }}>
                <HeroAvatar hero={e} size={52} />
                <button
                  onClick={() => removeEnemy(i)}
                  className="btn-press"
                  style={{
                    all: 'unset', cursor: 'pointer',
                    position: 'absolute', top: -4, right: -4,
                    width: 18, height: 18, borderRadius: '50%',
                    background: '#ef4444', color: 'white',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 10, fontWeight: 700,
                    boxShadow: '0 2px 6px rgba(239,68,68,0.5)',
                    transition: 'transform 0.12s, background 0.12s',
                  }}
                  onMouseEnter={e2 => { e2.currentTarget.style.background = '#dc2626'; }}
                  onMouseLeave={e2 => { e2.currentTarget.style.background = '#ef4444'; }}
                >✕</button>
              </div>
              <span style={{ fontSize: 10, color: '#5a6a7a', maxWidth: 56, textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {e.name}
              </span>
            </div>
          ))}

          {enemyPicks.length < MAX_ENEMIES && (
            <button
              onClick={() => setPickerOpen(true)}
              className="btn-press"
              style={{
                all: 'unset', cursor: 'pointer',
                width: 52, height: 52, borderRadius: '50%',
                background: '#131920', border: '2px dashed #2a3444',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#3a4a5a', fontSize: 22,
                transition: 'border-color 0.18s, color 0.18s, box-shadow 0.18s',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = '#3a6aaa';
                e.currentTarget.style.color = '#60aaff';
                e.currentTarget.style.boxShadow = '0 0 14px #1a4a8a44';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = '#2a3444';
                e.currentTarget.style.color = '#3a4a5a';
                e.currentTarget.style.boxShadow = '';
              }}
            >+</button>
          )}
        </div>
        <div style={{ marginTop: 10, fontSize: 12, color: '#3a4a5a' }}>
          {enemyPicks.length} / {MAX_ENEMIES} hero dipilih
          {enemyPicks.length < 2 ? ` — tambah minimal ${2 - enemyPicks.length} lagi` : ''}
        </div>
      </Section>

      {/* Action buttons */}
      <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
        <button
          onClick={() => { setEnemyPicks([]); setResults(null); }}
          className="btn-press"
          style={{
            all: 'unset', cursor: 'pointer',
            padding: '11px 16px', borderRadius: 10,
            background: '#131920', color: '#4a5a6a',
            border: '1px solid #1e2836', fontSize: 13, fontWeight: 600,
            transition: 'border-color 0.15s, color 0.15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = '#2a3444'; e.currentTarget.style.color = '#8899aa'; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = '#1e2836'; e.currentTarget.style.color = '#4a5a6a'; }}
        >Reset</button>

        <button
          onClick={analyse}
          disabled={!canAnalyse}
          className="btn-press"
          style={{
            all: 'unset',
            cursor: canAnalyse ? 'pointer' : 'not-allowed',
            flex: 1, padding: '11px 16px', borderRadius: 10,
            background: canAnalyse
              ? 'linear-gradient(135deg,#1a4a8a,#1a3a6a)'
              : '#131920',
            color: canAnalyse ? '#8ccaff' : '#2a3444',
            border: `1px solid ${canAnalyse ? '#2a5a9a' : '#1e2836'}`,
            fontSize: 13, fontWeight: 700, textAlign: 'center',
            transition: 'all 0.2s cubic-bezier(.2,.8,.2,1)',
            boxShadow: canAnalyse ? '0 4px 20px #1a4a8a44' : 'none',
          }}
        >
          {canAnalyse ? '⚔ Cari Counter Pick →' : 'Pilih minimal 2 hero musuh'}
        </button>
      </div>

      {/* Results */}
      {results && (
        <CounterResults
          key={results.map(r => r.name).join(',')}
          results={results}
          enemies={enemyPicks}
          draftMode={draftMode}
        />
      )}

      {/* Hero picker modal */}
      {pickerOpen && (
        <HeroPickerModal
          onSelect={addEnemy}
          selectedNames={enemyPicks.map(e => e.name)}
          onClose={() => setPickerOpen(false)}
        />
      )}
    </div>
  );
}
