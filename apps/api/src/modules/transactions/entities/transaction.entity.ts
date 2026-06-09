import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Bank } from '../../banks/entities/bank.entity';
import { Category } from '../../categories/entities/category.entity';

export enum TransactionType {
  INCOME = 'income',
  EXPENSE = 'expense',
}

@Entity('transactions')
export class Transaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id' })
  userId: string;

  @ManyToOne(() => User, (u) => u.transactions)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'bank_id' })
  bankId: string;

  @ManyToOne(() => Bank, (b) => b.transactions)
  @JoinColumn({ name: 'bank_id' })
  bank: Bank;

  @Column({ name: 'category_id' })
  categoryId: string;

  @ManyToOne(() => Category, (c) => c.transactions)
  @JoinColumn({ name: 'category_id' })
  category: Category;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  amount: number;

  @Column({ type: 'enum', enum: TransactionType })
  type: TransactionType;

  @Column({ length: 255, nullable: true })
  description: string;

  @Column({ name: 'transaction_date', type: 'date' })
  transactionDate: Date;

  @Column({ name: 'is_impulse', default: false })
  isImpulse: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
