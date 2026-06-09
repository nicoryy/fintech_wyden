import { ObjectLiteral, Repository } from 'typeorm';
import { User } from '../modules/users/entities/user.entity';
import { Bank } from '../modules/banks/entities/bank.entity';
import {
  Category,
  CategoryType,
} from '../modules/categories/entities/category.entity';
import {
  Transaction,
  TransactionType,
} from '../modules/transactions/entities/transaction.entity';
import { Goal, GoalStatus } from '../modules/goals/entities/goal.entity';
import {
  Insight,
  InsightType,
} from '../modules/insights/entities/insight.entity';

/**
 * A typed bag of jest mocks standing in for a TypeORM repository. Only the
 * methods used by the services under test are populated; add more as needed.
 */
export type MockRepo<T extends ObjectLiteral = ObjectLiteral> = Partial<
  Record<keyof Repository<T>, jest.Mock>
>;

/**
 * Builds a fresh mock repository with the methods our services rely on. Each
 * call returns independent jest.fn()s so tests stay isolated.
 */
export const createMockRepo = <
  T extends ObjectLiteral = ObjectLiteral,
>(): MockRepo<T> => ({
  find: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  remove: jest.fn(),
});

let seq = 0;
const nextId = (prefix: string): string => `${prefix}-${++seq}`;

export const makeUser = (overrides: Partial<User> = {}): User => {
  const now = new Date('2026-01-01T00:00:00.000Z');
  return {
    id: nextId('user'),
    name: 'Test User',
    email: 'test@example.com',
    passwordHash: 'hashed-password',
    banks: [],
    transactions: [],
    insights: [],
    goals: [],
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
};

export const makeBank = (overrides: Partial<Bank> = {}): Bank => {
  return {
    id: nextId('bank'),
    userId: 'user-1',
    user: undefined as unknown as User,
    name: 'Test Bank',
    short: null,
    color: null,
    initialBalance: 0,
    currentBalance: 0,
    transactions: [],
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    ...overrides,
  };
};

export const makeCategory = (overrides: Partial<Category> = {}): Category => {
  return {
    id: nextId('category'),
    name: 'Test Category',
    type: CategoryType.EXPENSE,
    icon: 'bag',
    color: '#000000',
    transactions: [],
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    ...overrides,
  };
};

export const makeTransaction = (
  overrides: Partial<Transaction> = {},
): Transaction => {
  return {
    id: nextId('tx'),
    userId: 'user-1',
    user: undefined as unknown as User,
    bankId: 'bank-1',
    bank: undefined as unknown as Bank,
    categoryId: 'category-1',
    category: undefined as unknown as Category,
    amount: 50,
    type: TransactionType.EXPENSE,
    description: 'Test transaction',
    transactionDate: new Date('2026-01-15T10:00:00.000Z'),
    isImpulse: false,
    createdAt: new Date('2026-01-15T10:00:00.000Z'),
    ...overrides,
  };
};

export const makeGoal = (overrides: Partial<Goal> = {}): Goal => {
  const now = new Date('2026-01-01T00:00:00.000Z');
  return {
    id: nextId('goal'),
    userId: 'user-1',
    user: undefined as unknown as User,
    title: 'Test Goal',
    targetAmount: 1000,
    currentAmount: 0,
    deadline: undefined as unknown as Date,
    status: GoalStatus.ACTIVE,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
};

export const makeInsight = (overrides: Partial<Insight> = {}): Insight => {
  return {
    id: nextId('insight'),
    userId: 'user-1',
    user: undefined as unknown as User,
    type: InsightType.IMPULSIVITY,
    score: 50,
    title: 'Test Insight',
    description: 'Test description',
    generatedAt: new Date('2026-01-01T00:00:00.000Z'),
    ...overrides,
  };
};
