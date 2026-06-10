/**
 * Seed/mock data ported from the prototype `data.jsx`. These are the payloads
 * the React Query hooks resolve today (no backend yet). When the API is wired,
 * the hooks in `src/services/hooks.ts` swap `Promise.resolve(...)` for axios
 * calls; this file then becomes dev-only fixtures.
 */
import {
  GoalStatusEnum,
  InsightTypeEnum,
  type BankSpend,
  type Dashboard,
  type InsightDetail,
  type MonthPoint,
  type Reports,
  type SpendSlice,
  type Transaction,
  type TransactionGroup,
} from '../types';

/** Spend by category (dashboard donut + reports bars). */
export const SPEND: SpendSlice[] = [
  { categoryId: 'compras', value: 712.4, pct: 37 },
  { categoryId: 'alimentacao', value: 459.3, pct: 24 },
  { categoryId: 'transporte', value: 312.1, pct: 16 },
  { categoryId: 'casa', value: 216.0, pct: 11 },
  { categoryId: 'lazer', value: 132.0, pct: 7 },
  { categoryId: 'outros', value: 68.0, pct: 5 },
];

/** Recent activity (dashboard). */
export const TRANSACTIONS: Transaction[] = [
  { id: 't1', categoryId: 'delivery', bankId: 'nubank', description: 'iFood — almoço', amount: -42.9, when: 'Hoje, 13:20', isImpulse: true },
  { id: 't2', categoryId: 'transporte', bankId: 'nubank', description: 'Uber', amount: -18.5, when: 'Hoje, 09:05' },
  { id: 't3', categoryId: 'compras', bankId: 'itau', description: 'Shopee', amount: -129.9, when: 'Ontem, 22:48', isImpulse: true },
  { id: 't4', categoryId: 'salario', bankId: 'bb', description: 'Salário', amount: 6250.0, when: 'Ontem, 08:00' },
  { id: 't5', categoryId: 'alimentacao', bankId: 'inter', description: 'Supermercado Pão', amount: -184.3, when: '06 jun' },
  { id: 't6', categoryId: 'assinaturas', bankId: 'nubank', description: 'Streaming', amount: -39.9, when: '05 jun' },
];

/** Financial-evolution sparkline values (0..1). */
export const EVOLUTION = [
  0.3, 0.36, 0.3, 0.42, 0.55, 0.5, 0.62, 0.58, 0.66, 0.6, 0.72, 0.78, 0.74, 0.88,
];

/** Transactions grouped by day (Transações screen). */
export const TX_GROUPS: TransactionGroup[] = [
  {
    label: 'Hoje',
    items: [
      { id: 'g1', categoryId: 'delivery', bankId: 'nubank', description: 'iFood — almoço', amount: -42.9, time: '13:20', isImpulse: true },
      { id: 'g2', categoryId: 'transporte', bankId: 'nubank', description: 'Uber', amount: -18.5, time: '09:05' },
    ],
  },
  {
    label: 'Ontem',
    items: [
      { id: 'g3', categoryId: 'compras', bankId: 'itau', description: 'Shopee', amount: -129.9, time: '22:48', isImpulse: true },
      { id: 'g4', categoryId: 'salario', bankId: 'bb', description: 'Salário', amount: 6250.0, time: '08:00' },
      { id: 'g5', categoryId: 'alimentacao', bankId: 'inter', description: 'Padaria do Zé', amount: -23.4, time: '07:30' },
    ],
  },
  {
    label: 'Sex, 06 jun',
    items: [
      { id: 'g6', categoryId: 'alimentacao', bankId: 'inter', description: 'Supermercado Pão', amount: -184.3, time: '19:12' },
      { id: 'g7', categoryId: 'assinaturas', bankId: 'nubank', description: 'Streaming', amount: -39.9, time: '12:00' },
      { id: 'g8', categoryId: 'transporte', bankId: 'nubank', description: 'Posto Shell', amount: -150.0, time: '10:20' },
    ],
  },
  {
    label: 'Qui, 05 jun',
    items: [
      { id: 'g9', categoryId: 'lazer', bankId: 'itau', description: 'Cinema', amount: -64.0, time: '21:00', isImpulse: true },
      { id: 'g10', categoryId: 'casa', bankId: 'caixa', description: 'Conta de luz', amount: -132.0, time: '14:00' },
      { id: 'g11', categoryId: 'rendiment', bankId: 'inter', description: 'Rendimento CDB', amount: 38.2, time: '00:01' },
    ],
  },
];

/** Monthly comparison (Relatórios). */
export const MONTHS: MonthPoint[] = [
  { m: 'Jan', rec: 5800.0, desp: 2100.0 },
  { m: 'Fev', rec: 6000.0, desp: 2450.0 },
  { m: 'Mar', rec: 5900.0, desp: 1980.0 },
  { m: 'Abr', rec: 6100.0, desp: 2300.0 },
  { m: 'Mai', rec: 6250.0, desp: 2520.0 },
  { m: 'Jun', rec: 6250.0, desp: 1899.8 },
];

/** Spend by bank (Relatórios). */
export const BY_BANK: BankSpend[] = [
  { bankId: 'nubank', value: 842.3 },
  { bankId: 'itau', value: 451.9 },
  { bankId: 'inter', value: 374.2 },
  { bankId: 'caixa', value: 132.0 },
  { bankId: 'bb', value: 99.4 },
];

/** Composed dashboard payload. */
export const DASHBOARD: Dashboard = {
  summary: { receitas: 6250.0, despesas: 1899.8, saldo: 4350.2 },
  evolution: EVOLUTION,
  deltaSaldo: 620.4,
  spend: SPEND,
  goal: {
    id: 'goal-1',
    title: 'Reserva de emergência',
    targetAmount: 5000.0,
    currentAmount: 3000.0,
    status: GoalStatusEnum.ACTIVE,
  },
  recent: TRANSACTIONS,
};

/** Composed reports payload. */
export const REPORTS: Reports = {
  economia: { value: 4350.2, pct: 70 },
  months: MONTHS,
  spend: SPEND,
  byBank: BY_BANK,
  behavior: { impulsivity: '−12%', consistency: '+8%' },
};

/** Behavioral insight detail (impulse spending). */
export const INSIGHT: InsightDetail = {
  type: InsightTypeEnum.IMPULSIVITY,
  title: 'Gasto por impulso',
  description:
    'Identificamos 9 compras fora do seu padrão este mês — a maioria concentrada nos finais de semana, à noite.',
  weeklyPattern: [
    { day: 'Seg', value: 0.3 },
    { day: 'Ter', value: 0.26 },
    { day: 'Qua', value: 0.34 },
    { day: 'Qui', value: 0.4 },
    { day: 'Sex', value: 0.62 },
    { day: 'Sáb', value: 0.95, hot: true },
    { day: 'Dom', value: 0.8, hot: true },
  ],
  metrics: [
    { label: 'Índice de impulso', value: 'Alto', tone: 'orange', sub: '+18% vs. mês passado' },
    { label: 'Horário de pico', value: '21h–23h', tone: 'purple', sub: 'Sáb e Dom' },
  ],
  tip: {
    title: 'Dica para esta semana',
    body: 'Defina um limite de R$ 80/dia para sábado e domingo. Você economizaria cerca de R$ 240 por mês.',
  },
};
