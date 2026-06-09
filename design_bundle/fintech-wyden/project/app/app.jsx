// app.jsx — shell: tab bar + FAB, navigation, financial state, tweaks.

const { useState, useEffect } = React;

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "insight": "Ilustrado",
  "accent": "#17A06A",
  "radius": 22
}/*EDITMODE-END*/;

// ── Bottom tab bar with elevated center FAB ────────────────
function TabBar({ tab, setTab, onAdd }) {
  const tabs = [
    { id: 'inicio',    label: 'Início',     icon: 'nav-home' },
    { id: 'transacoes',label: 'Transações', icon: 'nav-swap' },
    { id: 'add',       label: 'Adicionar',  icon: 'plus', fab: true },
    { id: 'relatorios',label: 'Relatórios', icon: 'nav-chart' },
    { id: 'perfil',    label: 'Perfil',     icon: 'nav-user' },
  ];
  return (
    <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, zIndex: 40,
      background: 'var(--card)', borderTop: '1px solid var(--line)',
      boxShadow: '0 -6px 24px rgba(20,30,40,.06)', paddingBottom: 22 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-around', padding: '10px 8px 4px' }}>
        {tabs.map(t => {
          if (t.fab) {
            return (
              <button key={t.id} className="press fab" onClick={onAdd} style={{
                width: 58, height: 58, borderRadius: 20, background: 'var(--green)', marginTop: -24,
                display: 'grid', placeItems: 'center', boxShadow: '0 10px 22px rgba(20,30,40,.22), 0 2px 6px var(--green)',
                border: '4px solid var(--card)' }}>
                <Icon name="plus" size={28} stroke="#fff" sw={2.6} />
              </button>
            );
          }
          const active = tab === t.id;
          return (
            <button key={t.id} className="press" onClick={() => setTab(t.id)} style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, width: 60, paddingTop: 2 }}>
              <Icon name={t.icon} size={24} stroke={active ? 'var(--green)' : 'var(--muted)'} sw={active ? 2.1 : 1.8} />
              <span style={{ fontSize: 11, fontWeight: active ? 800 : 600, color: active ? 'var(--green)' : 'var(--muted)' }}>{t.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function Placeholder({ icon, title }) {
  return (
    <div style={{ height: '100%', display: 'grid', placeItems: 'center', textAlign: 'center', padding: 40 }}>
      <div>
        <div style={{ width: 88, height: 88, borderRadius: 28, background: 'var(--card)', display: 'grid', placeItems: 'center',
          margin: '0 auto', boxShadow: '0 8px 24px rgba(20,30,40,.07)' }}>
          <Icon name={icon} size={40} stroke="var(--muted)" sw={1.7} />
        </div>
        <div style={{ fontSize: 19, fontWeight: 800, color: 'var(--ink)', marginTop: 20 }}>{title}</div>
        <div style={{ fontSize: 14, color: 'var(--ink-2)', marginTop: 6, maxWidth: 240, lineHeight: 1.45 }}>
          Esta seção faz parte do produto completo. Neste protótipo, foque no <b style={{ color: 'var(--green-ink)' }}>Início</b> e no <b style={{ color: 'var(--green-ink)' }}>Adicionar</b>.
        </div>
      </div>
    </div>
  );
}

function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const [tab, setTab] = useState('inicio');
  const [addOpen, setAddOpen] = useState(false);
  const [insightOpen, setInsightOpen] = useState(false);
  const [s, setS] = useState({ receitas: 6250.00, despesas: 1899.80, saldo: 4350.20 });
  const [pulse, setPulse] = useState(0);

  const onSave = ({ type, value }) => {
    setS(prev => {
      const receitas = type === 'receita' ? prev.receitas + value : prev.receitas;
      const despesas = type === 'despesa' ? prev.despesas + value : prev.despesas;
      return { receitas, despesas, saldo: receitas - despesas };
    });
    setPulse(p => p + 1);
  };

  // accent-derived CSS vars
  const rootVars = {
    '--green': t.accent,
    '--green-ink': t.accent,
    '--green-wash': t.accent + '14',
    '--green-wash2': t.accent + '20',
    '--r-card': t.radius + 'px',
  };

  const screen = tab === 'inicio'
    ? <HomeScreen s={s} tweaks={t} onOpenInsight={() => setInsightOpen(true)} onNav={setTab} />
    : tab === 'transacoes' ? <TransacoesScreen />
    : tab === 'relatorios' ? <RelatoriosScreen onOpenInsight={() => setInsightOpen(true)} />
    : <Placeholder icon="nav-user" title="Perfil" />;

  return (
    <div style={{ height: '100%', position: 'relative', background: 'var(--bg)', ...rootVars }}>
      {/* scroll area */}
      <div key={pulse + tab} className="scroll-area" style={{ position: 'absolute', inset: 0, overflowY: 'auto',
        paddingTop: 56, paddingBottom: 96, WebkitOverflowScrolling: 'touch' }}>
        {screen}
      </div>

      <TabBar tab={tab} setTab={setTab} onAdd={() => setAddOpen(true)} />

      {addOpen && <AddScreen onClose={() => setAddOpen(false)} onSave={onSave} />}
      <InsightSheet open={insightOpen} onClose={() => setInsightOpen(false)} />

      <TweaksPanel>
        <TweakSection label="Insight comportamental" />
        <TweakRadio label="Estilo do card" value={t.insight}
          options={['Ilustrado', 'Mínimo', 'Sólido']}
          onChange={(v) => setTweak('insight', v)} />
        <TweakSection label="Marca" />
        <TweakColor label="Cor de destaque" value={t.accent}
          options={['#17A06A', '#0E9E83', '#2F8F4E', '#1FA2A0']}
          onChange={(v) => setTweak('accent', v)} />
        <TweakSlider label="Arredondamento" value={t.radius} min={14} max={28} step={1} unit="px"
          onChange={(v) => setTweak('radius', v)} />
      </TweaksPanel>
    </div>
  );
}

window.App = App;
