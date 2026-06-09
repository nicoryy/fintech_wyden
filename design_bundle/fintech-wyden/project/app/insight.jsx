// insight.jsx — behavioral insight detail (bottom sheet). Reinforces the
// product's differentiator: the "por quê", not just the "onde".

function InsightSheet({ open, onClose }) {
  if (!open) return null;
  const bars = [
    { d: 'Seg', v: 0.30 }, { d: 'Ter', v: 0.26 }, { d: 'Qua', v: 0.34 },
    { d: 'Qui', v: 0.40 }, { d: 'Sex', v: 0.62 }, { d: 'Sáb', v: 0.95, hot: true }, { d: 'Dom', v: 0.80, hot: true },
  ];
  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 85, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
      <div className="scrim" onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(20,24,30,.4)' }} />
      <div className="sheet" style={{ position: 'relative', background: 'var(--bg)', borderRadius: '28px 28px 0 0',
        padding: '10px 20px 30px', maxHeight: '88%', overflowY: 'auto', boxShadow: '0 -10px 40px rgba(20,30,40,.2)' }}>
        <div style={{ width: 40, height: 5, borderRadius: 999, background: 'var(--line)', margin: '0 auto 16px' }} />

        <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
          <span style={{ width: 42, height: 42, borderRadius: 13, background: 'var(--purple-chip)', display: 'grid', placeItems: 'center' }}>
            <Icon name="brain" size={24} stroke="var(--purple)" sw={1.7} />
          </span>
          <div>
            <div style={{ fontSize: 12.5, fontWeight: 800, color: 'var(--purple-ink)', letterSpacing: .3 }}>INSIGHT COMPORTAMENTAL</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--ink)', letterSpacing: -.3 }}>Gasto por impulso</div>
          </div>
        </div>

        <div style={{ fontSize: 15, color: 'var(--ink-2)', lineHeight: 1.45, marginTop: 14 }}>
          Identificamos <b style={{ color: 'var(--ink)' }}>9 compras fora do seu padrão</b> este mês — a maioria concentrada nos finais de semana, à noite.
        </div>

        {/* weekly pattern */}
        <div style={{ background: 'var(--card)', borderRadius: 20, padding: 18, marginTop: 16, boxShadow: '0 1px 2px rgba(20,30,40,.04)' }}>
          <div style={{ fontSize: 13.5, fontWeight: 800, color: 'var(--ink)', marginBottom: 14 }}>Impulso por dia da semana</div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 110 }}>
            {bars.map(b => (
              <div key={b.d} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 7 }}>
                <div style={{ width: '100%', height: 86, display: 'flex', alignItems: 'flex-end' }}>
                  <div style={{ width: '100%', height: (b.v * 100) + '%', borderRadius: 7,
                    background: b.hot ? 'var(--purple)' : 'var(--purple-line)' }} />
                </div>
                <span style={{ fontSize: 11.5, fontWeight: b.hot ? 800 : 600, color: b.hot ? 'var(--purple-ink)' : 'var(--muted)' }}>{b.d}</span>
              </div>
            ))}
          </div>
        </div>

        {/* metrics */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 12 }}>
          <Metric label="Índice de impulso" value="Alto" tone="var(--orange)" sub="+18% vs. mês passado" />
          <Metric label="Horário de pico" value="21h–23h" tone="var(--purple)" sub="Sáb e Dom" />
        </div>

        {/* tip */}
        <div style={{ background: 'var(--purple-wash)', border: '1px solid var(--purple-line)', borderRadius: 18, padding: 16, marginTop: 12, display: 'flex', gap: 12 }}>
          <Icon name="sparkle" size={20} stroke="var(--purple)" style={{ flexShrink: 0, marginTop: 1 }} />
          <div>
            <div style={{ fontSize: 14.5, fontWeight: 800, color: 'var(--purple-ink)' }}>Dica para esta semana</div>
            <div style={{ fontSize: 13.5, color: 'var(--ink-2)', marginTop: 3, lineHeight: 1.45 }}>
              Defina um limite de <b style={{ color: 'var(--ink)' }}>R$ 80/dia</b> para sábado e domingo. Você economizaria cerca de R$ 240 por mês.
            </div>
          </div>
        </div>

        <button className="press" onClick={onClose} style={{ width: '100%', height: 54, borderRadius: 17, marginTop: 18,
          background: 'var(--purple)', color: '#fff', fontSize: 16, fontWeight: 800, boxShadow: '0 8px 20px rgba(124,92,252,.3)' }}>
          Definir limite diário
        </button>
      </div>
    </div>
  );
}
function Metric({ label, value, tone, sub }) {
  return (
    <div style={{ background: 'var(--card)', borderRadius: 18, padding: '14px 16px', boxShadow: '0 1px 2px rgba(20,30,40,.04)' }}>
      <div style={{ fontSize: 12.5, color: 'var(--ink-2)', fontWeight: 600 }}>{label}</div>
      <div style={{ fontSize: 20, fontWeight: 800, color: tone, marginTop: 4, letterSpacing: -.3 }}>{value}</div>
      <div style={{ fontSize: 11.5, color: 'var(--muted)', marginTop: 2 }}>{sub}</div>
    </div>
  );
}
window.InsightSheet = InsightSheet;
