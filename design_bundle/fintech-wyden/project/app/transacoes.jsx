// transacoes.jsx — Transações screen: filterable, grouped-by-day list.

const { useState: useStateTx } = React;

function MonthNav() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, padding: '2px 0 4px' }}>
      <button className="press" style={{ width: 30, height: 30, borderRadius: 10, background: 'var(--card)', display: 'grid', placeItems: 'center', boxShadow: '0 1px 3px rgba(20,30,40,.07)' }}>
        <Icon name="chevron-left" size={18} stroke="var(--ink-2)" sw={2.2} />
      </button>
      <span style={{ fontSize: 15.5, fontWeight: 800, color: 'var(--ink)', minWidth: 110, textAlign: 'center' }}>Junho 2026</span>
      <button className="press" style={{ width: 30, height: 30, borderRadius: 10, background: 'var(--card)', display: 'grid', placeItems: 'center', boxShadow: '0 1px 3px rgba(20,30,40,.07)' }}>
        <Icon name="chevron-right" size={18} stroke="var(--ink-2)" sw={2.2} />
      </button>
    </div>
  );
}

function MiniSummary() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
      <div style={{ background: 'var(--green-wash)', borderRadius: 18, padding: '14px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, color: 'var(--green-ink)', fontSize: 13, fontWeight: 700 }}>
          <span style={{ width: 22, height: 22, borderRadius: 7, background: 'var(--green)', display: 'grid', placeItems: 'center' }}>
            <Icon name="arrow-up-right" size={13} stroke="#fff" sw={2.4} />
          </span>
          Entradas
        </div>
        <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--ink)', marginTop: 8, letterSpacing: -.4 }}>R$ 6.288,20</div>
      </div>
      <div style={{ background: 'var(--orange-wash)', borderRadius: 18, padding: '14px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, color: 'var(--orange)', fontSize: 13, fontWeight: 700 }}>
          <span style={{ width: 22, height: 22, borderRadius: 7, background: 'var(--orange)', display: 'grid', placeItems: 'center' }}>
            <Icon name="arrow-down" size={13} stroke="#fff" sw={2.4} />
          </span>
          Saídas
        </div>
        <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--ink)', marginTop: 8, letterSpacing: -.4 }}>R$ 784,90</div>
      </div>
    </div>
  );
}

function FilterChips({ value, onChange }) {
  const opts = [
    { id: 'todas', label: 'Todas' },
    { id: 'receita', label: 'Receitas' },
    { id: 'despesa', label: 'Despesas' },
    { id: 'impulso', label: 'Impulso' },
  ];
  return (
    <div className="hscroll" style={{ display: 'flex', gap: 8, overflowX: 'auto', margin: '0 -16px', padding: '0 16px' }}>
      {opts.map(o => {
        const active = value === o.id;
        const isImp = o.id === 'impulso';
        return (
          <button key={o.id} className="press" onClick={() => onChange(o.id)} style={{
            flexShrink: 0, height: 36, padding: '0 16px', borderRadius: 999, fontSize: 13.5, fontWeight: 700,
            background: active ? (isImp ? 'var(--purple)' : 'var(--ink)') : 'var(--card)',
            color: active ? '#fff' : 'var(--ink-2)',
            border: active ? 'none' : '1px solid var(--line)',
            boxShadow: active ? '0 4px 12px rgba(20,30,40,.14)' : 'none', transition: 'all .15s ease',
          }}>{o.label}</button>
        );
      })}
    </div>
  );
}

function TxRow({ t, last }) {
  const c = catById(t.cat), b = bankById(t.bank), income = t.value > 0;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 18px',
      borderTop: last ? 'none' : 'none' }}>
      <span style={{ width: 42, height: 42, borderRadius: 13, background: c.color + '1F', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
        <Icon name={c.icon} size={21} stroke={c.color} sw={1.9} />
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 14.5, fontWeight: 700, color: 'var(--ink)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.desc}</span>
          {t.flag === 'impulso' && (
            <span style={{ fontSize: 10, fontWeight: 800, color: 'var(--purple)', background: 'var(--purple-chip)', padding: '2px 7px', borderRadius: 999, flexShrink: 0 }}>impulso</span>
          )}
        </div>
        <div style={{ fontSize: 12.5, color: 'var(--muted)', marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {c.label}
          <span style={{ margin: '0 6px', verticalAlign: 'middle', display: 'inline-block', width: 3, height: 3, borderRadius: 3, background: 'var(--muted)' }} />
          <span style={{ display: 'inline-block', width: 11, height: 11, borderRadius: 4, background: b.color, verticalAlign: '-1px', marginRight: 4 }} />
          {b.label}
          <span style={{ margin: '0 6px', verticalAlign: 'middle', display: 'inline-block', width: 3, height: 3, borderRadius: 3, background: 'var(--muted)' }} />
          {t.time}
        </div>
      </div>
      <span style={{ fontSize: 15, fontWeight: 800, color: income ? 'var(--green-ink)' : 'var(--ink)', whiteSpace: 'nowrap' }}>
        {brl(t.value, { sign: true })}
      </span>
    </div>
  );
}

function TransacoesScreen() {
  const [filter, setFilter] = useStateTx('todas');

  const groups = TX_GROUPS.map(g => {
    const items = g.items.filter(t => {
      if (filter === 'todas') return true;
      if (filter === 'receita') return t.value > 0;
      if (filter === 'despesa') return t.value < 0;
      if (filter === 'impulso') return t.flag === 'impulso';
      return true;
    });
    return { ...g, items };
  }).filter(g => g.items.length);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, padding: '4px 16px 16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 2px' }}>
        <div style={{ fontSize: 26, fontWeight: 800, letterSpacing: -.6, color: 'var(--ink)' }}>Transações</div>
        <button className="press" style={{ width: 44, height: 44, borderRadius: 14, background: 'var(--card)', display: 'grid', placeItems: 'center', boxShadow: '0 2px 10px rgba(20,30,40,.08)' }}>
          <Icon name="calendar" size={21} stroke="var(--ink)" sw={1.8} />
        </button>
      </div>

      <MonthNav />
      <MiniSummary />
      <FilterChips value={filter} onChange={setFilter} />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {groups.map(g => {
          const net = g.items.reduce((s, t) => s + t.value, 0);
          return (
            <div key={g.label}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 6px 8px' }}>
                <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--ink-2)', textTransform: 'uppercase', letterSpacing: .3 }}>{g.label}</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: net >= 0 ? 'var(--green-ink)' : 'var(--ink-2)' }}>{brl(net, { sign: true })}</span>
              </div>
              <div style={{ background: 'var(--card)', borderRadius: 'var(--r-card)', boxShadow: '0 1px 2px rgba(20,30,40,.04), 0 6px 20px rgba(20,30,40,.05)', overflow: 'hidden' }}>
                {g.items.map((t, i) => (
                  <div key={i} style={{ borderTop: i ? '1px solid var(--line)' : 'none' }}>
                    <TxRow t={t} last={i === g.items.length - 1} />
                  </div>
                ))}
              </div>
            </div>
          );
        })}
        {!groups.length && (
          <div style={{ textAlign: 'center', color: 'var(--muted)', fontSize: 14, padding: '30px 0' }}>Nenhuma transação neste filtro.</div>
        )}
      </div>
    </div>
  );
}

window.TransacoesScreen = TransacoesScreen;
