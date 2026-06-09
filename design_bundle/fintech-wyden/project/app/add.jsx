// add.jsx — "Adicionar" (new transaction) flow.

const { useState: useStateAdd } = React;

function Segmented({ type, setType }) {
  const opts = [
    { id: 'despesa', label: 'Despesa', color: 'var(--orange)' },
    { id: 'receita', label: 'Receita', color: 'var(--green-ink)' },
  ];
  return (
    <div style={{ display: 'flex', background: 'var(--seg-bg)', borderRadius: 14, padding: 4, gap: 4 }}>
      {opts.map(o => {
        const active = type === o.id;
        return (
          <button key={o.id} className="press" onClick={() => setType(o.id)} style={{
            flex: 1, height: 42, borderRadius: 11, fontWeight: 800, fontSize: 15,
            color: active ? o.color : 'var(--ink-2)',
            background: active ? 'var(--card)' : 'transparent',
            boxShadow: active ? '0 2px 8px rgba(20,30,40,.10)' : 'none',
            transition: 'all .18s ease',
          }}>{o.label}</button>
        );
      })}
    </div>
  );
}

function Keypad({ onKey }) {
  const keys = ['1','2','3','4','5','6','7','8','9',',','0','del'];
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 6, rowGap: 2 }}>
      {keys.map(k => (
        <button key={k} className="key" onClick={() => onKey(k)}>
          {k === 'del'
            ? <Icon name="chevron-left" size={24} stroke="var(--ink)" sw={2.2} />
            : <span>{k}</span>}
        </button>
      ))}
    </div>
  );
}

function ChipRow({ items, selected, onSelect }) {
  return (
    <div className="hscroll" style={{ display: 'flex', gap: 10, overflowX: 'auto', padding: '2px 0 4px', margin: '0 -16px', paddingLeft: 16, paddingRight: 16 }}>
      {items.map(c => {
        const active = selected === c.id;
        return (
          <button key={c.id} className="press" onClick={() => onSelect(c.id)} style={{
            flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 7, width: 68,
          }}>
            <span style={{
              width: 54, height: 54, borderRadius: 18, display: 'grid', placeItems: 'center',
              background: active ? c.color : c.color + '1A',
              boxShadow: active ? `0 6px 16px ${c.color}55` : 'none',
              transition: 'all .16s ease', transform: active ? 'translateY(-1px)' : 'none',
            }}>
              <Icon name={c.icon} size={24} stroke={active ? '#fff' : c.color} sw={1.9} />
            </span>
            <span style={{ fontSize: 11.5, fontWeight: active ? 800 : 600, color: active ? 'var(--ink)' : 'var(--ink-2)', textAlign: 'center', lineHeight: 1.1 }}>{c.label}</span>
          </button>
        );
      })}
    </div>
  );
}

function BankRow({ selected, onSelect }) {
  return (
    <div className="hscroll" style={{ display: 'flex', gap: 9, overflowX: 'auto', margin: '0 -16px', padding: '2px 16px 4px' }}>
      {BANKS.map(b => {
        const active = selected === b.id;
        return (
          <button key={b.id} className="press" onClick={() => onSelect(b.id)} style={{
            flexShrink: 0, display: 'flex', alignItems: 'center', gap: 8, height: 44, padding: '0 14px 0 8px',
            borderRadius: 13, background: 'var(--card)',
            border: active ? '2px solid var(--ink)' : '2px solid var(--line)',
            transition: 'border-color .15s ease',
          }}>
            <span style={{ width: 30, height: 30, borderRadius: 9, background: b.color, color: b.ink || '#fff',
              display: 'grid', placeItems: 'center', fontSize: 12.5, fontWeight: 800, flexShrink: 0 }}>{b.short}</span>
            <span style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--ink)', whiteSpace: 'nowrap' }}>{b.label}</span>
          </button>
        );
      })}
    </div>
  );
}

