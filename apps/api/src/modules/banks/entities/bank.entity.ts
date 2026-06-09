import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Transaction } from '../../transactions/entities/transaction.entity';

@Entity('banks')
export class Bank {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id' })
  userId: string;

  @ManyToOne(() => User, (u) => u.banks)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ length: 100 })
  name: string;

  // UI tile: short label (e.g. "Nu") and accent color (e.g. "#8A05BE").
  // `type` is explicit because the `string | null` union otherwise makes
  // reflect-metadata emit `Object`, which TypeORM can't map to a column type.
  @Column({ type: 'varchar', length: 8, nullable: true })
  short: string | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  color: string | null;

  @Column({
    name: 'initial_balance',
    type: 'decimal',
    precision: 12,
    scale: 2,
    default: 0,
  })
  initialBalance: number;

  @Column({
    name: 'current_balance',
    type: 'decimal',
    precision: 12,
    scale: 2,
    default: 0,
  })
  currentBalance: number;

  @OneToMany(() => Transaction, (tx) => tx.bank)
  transactions: Transaction[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
