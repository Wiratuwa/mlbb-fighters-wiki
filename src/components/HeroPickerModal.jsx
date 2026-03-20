import { useState, useEffect, useRef, useMemo } from "react";
import { ALL_HEROES } from '../data/heroes.js';
/* FIX: heroAvatarColor was missing — this caused the white screen crash */
import { roleColor, heroAvatarColor } from '../utils/helpers.js';
import HeroAvatar from './ui/HeroAvatar.jsx';

export default function HeroPickerModal({ onSelect, selectedNames, onClose }) {
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');
  const inputRef = useRef(null);

  /* Auto-focus search input */
  useEffect(() => {
    const t = setTimeout(() => inputRef.current?.focus(), 80);
    return () => clearTimeout(t);
  }, []);

  /* Lock body scroll while picker is open */
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, []);

  /* Escape key */
  useEffect(() => {
    const h = e => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', h);
    return () => document.removeEventListener('keydown', h);
  }, [onClose]);

  const roles = ['All', 'Tank', 'Fighter', 'Assassin', 'Mage', 'Marksman', 'Support'];

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return ALL_HEROES.filter(h => {
      if (roleFilter !== 'All' && h.role !== roleFilter) return false;
      if (q && !h.name.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [search, roleFilter]);

  return (
    <div
      className="backdrop-enter"
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 2000,
        background: 'rgba(0,0,0,0.82)', backdropFilter: 'blur(5px)',
        display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
      }}
    >
      <div
        className="modal-enter"
        onClick={e => e.stopPropagation()}
        style={{
          background: '#0d1117', borderRadius: '20px 20px 0 0',
          width: '100%', maxWidth: 600,
          maxHeight: '88dvh', display: 'flex', flexDirection: 'column',
          border: '1px solid #1e2836', borderBottom: 'none',
          boxShadow: '0 -8px 40px rgba(0,0,0,0.6)',
        }}
      >
        {/* Drag handle */}
        <div style={{ display: 'flex', justifyContent: 'center', padding: '10px 0 4px' }}>
          <div style={{ width: 40, height: 4, borderRadius: 2, background: '#2a3444' }} />
        </div>

        {/* Search row */}
        <div style={{ padding: '4px 14px 8px' }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <input
              ref={inputRef}
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Cari hero musuh..."
              style={{
                flex: 1, padding: '9px 12px', borderRadius: 10,
                background: '#131920', border: '1px solid #1e2836',
                color: '#e8edf2', fontSize: 14, outline: 'none', fontFamily: 'inherit',
                transition: 'border-color 0.15s',
              }}
              onFocus={e => { e.target.style.borderColor = '#3a6aaa'; }}
              onBlur={e => { e.target.style.borderColor = '#1e2836'; }}
            />
            <button
              onClick={onClose}
              className="btn-press"
              style={{
                all: 'unset', cursor: 'pointer', width: 36, height: 36,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#4a5a6a', background: '#131920', borderRadius: 8,
                border: '1px solid #1e2836', fontSize: 16,
                transition: 'color 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.color = '#e8edf2'; }}
              onMouseLeave={e => { e.currentTarget.style.color = '#4a5a6a'; }}
            >✕</button>
          </div>
        </div>

        {/* Role filter chips */}
        <div style={{ display: 'flex', gap: 6, padding: '0 14px 10px', overflowX: 'auto' }}>
          {roles.map(r => (
            <button
              key={r}
              onClick={() => setRoleFilter(r)}
              className="filter-pill"
              style={{
                all: 'unset', cursor: 'pointer',
                padding: '4px 12px', borderRadius: 20, fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap',
                background: roleFilter === r ? `${roleColor(r)}22` : '#131920',
                color: roleFilter === r ? roleColor(r) : '#4a5a6a',
                border: roleFilter === r ? `1px solid ${roleColor(r)}55` : '1px solid #1e2836',
              }}
            >{r}</button>
          ))}
        </div>

        {/* Count */}
        <div style={{ padding: '0 14px 6px', fontSize: 11, color: '#3a4a5a' }}>
          {filtered.length} heroes
        </div>

        {/* Hero grid */}
        <div style={{ overflowY: 'auto', flex: 1, padding: '4px 14px 28px' }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill,minmax(72px,1fr))',
            gap: 8,
          }}>
            {filtered.map((h, idx) => {
              const isSel = selectedNames.includes(h.name);
              /* heroAvatarColor is now correctly imported */
              const [bg] = heroAvatarColor(h.name);
              return (
                <button
                  key={h.name}
                  onClick={() => { if (!isSel) onSelect(h); }}
                  disabled={isSel}
                  className="picker-item"
                  style={{
                    all: 'unset',
                    cursor: isSel ? 'default' : 'pointer',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5,
                    padding: '8px 4px', borderRadius: 10,
                    background: isSel ? '#1a2833' : '#131920',
                    border: isSel ? `1px solid ${roleColor(h.role)}44` : '1px solid #1e2836',
                    opacity: isSel ? 0.45 : 1,
                    animationDelay: `${idx * 0.012}s`,
                  }}
                  onMouseEnter={e => {
                    if (!isSel) {
                      e.currentTarget.style.borderColor = roleColor(h.role) + '77';
                      e.currentTarget.style.background = '#1a2030';
                    }
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.borderColor = isSel ? `${roleColor(h.role)}44` : '#1e2836';
                    e.currentTarget.style.background = isSel ? '#1a2833' : '#131920';
                  }}
                >
                  <HeroAvatar hero={h} size={44} />
                  <span style={{
                    fontSize: 10, color: '#8899aa', textAlign: 'center',
                    lineHeight: 1.2, width: '100%',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    padding: '0 2px',
                  }}>
                    {h.name}
                  </span>
                  <span style={{ fontSize: 9, color: roleColor(h.role), fontWeight: 700 }}>
                    {h.role.slice(0, 3).toUpperCase()}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