function AddScreen({ onClose, onSave }) {
  const [type, setType] = useStateAdd('despesa');
  const [cents, setCents] = useStateAdd(0);
  const [cat, setCat] = useStateAdd(null);
  const [bank, setBank] = useStateAdd('nubank');
  const [desc, setDesc] = useStateAdd('');
  const [saved, setSaved] = useStateAdd(false);

  const income = type === 'receita';
  const cats = income ? INCOME_CATS : CATS;
  const accent = income ? 'var(--green-ink)' : 'var(--orange)';
  const valid = cents > 0 && cat;

  const handleKey = (k) => {
    setCents(prev => {
      if (k === 'del') return Math.floor(prev / 10);
      if (k === ',') return prev; // decimal handled implicitly by cents model
      const next = prev * 10 + Number(k);
      return next > 99999999 ? prev : next;
    });
  };
  const switchType = (t) => { setType(t); setCat(null); };

  const save = () => {
    setSaved(true);
    onSave({ type, value: cents / 100 });
    setTimeout(onClose, 1150);
  };

  const { int, dec } = brlParts(cents / 100);

  return (
    <div className="add-sheet" style={{
      position: 'absolute', inset: 0, zIndex: 80, background: 'var(--bg)',
      display: 'flex', flexDirection: 'column',
    }}>
      {/* header */}
      <div style={{ paddingTop: 60, paddingBottom: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '60px 16px 8px' }}>
        <button className="press" onClick={onClose} style={{ width: 40, height: 40, borderRadius: 13, background: 'var(--card)', boxShadow: '0 2px 8px rgba(20,30,40,.07)', display: 'grid', placeItems: 'center' }}>
          <Icon name="close" size={20} stroke="var(--ink)" sw={2.1} />
        </button>
        <span style={{ fontSize: 16, fontWeight: 800, color: 'var(--ink)' }}>Nova transação</span>
        <div style={{ width: 40 }} />
      </div>

      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '6px 16px 0' }}>
          <Segmented type={type} setType={switchType} />
        </div>

        {/* amount */}
        <div style={{ textAlign: 'center', padding: '22px 16px 14px' }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink-2)', letterSpacing: .3 }}>
            {income ? 'VALOR RECEBIDO' : 'VALOR GASTO'}
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'center', gap: 4, marginTop: 8, color: cents ? accent : 'var(--muted)' }}>
            <span style={{ fontSize: 22, fontWeight: 700, marginTop: 10 }}>R$</span>
            <span style={{ fontSize: 52, fontWeight: 800, letterSpacing: -1.6, lineHeight: 1 }}>
              {int}<span style={{ fontSize: 30 }}>,{dec}</span>
            </span>
          </div>
        </div>

        {/* category */}
        <div style={{ padding: '6px 16px 0' }}>
          <div style={{ fontSize: 13.5, fontWeight: 800, color: 'var(--ink)', marginBottom: 10 }}>Categoria</div>
        </div>
        <ChipRow items={cats} selected={cat} onSelect={setCat} />

        {/* bank */}
        <div style={{ padding: '14px 16px 0' }}>
          <div style={{ fontSize: 13.5, fontWeight: 800, color: 'var(--ink)', marginBottom: 10 }}>Conta / Banco</div>
        </div>
        <BankRow selected={bank} onSelect={setBank} />

        {/* details */}
        <div style={{ padding: '16px 16px 0', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'var(--card)', borderRadius: 14, padding: '13px 14px', boxShadow: '0 1px 2px rgba(20,30,40,.04)' }}>
            <Icon name="calendar" size={20} stroke="var(--ink-2)" sw={1.8} />
            <span style={{ flex: 1, fontSize: 14.5, fontWeight: 600, color: 'var(--ink)' }}>Hoje, 8 jun 2026</span>
            <Icon name="chevron-right" size={18} stroke="var(--muted)" sw={2} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'var(--card)', borderRadius: 14, padding: '13px 14px', boxShadow: '0 1px 2px rgba(20,30,40,.04)' }}>
            <Icon name="pencil" size={20} stroke="var(--ink-2)" sw={1.8} />
            <input value={desc} onChange={e => setDesc(e.target.value)} placeholder="Adicionar descrição"
              style={{ flex: 1, border: 'none', outline: 'none', background: 'transparent', fontSize: 14.5, fontWeight: 600, color: 'var(--ink)', fontFamily: 'inherit' }} />
          </div>
        </div>

        {/* keypad */}
        <div style={{ padding: '18px 28px 8px', marginTop: 'auto' }}>
          <Keypad onKey={handleKey} />
        </div>
      </div>

      {/* save */}
      <div style={{ padding: '8px 16px 30px', background: 'var(--bg)' }}>
        <button className="press" disabled={!valid} onClick={save} style={{
          width: '100%', height: 56, borderRadius: 18, fontSize: 16.5, fontWeight: 800, color: '#fff',
          background: valid ? (income ? 'var(--green)' : 'var(--ink)') : 'var(--line)',
          boxShadow: valid ? '0 8px 20px rgba(20,30,40,.16)' : 'none',
          transition: 'all .2s ease', cursor: valid ? 'pointer' : 'default',
        }}>
          {income ? 'Adicionar receita' : 'Adicionar despesa'}
        </button>
      </div>

      {/* success */}
      {saved && (
        <div className="success-pop" style={{ position: 'absolute', inset: 0, zIndex: 90, background: 'rgba(255,255,255,.86)',
          backdropFilter: 'blur(6px)', display: 'grid', placeItems: 'center' }}>
          <div style={{ textAlign: 'center' }}>
            <div className="success-ring" style={{ width: 84, height: 84, borderRadius: 999, margin: '0 auto',
              background: income ? 'var(--green)' : 'var(--ink)', display: 'grid', placeItems: 'center',
              boxShadow: '0 12px 30px rgba(20,30,40,.22)' }}>
              <Icon name="check" size={42} stroke="#fff" sw={2.6} />
            </div>
            <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--ink)', marginTop: 18 }}>
              {income ? 'Receita adicionada!' : 'Despesa registrada!'}
            </div>
            <div style={{ fontSize: 14, color: 'var(--ink-2)', marginTop: 4 }}>{brl(cents/100)}</div>
          </div>
        </div>
      )}
    </div>
  );
}

window.AddScreen = AddScreen;
