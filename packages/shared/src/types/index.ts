export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

export enum TransactionTypeEnum {
  INCOME = 'income',
  EXPENSE = 'expense',
}

export enum CategoryTypeEnum {
  INCOME = 'income',
  EXPENSE = 'expense',
}

export enum GoalStatusEnum {
  ACTIVE = 'active',
  COMPLETED = 'completed',
  PAUSED = 'paused',
}

export enum InsightTypeEnum {
  IMPULSIVITY = 'impulsivity',
  CONSISTENCY = 'consistency',
  PLANNING = 'planning',
  EMOTIONAL = 'emotional',
}
