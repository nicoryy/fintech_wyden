/**
 * CatalogContext — loads the category & bank catalogs from the API once and
 * exposes synchronous lookups (`catById` / `bankById`) plus the split lists the
 * Add screen needs. Screens render transactions/spend referencing only ids, so
 * they resolve icon/color/label through these lookups.
 *
 * The static mock catalog (`mock/catalog`) is kept as a *fallback*: if a lookup
 * misses (e.g. a category id not yet loaded) we fall back to the bundled
 * defaults so icons/colors never render blank.
 */
import React, { createContext, useContext, useMemo } from 'react';

import { useOptionalAuth } from './AuthContext';
import { useBanks, useCategories } from '../services/hooks';
import {
  BANKS as MOCK_BANKS,
  CATS as MOCK_CATS,
  INCOME_CATS as MOCK_INCOME,
  bankById as mockBankById,
  catById as mockCatById,
} from '../services/mock/catalog';
import { CategoryTypeEnum, type Bank, type Category } from '../services/types';

interface CatalogValue {
  categories: Category[];
  expenseCats: Category[];
  incomeCats: Category[];
  banks: Bank[];
  /** ready === true once both catalogs have loaded from the API. */
  ready: boolean;
  catById: (id: string) => Category;
  bankById: (id: string) => Bank;
}

const CatalogContext = createContext<CatalogValue | null>(null);

export function CatalogProvider({ children }: { children: React.ReactNode }) {
  const auth = useOptionalAuth();
  // Previously fired unconditionally, including on the login screen for a
  // guest session — /categories and /banks would 401, trigger a refresh
  // attempt, and (on that failing too) log the guest out of a session they
  // never had. Only gate when a real AuthContext is present and says
  // 'guest'; with no AuthProvider in scope (e.g. tests rendering
  // CatalogProvider directly) there is no session concept to gate on.
  const enabled = auth ? auth.status === 'authed' : true;
  const categoriesQ = useCategories({ enabled });
  const banksQ = useBanks({ enabled });

  const value = useMemo<CatalogValue>(() => {
    const categories = categoriesQ.data ?? [];
    const banks = banksQ.data ?? [];

    const catMap = new Map(categories.map((c) => [c.id, c]));
    const bankMap = new Map(banks.map((b) => [b.id, b]));

    const catById = (id: string): Category => catMap.get(id) ?? mockCatById(id);
    const bankById = (id: string): Bank => bankMap.get(id) ?? mockBankById(id);

    const ready = categoriesQ.isSuccess && banksQ.isSuccess;

    return {
      categories: categories.length ? categories : [...MOCK_CATS, ...MOCK_INCOME],
      expenseCats: categories.length
        ? categories.filter((c) => c.type === CategoryTypeEnum.EXPENSE)
        : MOCK_CATS,
      incomeCats: categories.length
        ? categories.filter((c) => c.type === CategoryTypeEnum.INCOME)
        : MOCK_INCOME,
      banks: banks.length ? banks : MOCK_BANKS,
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
