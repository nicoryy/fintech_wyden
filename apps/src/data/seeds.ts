/**
 * Default categories & banks — ported verbatim (names/icons/colors/order) from
 * the old backend's `CategoriesService.seedDefaults` and `default-banks.ts`,
 * so a fresh local database looks exactly like a fresh registered account used
 * to. Ids are stable slugs (matched by `services/mock/catalog.ts`'s old ids)
 * rather than generated UUIDs, since they're fixed, well-known rows.
 */
import type { SqlExecutor } from './db';
import { CategoryTypeEnum } from '../services/types';

export interface SeedCategory {
  id: string;
  name: string;
  type: CategoryTypeEnum;
  icon: string;
  color: string;
}

export interface SeedBank {
  id: string;
  name: string;
  short: string;
  color: string;
}

// The old backend had two categories both named "Outros" (one EXPENSE, one
// INCOME) sharing no id — here they need distinct ids, so the income one gets
// an `-receita` suffix.
export const DEFAULT_CATEGORIES: SeedCategory[] = [
  { id: 'compras', name: 'Compras', type: CategoryTypeEnum.EXPENSE, icon: 'bag', color: '#22B07D' },
  { id: 'alimentacao', name: 'Alimentação', type: CategoryTypeEnum.EXPENSE, icon: 'food', color: '#F4762B' },
  { id: 'delivery', name: 'Delivery', type: CategoryTypeEnum.EXPENSE, icon: 'repeat', color: '#FB6F92' },
  { id: 'transporte', name: 'Transporte', type: CategoryTypeEnum.EXPENSE, icon: 'car', color: '#8B5CF6' },
  { id: 'casa', name: 'Casa', type: CategoryTypeEnum.EXPENSE, icon: 'home', color: '#3B82F6' },
  { id: 'saude', name: 'Saúde', type: CategoryTypeEnum.EXPENSE, icon: 'health', color: '#EF5DA8' },
  { id: 'educacao', name: 'Educação', type: CategoryTypeEnum.EXPENSE, icon: 'book', color: '#0EA5A0' },
  { id: 'lazer', name: 'Lazer', type: CategoryTypeEnum.EXPENSE, icon: 'ticket', color: '#F5BE3F' },
  { id: 'assinaturas', name: 'Assinaturas', type: CategoryTypeEnum.EXPENSE, icon: 'repeat', color: '#6366F1' },
  { id: 'outros', name: 'Outros', type: CategoryTypeEnum.EXPENSE, icon: 'dots', color: '#AEB4BB' },
  { id: 'salario', name: 'Salário', type: CategoryTypeEnum.INCOME, icon: 'wallet', color: '#17A06A' },
  { id: 'freelance', name: 'Freelance', type: CategoryTypeEnum.INCOME, icon: 'pencil', color: '#0EA5A0' },
  { id: 'rendimentos', name: 'Rendimentos', type: CategoryTypeEnum.INCOME, icon: 'trend', color: '#3B82F6' },
  { id: 'reembolso', name: 'Reembolso', type: CategoryTypeEnum.INCOME, icon: 'repeat', color: '#8B5CF6' },
  { id: 'outros-receita', name: 'Outros', type: CategoryTypeEnum.INCOME, icon: 'dots', color: '#AEB4BB' },
];

export const DEFAULT_BANKS: SeedBank[] = [
  { id: 'nubank', name: 'Nubank', short: 'Nu', color: '#8A05BE' },
  { id: 'bb', name: 'Banco do Brasil', short: 'BB', color: '#F4C400' },
  { id: 'caixa', name: 'Caixa', short: 'CX', color: '#1A6CC4' },
  { id: 'itau', name: 'Itaú', short: 'It', color: '#EC7000' },
  { id: 'inter', name: 'Inter', short: 'In', color: '#FF6B00' },
  { id: 'dinheiro', name: 'Dinheiro', short: '$', color: '#17A06A' },
];

/** Idempotent: `INSERT OR IGNORE` on the (stable, slug) primary keys. */
export async function seedDefaults(db: SqlExecutor): Promise<void> {
  const now = Date.now();
  for (const c of DEFAULT_CATEGORIES) {
    await db.runAsync(
      'INSERT OR IGNORE INTO categories (id, name, type, icon, color, created_at) VALUES (?, ?, ?, ?, ?, ?)',
      [c.id, c.name, c.type, c.icon, c.color, now],
    );
  }
  for (const b of DEFAULT_BANKS) {
    await db.runAsync(
      'INSERT OR IGNORE INTO banks (id, name, short, color, initial_balance_cents, created_at) VALUES (?, ?, ?, ?, 0, ?)',
      [b.id, b.name, b.short, b.color, now],
    );
  }
}
