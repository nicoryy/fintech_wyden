// home.jsx — Dashboard / Início screen.

const { useMemo } = React;

// ── Section card shell ─────────────────────────────────────
function Card({ children, style = {}, pad = 20 }) {
  return (
    <div style={{
      background: 'var(--card)', borderRadius: 'var(--r-card)', padding: pad,
      boxShadow: '0 1px 2px rgba(20,30,40,.04), 0 6px 20px rgba(20,30,40,.05)',
      ...style,
    }}>{children}</div>
  );
}
function SeeAll({ onClick, label = 'Ver todas' }) {
  return (
    <button className="ghost-btn" onClick={onClick}
      style={{ color: 'var(--green)', fontWeight: 700, fontSize: 14 }}>{label}</button>
  );
}

// ── Header ─────────────────────────────────────────────────
function Header() {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', padding: '0 4px' }}>
      <div>
        <div style={{ fontSize: 27, fontWeight: 800, letterSpacing: -0.6, color: 'var(--ink)' }}>
          Olá, Ana! <span style={{ fontWeight: 400 }}>👋</span>
        </div>
        <div style={{ fontSize: 15, color: 'var(--ink-2)', marginTop: 4, lineHeight: 1.35, maxWidth: 230 }}>
          Que tal uma decisão financeira mais consciente hoje?
        </div>
      </div>
      <button className="press" style={{
        width: 48, height: 48, borderRadius: 16, background: 'var(--card)',
        boxShadow: '0 2px 10px rgba(20,30,40,.08)', display: 'grid', placeItems: 'center',
        position: 'relative', flexShrink: 0,
      }}>
        <Icon name="bell" size={22} stroke="var(--ink)" sw={1.7} />
        <span style={{ position: 'absolute', top: 12, right: 13, width: 8, height: 8,
          borderRadius: 4, background: 'var(--green)', border: '2px solid var(--card)' }} />
      </button>
    </div>
  );
}

// ── Balance card ───────────────────────────────────────────
function BalanceCard({ s }) {
  const { int, dec } = brlParts(s.saldo);
  const spark = useMemo(() => sparkPaths(EVOLUTION, 118, 62, 4), []);
  return (
    <Card pad={0} style={{ overflow: 'hidden' }}>
      <div style={{ padding: 20, background: 'var(--green-wash)', borderBottom: '1px solid var(--line)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, color: 'var(--ink)' }}>
          <span style={{ fontSize: 15, fontWeight: 600 }}>Situação financeira</span>
          <Icon name="info" size={16} stroke="var(--muted)" sw={1.7} />
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: 6, gap: 8 }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 36, fontWeight: 800, letterSpacing: -1.4, color: 'var(--ink)', lineHeight: 1.05, whiteSpace: 'nowrap' }}>
              R$ {int}<span style={{ fontSize: 23, fontWeight: 700 }}>,{dec}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 8, color: 'var(--green-ink)', fontWeight: 700, fontSize: 13.5, whiteSpace: 'nowrap' }}>
              <Icon name="arrow-up-right" size={15} stroke="var(--green-ink)" sw={2.2} />
              R$ 620,40 <span style={{ color: 'var(--ink-2)', fontWeight: 500 }}>vs. mês anterior</span>
            </div>
          </div>
          <svg width="118" height="62" viewBox="0 0 118 62" style={{ marginBottom: 2, flexShrink: 0 }}>
            <defs>
              <linearGradient id="sparkFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="var(--green)" stopOpacity="0.22" />
                <stop offset="1" stopColor="var(--green)" stopOpacity="0" />
              </linearGradient>
            </defs>
            <path d={spark.area} fill="url(#sparkFill)" />
            <path d={spark.line} fill="none" stroke="var(--green)" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx={spark.lastX} cy={spark.lastY} r="4.2" fill="var(--green)" stroke="var(--card)" strokeWidth="2" />
          </svg>
        </div>
      </div>
      {/* mini stats */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', padding: '14px 4px' }}>
        <Stat label="Receitas" value={s.receitas} tone="green" icon="arrow-up-right" />
        <Stat label="Despesas" value={s.despesas} tone="orange" icon="arrow-down" divider />
        <Stat label="Saldo"    value={s.saldo}    tone="green" icon="card" divider />
      </div>
    </Card>
  );
}
function Stat({ label, value, tone, icon, divider }) {
  const color = tone === 'orange' ? 'var(--orange)' : 'var(--green-ink)';
  const wash  = tone === 'orange' ? 'var(--orange-wash)' : 'var(--green-wash2)';
  return (
    <div style={{ padding: '4px 11px', borderLeft: divider ? '1px solid var(--line)' : 'none', minWidth: 0 }}>
      <div style={{ fontSize: 13, color: 'var(--ink-2)', fontWeight: 500 }}>{label}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 6 }}>
        <span style={{ fontSize: 13, fontWeight: 700, color, whiteSpace: 'nowrap', letterSpacing: -.2 }}>{brl(value)}</span>
        <span style={{ width: 21, height: 21, borderRadius: 7, background: wash, display: 'grid', placeItems: 'center', flexShrink: 0 }}>
          <Icon name={icon} size={13} stroke={color} sw={2.3} />
        </span>
      </div>
    </div>
  );
}

