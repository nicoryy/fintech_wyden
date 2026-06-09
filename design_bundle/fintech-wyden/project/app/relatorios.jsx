// relatorios.jsx — Relatórios screen: monthly comparison, category & bank breakdowns.

const { useState: useStateRep } = React;

function PeriodSeg({ value, onChange }) {
  const opts = ['Mês', 'Trimestre', 'Ano'];
  return (
    <div style={{ display: 'flex', background: 'var(--seg-bg)', borderRadius: 13, padding: 4, gap: 4 }}>
      {opts.map(o => {
        const active = value === o;
        return (
          <button key={o} className="press" onClick={() => onChange(o)} style={{
            flex: 1, height: 38, borderRadius: 10, fontSize: 13.5, fontWeight: 800,
            color: active ? 'var(--ink)' : 'var(--ink-2)',
            background: active ? 'var(--card)' : 'transparent',
            boxShadow: active ? '0 2px 8px rgba(20,30,40,.10)' : 'none', transition: 'all .16s ease',
          }}>{o}</button>
        );
      })}
    </div>
  );
}

// hero — economia
function EconomiaHero() {
  return (
    <div style={{ background: 'var(--green-wash)', borderRadius: 'var(--r-card)', padding: 20, position: 'relative', overflow: 'hidden' }}>
      <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--green-ink)' }}>Você economizou em junho</div>
      <div style={{ fontSize: 36, fontWeight: 800, color: 'var(--ink)', letterSpacing: -1.2, marginTop: 6 }}>R$ 4.350,20</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12 }}>
        <div style={{ flex: 1, height: 8, borderRadius: 8, background: '#ffffff', overflow: 'hidden' }}>
          <div style={{ width: '70%', height: '100%', borderRadius: 8, background: 'var(--green)' }} />
        </div>
        <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--green-ink)' }}>70%</span>
      </div>
      <div style={{ fontSize: 12.5, color: 'var(--ink-2)', marginTop: 8 }}>da sua renda foi guardada — seu melhor mês do ano.</div>
    </div>
  );
}

