import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

export enum GoalStatus {
  ACTIVE = 'active',
  COMPLETED = 'completed',
  PAUSED = 'paused',
}

@Entity('goals')
export class Goal {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id' })
  userId: string;

  @ManyToOne(() => User, (u) => u.goals)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ length: 150 })
  title: string;

  @Column({ name: 'target_amount', type: 'decimal', precision: 12, scale: 2 })
  targetAmount: number;

  @Column({
    name: 'current_amount',
    type: 'decimal',
    precision: 12,
    scale: 2,
    default: 0,
  })
  currentAmount: number;

  @Column({ type: 'date', nullable: true })
  deadline: Date;

  @Column({ type: 'enum', enum: GoalStatus, default: GoalStatus.ACTIVE })
  status: GoalStatus;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
