import { useState, useMemo } from "react";
import { HEROES } from '../data/heroes.js';
import { TIER_COLOR, TIER_BG } from '../utils/helpers.js';
import { HeroCard } from './HeroCard.jsx';
import HeroModal from './HeroModal.jsx';

const TIER_NAMES = {
  S: 'Supreme — Meta Dominators',
  A: 'A-Tier — Strong Picks',
  B: 'B-Tier — Situationally Viable',
  C: 'C-Tier — Comfort / Niche',
};

function FilterPill({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className="filter-pill"
      style={{
        all: 'unset', cursor: 'pointer',
        padding: '5px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600,
        background: active ? '#1e3a5a' : '#131920',
        color: active ? '#60aaff' : '#4a5a6a',
        border: active ? '1px solid #2a4a7a' : '1px solid #1e2836',
        whiteSpace: 'nowrap',
      }}
    >{children}</button>
  );
}

export default function EncyclopediaTab() {
  const [query, setQuery]         = useState('');
  const [tierFilter, setTierFilter] = useState('all');
  const [laneFilter, setLaneFilter] = useState('all');
  const [sortBy, setSortBy]       = useState('tier');
  const [selectedHero, setSelectedHero] = useState(null);

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    let list = HEROES.filter(h => {
      if (tierFilter !== 'all' && h.tier !== tierFilter) return false;
      if (laneFilter === 'exp'    && !h.lanes.includes('exp'))    return false;
      if (laneFilter === 'jungle' && !h.lanes.includes('jungle')) return false;
      if (q && !h.name.toLowerCase().includes(q)
            && !h.spec.toLowerCase().includes(q)
            && !h.roles.join(' ').toLowerCase().includes(q)) return false;
      return true;
    });
    if (sortBy === 'alpha') {
      list.sort((a, b) => a.name.localeCompare(b.name));
    } else {
      const o = { S: 0, A: 1, B: 2, C: 3 };
      list.sort((a, b) => o[a.tier] - o[b.tier] || a.name.localeCompare(b.name));
    }
    return list;
  }, [query, tierFilter, laneFilter, sortBy]);

  const grouped = useMemo(() => {
    if (sortBy !== 'tier' || tierFilter !== 'all') return null;
    const g = {};
    filtered.forEach(h => {
      if (!g[h.tier]) g[h.tier] = [];
      g[h.tier].push(h);
    });
    return g;
  }, [filtered, sortBy, tierFilter]);

  return (
    <div>
      {/* Sticky controls */}
      <div style={{
        padding: '12px 16px',
        background: 'rgba(10,14,20,0.96)', backdropFilter: 'blur(12px)',
        borderBottom: '1px solid #131920',
        display: 'flex', flexDirection: 'column', gap: 10,
        position: 'sticky', top: 56, zIndex: 100,
      }}>
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="⚔ Cari hero..."
          style={{
            width: '100%', boxSizing: 'border-box',
            padding: '10px 14px', borderRadius: 10,
            background: '#131920', border: '1px solid #1e2836',
            color: '#e8edf2', fontSize: 14, outline: 'none', fontFamily: 'inherit',
            transition: 'border-color 0.15s',
          }}
          onFocus={e => { e.target.style.borderColor = '#3a6aaa'; }}
          onBlur={e => { e.target.style.borderColor = '#1e2836'; }}
        />
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 2 }}>
          <span style={{ fontSize: 11, color: '#3a4a5a', fontWeight: 600, letterSpacing: 1, alignSelf: 'center', whiteSpace: 'nowrap' }}>
            TIER
          </span>
          {['all', 'S', 'A', 'B', 'C'].map(t => (
            <FilterPill key={t} active={tierFilter === t} onClick={() => setTierFilter(t)}>
              {t === 'all' ? 'Semua' : t}
            </FilterPill>
          ))}
          <div style={{ width: 1, background: '#1e2836', flexShrink: 0 }} />
          <span style={{ fontSize: 11, color: '#3a4a5a', fontWeight: 600, letterSpacing: 1, alignSelf: 'center', whiteSpace: 'nowrap' }}>
            LANE
          </span>
          {['all', 'exp', 'jungle'].map(l => (
            <FilterPill key={l} active={laneFilter === l} onClick={() => setLaneFilter(l)}>
              {l === 'all' ? 'Semua' : l.toUpperCase()}
            </FilterPill>
          ))}
          <div style={{ width: 1, background: '#1e2836', flexShrink: 0 }} />
          <FilterPill active={false} onClick={() => setSortBy(s => s === 'tier' ? 'alpha' : 'tier')}>
            {sortBy === 'tier' ? '↕ Tier' : '↕ A–Z'}
          </FilterPill>
        </div>
      </div>

      {/* Count */}
      <div style={{ padding: '10px 16px', fontSize: 12, color: '#3a4a5a' }}>
        {filtered.length} hero ditemukan
      </div>

      {/* Grid */}
      <div style={{ padding: '0 12px 80px' }}>
        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#3a4a5a', fontSize: 14 }}>
            Tidak ada hero yang cocok.
          </div>
        ) : grouped ? (
          ['S', 'A', 'B', 'C'].filter(t => grouped[t]?.length).map(t => {
            /* Calculate global stagger offset per tier section */
            const prevCount = ['S','A','B','C']
              .slice(0, ['S','A','B','C'].indexOf(t))
              .reduce((acc, pt) => acc + (grouped[pt]?.length || 0), 0);
            return (
              <div key={t} style={{ marginBottom: 24 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, padding: '0 4px' }}>
                  {/* 3D tier badge */}
                  <div
                    className="tier-badge-3d"
                    style={{
                      width: 28, height: 28, borderRadius: 6,
                      background: TIER_BG[t], color: TIER_COLOR[t],
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontWeight: 900, fontSize: 13, border: `1px solid ${TIER_COLOR[t]}35`,
                      boxShadow: `0 2px 10px ${TIER_COLOR[t]}20`,
                    }}
                  >{t}</div>
                  <span style={{ fontFamily: '"Outfit",sans-serif', fontWeight: 700, fontSize: 13, color: '#4a5a6a' }}>
                    {TIER_NAMES[t]}
                  </span>
                  <div style={{ flex: 1, height: 1, background: '#1a2233' }} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(140px,1fr))', gap: 10 }}>
                  {grouped[t].map((h, i) => (
                    <HeroCard key={h.name} hero={h} onClick={setSelectedHero} index={prevCount + i} />
                  ))}
                </div>
              </div>
            );
          })
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(140px,1fr))', gap: 10 }}>
            {filtered.map((h, i) => (
              <HeroCard key={h.name} hero={h} onClick={setSelectedHero} index={i} />
            ))}
          </div>
        )}
      </div>

      {selectedHero && <HeroModal hero={selectedHero} onClose={() => setSelectedHero(null)} />}
    </div>
  );
}
