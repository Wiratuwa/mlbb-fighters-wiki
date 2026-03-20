import { useState, useCallback } from "react";
import { HEROES } from './data/heroes.js';
import EncyclopediaTab from './components/EncyclopediaTab.jsx';
import CounterTab from './components/CounterTab.jsx';

const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800;900&family=Cinzel:wght@600;700&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html, body, #root { height: 100%; background: #0a0e14; color: #e8edf2; }
  body { font-family: 'Outfit', system-ui, sans-serif; -webkit-font-smoothing: antialiased; }
  ::-webkit-scrollbar { width: 4px; height: 4px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: #2a3444; border-radius: 2px; }
  input::placeholder { color: #2a3444; }
  input { caret-color: #60aaff; }

  @keyframes fadeUp {
    from { opacity:0; transform:translateY(20px); }
    to   { opacity:1; transform:translateY(0); }
  }
  @keyframes fadeIn {
    from { opacity:0; }
    to   { opacity:1; }
  }
  @keyframes slideUp {
    from { opacity:0; transform:translateY(48px); }
    to   { opacity:1; transform:translateY(0); }
  }
  @keyframes slideDown {
    from { opacity:0; transform:translateY(-14px); }
    to   { opacity:1; transform:translateY(0); }
  }
  @keyframes scaleIn {
    from { opacity:0; transform:scale(0.88); }
    to   { opacity:1; transform:scale(1); }
  }

  .tab-enter         { animation: fadeUp   0.3s cubic-bezier(.2,.8,.2,1) both; }
  .header-enter      { animation: slideDown 0.4s cubic-bezier(.2,.8,.2,1) both; }
  .modal-enter       { animation: slideUp  0.32s cubic-bezier(.2,.8,.2,1) both; }
  .backdrop-enter    { animation: fadeIn   0.2s ease both; }
  .card-enter        { animation: fadeUp   0.4s cubic-bezier(.2,.8,.2,1) both; }
  .result-enter      { animation: fadeUp   0.35s cubic-bezier(.2,.8,.2,1) both; }
  .enemy-enter       { animation: scaleIn  0.22s cubic-bezier(.2,.8,.2,1) both; }

  .btn-press  { transition: transform 0.12s, opacity 0.12s; }
  .btn-press:active { transform: scale(0.95); opacity: 0.82; }

  .counter-row { transition: transform 0.18s cubic-bezier(.2,.8,.2,1), border-color 0.15s, box-shadow 0.2s; }
  .counter-row:hover { transform: translateX(5px); }

  .picker-item { transition: transform 0.15s, border-color 0.15s, background 0.12s; }
  .picker-item:hover:not(:disabled) { transform: translateY(-3px) scale(1.05); }
  .picker-item:active:not(:disabled) { transform: scale(0.94); }

  .tier-badge-3d {
    transition: transform 0.3s cubic-bezier(.2,.8,.2,1);
    transform-style: preserve-3d;
  }
  .tier-badge-3d:hover { transform: rotateY(22deg) rotateX(-8deg) scale(1.14); }

  .filter-pill { transition: all 0.15s cubic-bezier(.2,.8,.2,1); }
  .filter-pill:hover { transform: translateY(-1px); }
  .filter-pill:active { transform: scale(0.95); }
`;

/* NavBtn OUTSIDE App component — never recreated on state change */
function NavBtn({ id, activeTab, onSelect, icon, label }) {
  const active = activeTab === id;
  return (
    <button
      onClick={() => onSelect(id)}
      className="btn-press"
      style={{
        all: 'unset', cursor: 'pointer', flex: 1,
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
        padding: '9px 0',
        color: active ? '#60aaff' : '#3a4a5a',
        transition: 'color 0.2s',
        borderTop: active ? '2px solid #60aaff' : '2px solid transparent',
      }}
    >
      <span style={{ fontSize: 18 }}>{icon}</span>
      <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.5 }}>{label}</span>
    </button>
  );
}

function MetaBadge({ children, accent }) {
  return (
    <span style={{
      padding: '3px 8px', borderRadius: 6, fontSize: 10, fontWeight: 700,
      background: accent ? '#1a2d4a' : '#131920',
      color: accent ? '#60aaff' : '#3a4a5a',
      border: accent ? '1px solid #2a4a7a' : '1px solid #1e2836',
    }}>
      {children}
    </span>
  );
}

export default function App() {
  const [tab, setTab] = useState('encyclopedia');
  const handleTab = useCallback((id) => setTab(id), []);

  return (
    <>
      <style>{STYLES}</style>
      <div style={{ minHeight: '100dvh', background: '#0a0e14', maxWidth: 600, margin: '0 auto', position: 'relative' }}>

        {/* Header */}
        <div className="header-enter" style={{
          background: '#0a0e14', borderBottom: '1px solid #131920',
          padding: '14px 16px 12px',
          position: 'sticky', top: 0, zIndex: 200,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 8, flexShrink: 0,
              background: 'linear-gradient(135deg,#1a3a6a,#0a1a3a)',
              border: '1px solid #2a4a8a',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 18, boxShadow: '0 0 16px #1a4a8a55',
            }}>⚔</div>
            <div>
              <div style={{ fontFamily: '"Cinzel",serif', fontWeight: 700, fontSize: 15, color: '#e8edf2', lineHeight: 1.1 }}>
                Fighter Encyclopedia
              </div>
              <div style={{ fontSize: 10, color: '#3a4a5a', letterSpacing: 1 }}>
                MOBILE LEGENDS · LAND OF DAWN
              </div>
            </div>
            <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
              <MetaBadge>{HEROES.length} Heroes</MetaBadge>
              <MetaBadge accent>Patch 2026</MetaBadge>
            </div>
          </div>
        </div>

        {/* Tab Content — key forces remount + enter animation on tab switch */}
        <div key={tab} className="tab-enter">
          {tab === 'encyclopedia' ? <EncyclopediaTab /> : <CounterTab />}
        </div>

        {/* Bottom Nav */}
        <div style={{
          position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)',
          width: '100%', maxWidth: 600,
          background: 'rgba(10,14,20,0.96)', backdropFilter: 'blur(14px)',
          borderTop: '1px solid #131920',
          display: 'flex', zIndex: 300,
          paddingBottom: 'env(safe-area-inset-bottom)',
        }}>
          <NavBtn id="encyclopedia" activeTab={tab} onSelect={handleTab} icon="📖" label="ENSIKLOPEDI" />
          <NavBtn id="counter"      activeTab={tab} onSelect={handleTab} icon="⚔"  label="COUNTER PICK" />
        </div>
      </div>
    </>
  );
}