// ── Behavioral insight (the differentiator) ────────────────
function InsightCard({ style: variant, onOpen }) {
  // variant: 'Ilustrado' | 'Mínimo' | 'Sólido'
  if (variant === 'Sólido') {
    return (
      <button className="press" onClick={onOpen} style={{ textAlign: 'left', width: '100%' }}>
        <div style={{ background: 'var(--purple)', borderRadius: 'var(--r-card)', padding: 20, color: '#fff',
          boxShadow: '0 8px 24px rgba(124,92,252,.32)', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', right: -20, top: -20, opacity: .22 }}>
            <Icon name="brain" size={140} stroke="#fff" sw={1.1} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 700, letterSpacing: .2, opacity: .92 }}>
            <Icon name="sparkle" size={16} stroke="#fff" /> INSIGHT COMPORTAMENTAL
          </div>
          <div style={{ fontSize: 19, fontWeight: 800, marginTop: 10, lineHeight: 1.25, maxWidth: 240, letterSpacing: -.3 }}>
            Você gastou mais por impulso nos finais de semana.
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 16, fontWeight: 700, fontSize: 14 }}>
            Ver detalhes e dicas <Icon name="chevron-right" size={16} stroke="#fff" sw={2.4} />
          </div>
        </div>
      </button>
    );
  }
  const minimal = variant === 'Mínimo';
  return (
    <button className="press" onClick={onOpen} style={{ textAlign: 'left', width: '100%' }}>
      <div style={{ background: 'var(--purple-wash)', borderRadius: 'var(--r-card)', padding: 20,
        border: '1px solid var(--purple-line)', position: 'relative', overflow: 'hidden' }}>
        <div style={{ display: 'flex', gap: 14 }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
              <span style={{ width: 34, height: 34, borderRadius: 11, background: 'var(--purple-chip)', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                <Icon name="brain" size={20} stroke="var(--purple)" sw={1.7} />
              </span>
              <span style={{ fontSize: 15, fontWeight: 800, color: 'var(--purple-ink)', letterSpacing: -.2 }}>Insight comportamental</span>
            </div>
            <div style={{ fontSize: 16.5, fontWeight: 700, color: 'var(--ink)', marginTop: 12, lineHeight: 1.3, letterSpacing: -.2 }}>
              Você gastou mais por impulso nos finais de semana.
            </div>
            {!minimal && (
              <div style={{ fontSize: 14, color: 'var(--ink-2)', marginTop: 6, lineHeight: 1.4 }}>
                Tente definir um limite diário para esses dias.
              </div>
            )}
          </div>
          {!minimal && (
            <div style={{ width: 86, flexShrink: 0, display: 'grid', placeItems: 'center' }}>
              <div style={{ width: 78, height: 78, borderRadius: 22, background: 'var(--purple-chip)',
                display: 'grid', placeItems: 'center', position: 'relative' }}>
                <Icon name="brain" size={42} stroke="var(--purple)" sw={1.4} />
                <Icon name="sparkle" size={14} stroke="var(--purple)" style={{ position: 'absolute', top: 10, right: 12 }} />
                <Icon name="sparkle" size={9} stroke="var(--purple)" style={{ position: 'absolute', bottom: 14, left: 12 }} />
              </div>
            </div>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 14, color: 'var(--purple-ink)', fontWeight: 700, fontSize: 14 }}>
          Ver detalhes e dicas <Icon name="chevron-right" size={16} stroke="var(--purple-ink)" sw={2.4} />
        </div>
      </div>
    </button>
  );
}

// ── Spend by category ──────────────────────────────────────
function CategoryCard({ onSeeAll }) {
  const slices = SPEND.map(x => ({ pct: x.pct, color: catById(x.cat).color }));
  const seg = useMemo(() => donutSegments(slices, 54, 54, 40, 12, 4), []);
  const total = SPEND.reduce((s, x) => s + x.value, 0);
  return (
    <Card>
      <Row title="Gastos por categoria" onSeeAll={onSeeAll} />
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 14 }}>
        <div style={{ position: 'relative', width: 108, height: 108, flexShrink: 0 }}>
          <svg width="108" height="108" viewBox="0 0 108 108">
            {seg.map((g, i) => (
              <path key={i} d={g.d} stroke={g.color} strokeWidth={g.thick} fill="none" strokeLinecap="round" />
            ))}
          </svg>
          <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', textAlign: 'center' }}>
            <div>
              <div style={{ fontSize: 12.5, fontWeight: 800, color: 'var(--ink)', letterSpacing: -.4, whiteSpace: 'nowrap' }}>{brl(total)}</div>
              <div style={{ fontSize: 10.5, color: 'var(--muted)', marginTop: 0 }}>Total</div>
            </div>
          </div>
        </div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 11, minWidth: 0 }}>
          {SPEND.map(x => {
            const c = catById(x.cat);
            return (
              <div key={x.cat} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ width: 22, height: 22, borderRadius: 7, background: c.color, display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                  <Icon name={c.icon} size={13} stroke="#fff" sw={2} />
                </span>
                <span style={{ flex: 1, minWidth: 0, fontSize: 12, fontWeight: 600, color: 'var(--ink)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.label}</span>
                <span style={{ fontSize: 11, color: 'var(--ink-2)', fontWeight: 600, whiteSpace: 'nowrap', flexShrink: 0 }}>{brl(x.value)}</span>
                <span style={{ fontSize: 11, fontWeight: 800, color: c.color, width: 24, textAlign: 'right', flexShrink: 0 }}>{x.pct}%</span>
              </div>
            );
          })}
        </div>
      </div>
    </Card>
  );
}
function Row({ title, onSeeAll }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <span style={{ fontSize: 17, fontWeight: 800, color: 'var(--ink)', letterSpacing: -.3 }}>{title}</span>
      <SeeAll onClick={onSeeAll} />
    </div>
  );
}

