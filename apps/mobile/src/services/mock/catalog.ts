/**
 * Static catalogs — categories & banks — ported from the prototype `data.jsx`.
 * These carry the UI presentation (icon/color/short) and match the backend's
 * default category seed (`CategoriesService.seedDefaults`).
 */
import { CategoryTypeEnum, type Bank, type Category } from '../types';

export const CATS: Category[] = [
  { id: 'compras', label: 'Compras', icon: 'bag', color: '#22B07D', type: CategoryTypeEnum.EXPENSE },
  { id: 'alimentacao', label: 'Alimentação', icon: 'food', color: '#F4762B', type: CategoryTypeEnum.EXPENSE },
  { id: 'delivery', label: 'Delivery', icon: 'repeat', color: '#FB6F92', type: CategoryTypeEnum.EXPENSE },
  { id: 'transporte', label: 'Transporte', icon: 'car', color: '#8B5CF6', type: CategoryTypeEnum.EXPENSE },
  { id: 'casa', label: 'Casa', icon: 'home', color: '#3B82F6', type: CategoryTypeEnum.EXPENSE },
  { id: 'saude', label: 'Saúde', icon: 'health', color: '#EF5DA8', type: CategoryTypeEnum.EXPENSE },
  { id: 'educacao', label: 'Educação', icon: 'book', color: '#0EA5A0', type: CategoryTypeEnum.EXPENSE },
  { id: 'lazer', label: 'Lazer', icon: 'ticket', color: '#F5BE3F', type: CategoryTypeEnum.EXPENSE },
  { id: 'assinaturas', label: 'Assinaturas', icon: 'repeat', color: '#6366F1', type: CategoryTypeEnum.EXPENSE },
  { id: 'outros', label: 'Outros', icon: 'dots', color: '#AEB4BB', type: CategoryTypeEnum.EXPENSE },
];

export const INCOME_CATS: Category[] = [
  { id: 'salario', label: 'Salário', icon: 'wallet', color: '#17A06A', type: CategoryTypeEnum.INCOME },
  { id: 'freelance', label: 'Freelance', icon: 'pencil', color: '#0EA5A0', type: CategoryTypeEnum.INCOME },
  { id: 'rendiment', label: 'Rendimentos', icon: 'trend', color: '#3B82F6', type: CategoryTypeEnum.INCOME },
  { id: 'reembolso', label: 'Reembolso', icon: 'repeat', color: '#8B5CF6', type: CategoryTypeEnum.INCOME },
  { id: 'outros', label: 'Outros', icon: 'dots', color: '#AEB4BB', type: CategoryTypeEnum.INCOME },
];

const ALL_CATS = [...CATS, ...INCOME_CATS];

/** Resolve a category by id, falling back to "Outros". */
export function catById(id: string): Category {
  return (
    ALL_CATS.find((c) => c.id === id) ?? CATS[CATS.length - 1]
  );
}

export const BANKS: Bank[] = [
  { id: 'nubank', label: 'Nubank', color: '#8A05BE', short: 'Nu' },
  { id: 'bb', label: 'Banco do Brasil', color: '#F4C400', short: 'BB', ink: '#1B1D21' },
  { id: 'caixa', label: 'Caixa', color: '#1A6CC4', short: 'CX' },
  { id: 'itau', label: 'Itaú', color: '#EC7000', short: 'It' },
  { id: 'inter', label: 'Inter', color: '#FF6B00', short: 'In' },
  { id: 'dinheiro', label: 'Dinheiro', color: '#17A06A', short: '$', cash: true },
];

/** Resolve a bank by id, falling back to the first bank. */
export function bankById(id: string): Bank {
  return BANKS.find((b) => b.id === id) ?? BANKS[0];
}
