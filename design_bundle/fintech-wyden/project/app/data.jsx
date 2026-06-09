// data.jsx — domain data, formatting helpers, and small chart generators.

// ── Currency ───────────────────────────────────────────────
function brl(n, { sign = false } = {}) {
  const v = Math.abs(n).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const s = sign ? (n < 0 ? '− ' : '+ ') : '';
  return `${s}R$ ${v}`;
}
// split reais / centavos for the big balance display
function brlParts(n) {
  const [int, dec] = Math.abs(n).toLocaleString('pt-BR', { minimumFractionDigits: 2 }).split(',');
  return { int, dec };
}

// ── Categories ─────────────────────────────────────────────
const CATS = [
  { id: 'compras',     label: 'Compras',     icon: 'bag',    color: '#22B07D' },
  { id: 'alimentacao', label: 'Alimentação', icon: 'food',   color: '#F4762B' },
  { id: 'delivery',    label: 'Delivery',    icon: 'repeat', color: '#FB6F92' },
  { id: 'transporte',  label: 'Transporte',  icon: 'car',    color: '#8B5CF6' },
  { id: 'casa',        label: 'Casa',        icon: 'home',   color: '#3B82F6' },
  { id: 'saude',       label: 'Saúde',       icon: 'health', color: '#EF5DA8' },
  { id: 'educacao',    label: 'Educação',    icon: 'book',   color: '#0EA5A0' },
  { id: 'lazer',       label: 'Lazer',       icon: 'ticket', color: '#F5BE3F' },
  { id: 'assinaturas', label: 'Assinaturas', icon: 'repeat', color: '#6366F1' },
  { id: 'outros',      label: 'Outros',      icon: 'dots',   color: '#AEB4BB' },
];
const INCOME_CATS = [
  { id: 'salario',   label: 'Salário',     icon: 'wallet', color: '#17A06A' },
  { id: 'freelance', label: 'Freelance',   icon: 'pencil', color: '#0EA5A0' },
  { id: 'rendiment', label: 'Rendimentos', icon: 'trend',  color: '#3B82F6' },
  { id: 'reembolso', label: 'Reembolso',   icon: 'repeat', color: '#8B5CF6' },
  { id: 'outros',    label: 'Outros',      icon: 'dots',   color: '#AEB4BB' },
];
const catById = (id) => CATS.find(c => c.id === id) || INCOME_CATS.find(c => c.id === id) || CATS[CATS.length-1];

// ── Banks (generic, colored tiles — not brand logos) ───────
const BANKS = [
  { id: 'nubank',  label: 'Nubank',          color: '#8A05BE', short: 'Nu' },
  { id: 'bb',      label: 'Banco do Brasil', color: '#F4C400', short: 'BB', ink: '#1B1D21' },
  { id: 'caixa',   label: 'Caixa',           color: '#1A6CC4', short: 'CX' },
  { id: 'itau',    label: 'Itaú',            color: '#EC7000', short: 'It' },
  { id: 'inter',   label: 'Inter',           color: '#FF6B00', short: 'In' },
  { id: 'dinheiro',label: 'Dinheiro',        color: '#17A06A', short: '$',  cash: true },
];
const bankById = (id) => BANKS.find(b => b.id === id) || BANKS[0];

// ── Dashboard seed data ────────────────────────────────────
const SPEND = [
  { cat: 'compras',     value: 712.40, pct: 37 },
  { cat: 'alimentacao', value: 459.30, pct: 24 },
  { cat: 'transporte',  value: 312.10, pct: 16 },
  { cat: 'casa',        value: 216.00, pct: 11 },
  { cat: 'lazer',       value: 132.00, pct: 7  },
  { cat: 'outros',      value: 68.00,  pct: 5  },
];

const TRANSACTIONS = [
  { id: 't1', cat: 'delivery',    bank: 'nubank', desc: 'iFood — almoço',        value: -42.90, when: 'Hoje, 13:20',    flag: 'impulso' },
  { id: 't2', cat: 'transporte',  bank: 'nubank', desc: 'Uber',                  value: -18.50, when: 'Hoje, 09:05' },
  { id: 't3', cat: 'compras',     bank: 'itau',   desc: 'Shopee',                value: -129.90,when: 'Ontem, 22:48',   flag: 'impulso' },
  { id: 't4', cat: 'salario',     bank: 'bb',     desc: 'Salário',               value: 6250.00,when: 'Ontem, 08:00' },
  { id: 't5', cat: 'alimentacao', bank: 'inter',  desc: 'Supermercado Pão',      value: -184.30,when: '06 jun' },
  { id: 't6', cat: 'assinaturas', bank: 'nubank', desc: 'Streaming',             value: -39.90, when: '05 jun' },
];

