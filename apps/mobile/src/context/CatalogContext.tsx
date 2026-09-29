/**
 * CatalogContext — loads the category & bank catalogs from the local database
 * once and exposes synchronous lookups (`catById` / `bankById`) plus the split
 * lists the Add screen needs. Screens render transactions/spend referencing
 * only ids, so they resolve icon/color/label through these lookups.
 *
 * The seed catalog (`data/seeds.ts`) is kept as a *fallback*: while the first
 * query is still loading (or if a lookup ever misses) we fall back to the
 * same defaults the database is seeded with, so icons/colors never render
 * blank. There's no login to gate these queries on anymore (see the root
 * CLAUDE.md) — they're always enabled.
 */
import React, { createContext, useContext, useMemo } from 'react';

import { DEFAULT_BANKS, DEFAULT_CATEGORIES } from '../data/seeds';
import { useBanks, useCategories } from '../services/hooks';
import { toBank, toCategory } from '../services/transform';
import { CategoryTypeEnum, type Bank, type Category } from '../services/types';

interface CatalogValue {
  categories: Category[];
  expenseCats: Category[];
  incomeCats: Category[];
  banks: Bank[];
  /** ready === true once both catalogs have loaded from the database. */
  ready: boolean;
  catById: (id: string) => Category;
  bankById: (id: string) => Bank;
}

const CatalogContext = createContext<CatalogValue | null>(null);

const FALLBACK_CATS = DEFAULT_CATEGORIES.map(toCategory);
const FALLBACK_BANKS = DEFAULT_BANKS.map((b) => toBank({ ...b, initialBalanceCents: 0, balanceCents: 0 }));

function fallbackCatById(id: string): Category {
  return FALLBACK_CATS.find((c) => c.id === id) ?? FALLBACK_CATS[FALLBACK_CATS.length - 1];
}

function fallbackBankById(id: string): Bank {
  return FALLBACK_BANKS.find((b) => b.id === id) ?? FALLBACK_BANKS[0];
}

export function CatalogProvider({ children }: { children: React.ReactNode }) {
  const categoriesQ = useCategories();
  const banksQ = useBanks();

  const value = useMemo<CatalogValue>(() => {
    const categories = categoriesQ.data ?? [];
    const banks = banksQ.data ?? [];

    const catMap = new Map(categories.map((c) => [c.id, c]));
    const bankMap = new Map(banks.map((b) => [b.id, b]));

    const catById = (id: string): Category => catMap.get(id) ?? fallbackCatById(id);
    const bankById = (id: string): Bank => bankMap.get(id) ?? fallbackBankById(id);

    const ready = categoriesQ.isSuccess && banksQ.isSuccess;

    return {
      categories: categories.length ? categories : FALLBACK_CATS,
      expenseCats: categories.length
        ? categories.filter((c) => c.type === CategoryTypeEnum.EXPENSE)
        : FALLBACK_CATS.filter((c) => c.type === CategoryTypeEnum.EXPENSE),
      incomeCats: categories.length
        ? categories.filter((c) => c.type === CategoryTypeEnum.INCOME)
        : FALLBACK_CATS.filter((c) => c.type === CategoryTypeEnum.INCOME),
      banks: banks.length ? banks : FALLBACK_BANKS,
      ready,
      catById,
      bankById,
    };
  }, [categoriesQ.data, categoriesQ.isSuccess, banksQ.data, banksQ.isSuccess]);

  return <CatalogContext.Provider value={value}>{children}</CatalogContext.Provider>;
}

export function useCatalog(): CatalogValue {
  const ctx = useContext(CatalogContext);
  if (!ctx) {
    throw new Error('useCatalog must be used within a CatalogProvider');
  }
  return ctx;
}