// monthly comparison bars
function MonthlyChart() {
  const max = Math.max(...MONTHS.map(m => m.rec));
  return (
    <div style={{ background: 'var(--card)', borderRadius: 'var(--r-card)', padding: 20, boxShadow: '0 1px 2px rgba(20,30,40,.04), 0 6px 20px rgba(20,30,40,.05)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 16, fontWeight: 800, color: 'var(--ink)', letterSpacing: -.3 }}>Comparativo mensal</span>
        <div style={{ display: 'flex', gap: 12 }}>
          <Legend color="var(--green)" label="Receitas" />
          <Legend color="var(--orange)" label="Despesas" />
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10, height: 132, marginTop: 18 }}>
        {MONTHS.map((m, i) => {
          const cur = i === MONTHS.length - 1;
          return (
            <div key={m.m} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
              <div style={{ width: '100%', height: 108, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: 3 }}>
                <div style={{ width: 8, height: (m.rec / max * 100) + '%', borderRadius: 4, background: 'var(--green)', opacity: cur ? 1 : .85 }} />
                <div style={{ width: 8, height: (m.desp / max * 100) + '%', borderRadius: 4, background: 'var(--orange)', opacity: cur ? 1 : .85 }} />
              </div>
              <span style={{ fontSize: 11.5, fontWeight: cur ? 800 : 600, color: cur ? 'var(--ink)' : 'var(--muted)' }}>{m.m}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
function Legend({ color, label }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11.5, fontWeight: 700, color: 'var(--ink-2)' }}>
      <span style={{ width: 9, height: 9, borderRadius: 3, background: color }} />{label}
    </span>
  );
}

// category breakdown — horizontal bars
function CategoryBars() {
  const max = Math.max(...SPEND.map(s => s.pct));
  return (
    <div style={{ background: 'var(--card)', borderRadius: 'var(--r-card)', padding: 20, boxShadow: '0 1px 2px rgba(20,30,40,.04), 0 6px 20px rgba(20,30,40,.05)' }}>
      <span style={{ fontSize: 16, fontWeight: 800, color: 'var(--ink)', letterSpacing: -.3 }}>Gastos por categoria</span>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 16 }}>
        {SPEND.map(x => {
          const c = catById(x.cat);
          return (
            <div key={x.cat}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 7 }}>
                <span style={{ width: 26, height: 26, borderRadius: 8, background: c.color + '1F', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                  <Icon name={c.icon} size={15} stroke={c.color} sw={2} />
                </span>
                <span style={{ flex: 1, fontSize: 13.5, fontWeight: 700, color: 'var(--ink)' }}>{c.label}</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink-2)' }}>{brl(x.value)}</span>
                <span style={{ fontSize: 12.5, fontWeight: 800, color: c.color, width: 34, textAlign: 'right' }}>{x.pct}%</span>
              </div>
              <div style={{ height: 8, borderRadius: 8, background: 'var(--seg-bg)', overflow: 'hidden' }}>
                <div style={{ width: (x.pct / max * 100) + '%', height: '100%', borderRadius: 8, background: c.color }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// by bank
function BankBreakdown() {
  const max = Math.max(...BY_BANK.map(b => b.value));
  return (
    <div style={{ background: 'var(--card)', borderRadius: 'var(--r-card)', padding: 20, boxShadow: '0 1px 2px rgba(20,30,40,.04), 0 6px 20px rgba(20,30,40,.05)' }}>
      <span style={{ fontSize: 16, fontWeight: 800, color: 'var(--ink)', letterSpacing: -.3 }}>Gastos por banco</span>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 16 }}>
        {BY_BANK.map(x => {
          const b = bankById(x.bank);
          return (
            <div key={x.bank} style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
              <span style={{ width: 34, height: 34, borderRadius: 10, background: b.color, color: b.ink || '#fff', display: 'grid', placeItems: 'center', fontSize: 13, fontWeight: 800, flexShrink: 0 }}>{b.short}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--ink)' }}>{b.label}</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink-2)' }}>{brl(x.value)}</span>
                </div>
                <div style={{ height: 7, borderRadius: 7, background: 'var(--seg-bg)', overflow: 'hidden' }}>
                  <div style={{ width: (x.value / max * 100) + '%', height: '100%', borderRadius: 7, background: b.color }} />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// behavioral comparative (purple — differentiator)
function BehaviorCompare({ onOpen }) {
  return (
    <button className="press" onClick={onOpen} style={{ textAlign: 'left', width: '100%' }}>
      <div style={{ background: 'var(--purple-wash)', border: '1px solid var(--purple-line)', borderRadius: 'var(--r-card)', padding: 18 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
          <span style={{ width: 32, height: 32, borderRadius: 10, background: 'var(--purple-chip)', display: 'grid', placeItems: 'center' }}>
            <Icon name="brain" size={19} stroke="var(--purple)" sw={1.7} />
          </span>
          <span style={{ fontSize: 14.5, fontWeight: 800, color: 'var(--purple-ink)' }}>Leitura comportamental</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 14 }}>
          <CompareStat label="Impulsividade" value="−12%" good />
          <CompareStat label="Consistência" value="+8%" good />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 14, color: 'var(--purple-ink)', fontWeight: 700, fontSize: 13.5 }}>
          Ver análise completa <Icon name="chevron-right" size={15} stroke="var(--purple-ink)" sw={2.4} />
        </div>
      </div>
    </button>
  );
}
function CompareStat({ label, value, good }) {
  return (
    <div style={{ background: 'var(--card)', borderRadius: 14, padding: '12px 14px' }}>
      <div style={{ fontSize: 12, color: 'var(--ink-2)', fontWeight: 600 }}>{label}</div>
      <div style={{ fontSize: 19, fontWeight: 800, color: good ? 'var(--green-ink)' : 'var(--orange)', marginTop: 3, letterSpacing: -.3 }}>{value}</div>
      <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 1 }}>vs. mês passado</div>
    </div>
  );
}

function RelatoriosScreen({ onOpenInsight }) {
  const [period, setPeriod] = useStateRep('Mês');
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14, padding: '4px 16px 16px' }}>
      <div style={{ fontSize: 26, fontWeight: 800, letterSpacing: -.6, color: 'var(--ink)', padding: '0 2px' }}>Relatórios</div>
      <PeriodSeg value={period} onChange={setPeriod} />
      <EconomiaHero />
      <MonthlyChart />
      <BehaviorCompare onOpen={onOpenInsight} />
      <CategoryBars />
      <BankBreakdown />
    </div>
  );
}

window.RelatoriosScreen = RelatoriosScreen;