// ── Goal ───────────────────────────────────────────────────
function GoalCard() {
  const pct = 60, R = 30, C = 2 * Math.PI * R;
  return (
    <Card>
      <Row title="Sua meta" />
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 16 }}>
        <div style={{ position: 'relative', width: 78, height: 78, flexShrink: 0 }}>
          <svg width="78" height="78" viewBox="0 0 78 78">
            <circle cx="39" cy="39" r={R} fill="none" stroke="var(--line)" strokeWidth="7" />
            <circle cx="39" cy="39" r={R} fill="none" stroke="var(--green)" strokeWidth="7" strokeLinecap="round"
              strokeDasharray={C} strokeDashoffset={C * (1 - pct/100)} transform="rotate(-90 39 39)" />
          </svg>
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17, fontWeight: 800, color: 'var(--ink)' }}><span>{pct}%</span></div>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 15.5, fontWeight: 800, color: 'var(--ink)', letterSpacing: -.2 }}>Reserva de emergência</div>
          <div style={{ fontSize: 14, marginTop: 3 }}>
            <span style={{ color: 'var(--green-ink)', fontWeight: 800 }}>R$ 3.000,00</span>
            <span style={{ color: 'var(--ink-2)' }}> de R$ 5.000,00</span>
          </div>
          <div style={{ height: 8, borderRadius: 8, background: 'var(--line)', marginTop: 10, overflow: 'hidden' }}>
            <div style={{ width: pct + '%', height: '100%', borderRadius: 8, background: 'var(--green)' }} />
          </div>
          <div style={{ fontSize: 12.5, color: 'var(--muted)', marginTop: 8 }}>Faltam R$ 2.000,00 para sua meta</div>
        </div>
      </div>
    </Card>
  );
}

// ── Recent transactions (compact) ──────────────────────────
function RecentCard({ onSeeAll }) {
  const items = TRANSACTIONS.slice(0, 4);
  return (
    <Card pad={0}>
      <div style={{ padding: '18px 20px 6px' }}><Row title="Atividade recente" onSeeAll={onSeeAll} /></div>
      <div>
        {items.map((t, i) => {
          const c = catById(t.cat), income = t.value > 0;
          return (
            <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 20px',
              borderTop: i === 0 ? '1px solid var(--line)' : 'none' }}>
              <span style={{ width: 38, height: 38, borderRadius: 12, background: c.color + '1F', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                <Icon name={c.icon} size={19} stroke={c.color} sw={1.9} />
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14.5, fontWeight: 700, color: 'var(--ink)', display: 'flex', alignItems: 'center', gap: 6 }}>
                  {t.desc}
                  {t.flag === 'impulso' && (
                    <span style={{ fontSize: 10.5, fontWeight: 800, color: 'var(--purple)', background: 'var(--purple-chip)',
                      padding: '2px 7px', borderRadius: 999, letterSpacing: .2 }}>impulso</span>
                  )}
                </div>
                <div style={{ fontSize: 12.5, color: 'var(--muted)', marginTop: 2 }}>{t.when}</div>
              </div>
              <span style={{ fontSize: 14.5, fontWeight: 800, color: income ? 'var(--green-ink)' : 'var(--ink)', whiteSpace: 'nowrap' }}>
                {brl(t.value, { sign: true })}
              </span>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

function HomeScreen({ s, tweaks, onOpenInsight, onNav }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, padding: '8px 16px 16px' }}>
      <Header />
      <BalanceCard s={s} />
      <InsightCard style={tweaks.insight} onOpen={onOpenInsight} />
      <CategoryCard onSeeAll={() => onNav && onNav('relatorios')} />
      <GoalCard />
      <RecentCard onSeeAll={() => onNav && onNav('transacoes')} />
    </div>
  );
}

Object.assign(window, { HomeScreen, Card });
