import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { Exclude } from 'class-transformer';
import { Bank } from '../../banks/entities/bank.entity';
import { Transaction } from '../../transactions/entities/transaction.entity';
import { Insight } from '../../insights/entities/insight.entity';
import { Goal } from '../../goals/entities/goal.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 100 })
  name: string;

  @Column({ unique: true, length: 150 })
  email: string;

  @Column({ name: 'password_hash' })
  @Exclude()
  passwordHash: string;

  @OneToMany(() => Bank, (bank) => bank.user)
  banks: Bank[];

  @OneToMany(() => Transaction, (tx) => tx.user)
  transactions: Transaction[];

  @OneToMany(() => Insight, (i) => i.user)
  insights: Insight[];

  @OneToMany(() => Goal, (g) => g.user)
  goals: Goal[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