// ── Sparkline path (financial evolution) ───────────────────
// returns { line, area } path strings for a w×h box given values 0..1
function sparkPaths(vals, w, h, pad = 2) {
  const n = vals.length;
  const x = i => pad + (i / (n - 1)) * (w - pad * 2);
  const y = v => h - pad - v * (h - pad * 2);
  let d = `M ${x(0)} ${y(vals[0])}`;
  for (let i = 1; i < n; i++) {
    const xc = (x(i - 1) + x(i)) / 2;
    d += ` C ${xc} ${y(vals[i-1])} ${xc} ${y(vals[i])} ${x(i)} ${y(vals[i])}`;
  }
  const area = `${d} L ${x(n-1)} ${h} L ${x(0)} ${h} Z`;
  return { line: d, area, lastX: x(n-1), lastY: y(vals[n-1]) };
}
const EVOLUTION = [0.30,0.36,0.30,0.42,0.55,0.50,0.62,0.58,0.66,0.60,0.72,0.78,0.74,0.88];

// ── Transactions grouped by day (Transações screen) ────────
const TX_GROUPS = [
  { label: 'Hoje', items: [
    { cat: 'delivery',    bank: 'nubank', desc: 'iFood — almoço',    value: -42.90,  time: '13:20', flag: 'impulso' },
    { cat: 'transporte',  bank: 'nubank', desc: 'Uber',              value: -18.50,  time: '09:05' },
  ]},
  { label: 'Ontem', items: [
    { cat: 'compras',     bank: 'itau',   desc: 'Shopee',            value: -129.90, time: '22:48', flag: 'impulso' },
    { cat: 'salario',     bank: 'bb',     desc: 'Salário',           value: 6250.00, time: '08:00' },
    { cat: 'alimentacao', bank: 'inter',  desc: 'Padaria do Zé',     value: -23.40,  time: '07:30' },
  ]},
  { label: 'Sex, 06 jun', items: [
    { cat: 'alimentacao', bank: 'inter',  desc: 'Supermercado Pão',  value: -184.30, time: '19:12' },
    { cat: 'assinaturas', bank: 'nubank', desc: 'Streaming',         value: -39.90,  time: '12:00' },
    { cat: 'transporte',  bank: 'nubank', desc: 'Posto Shell',       value: -150.00, time: '10:20' },
  ]},
  { label: 'Qui, 05 jun', items: [
    { cat: 'lazer',       bank: 'itau',   desc: 'Cinema',            value: -64.00,  time: '21:00', flag: 'impulso' },
    { cat: 'casa',        bank: 'caixa',  desc: 'Conta de luz',      value: -132.00, time: '14:00' },
    { cat: 'rendiment',   bank: 'inter',  desc: 'Rendimento CDB',    value: 38.20,   time: '00:01' },
  ]},
];

// ── Monthly comparison (Relatórios) ────────────────────────
const MONTHS = [
  { m: 'Jan', rec: 5800.00, desp: 2100.00 },
  { m: 'Fev', rec: 6000.00, desp: 2450.00 },
  { m: 'Mar', rec: 5900.00, desp: 1980.00 },
  { m: 'Abr', rec: 6100.00, desp: 2300.00 },
  { m: 'Mai', rec: 6250.00, desp: 2520.00 },
  { m: 'Jun', rec: 6250.00, desp: 1899.80 },
];
const BY_BANK = [
  { bank: 'nubank', value: 842.30 },
  { bank: 'itau',   value: 451.90 },
  { bank: 'inter',  value: 374.20 },
  { bank: 'caixa',  value: 132.00 },
  { bank: 'bb',     value: 99.40  },
];

// ── Donut segments ─────────────────────────────────────────
// returns array of { d, color } arc path strings for given pct slices
function donutSegments(slices, cx, cy, r, thick, gap = 3) {
  const seg = [];
  let a = -90; // start at top
  const total = slices.reduce((s, x) => s + x.pct, 0);
  slices.forEach(s => {
    const sweep = (s.pct / total) * 360;
    const a0 = a + gap / 2, a1 = a + sweep - gap / 2;
    const rad = d => (d * Math.PI) / 180;
    const x0 = cx + r * Math.cos(rad(a0)), y0 = cy + r * Math.sin(rad(a0));
    const x1 = cx + r * Math.cos(rad(a1)), y1 = cy + r * Math.sin(rad(a1));
    const large = a1 - a0 > 180 ? 1 : 0;
    seg.push({ d: `M ${x0} ${y0} A ${r} ${r} 0 ${large} 1 ${x1} ${y1}`, color: s.color, thick });
    a += sweep;
  });
  return seg;
}

Object.assign(window, {
  brl, brlParts, CATS, INCOME_CATS, catById, BANKS, bankById,
  SPEND, TRANSACTIONS, sparkPaths, EVOLUTION, donutSegments,
  TX_GROUPS, MONTHS, BY_BANK,
});
