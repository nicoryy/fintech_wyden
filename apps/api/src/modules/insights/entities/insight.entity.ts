import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

export enum InsightType {
  IMPULSIVITY = 'impulsivity',
  CONSISTENCY = 'consistency',
  PLANNING = 'planning',
  EMOTIONAL = 'emotional',
}

@Entity('insights')
export class Insight {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id' })
  userId: string;

  @ManyToOne(() => User, (u) => u.insights)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ type: 'enum', enum: InsightType })
  type: InsightType;

  @Column({ type: 'int' })
  score: number;

  @Column({ length: 150 })
  title: string;

  @Column({ type: 'text' })
  description: string;

  @CreateDateColumn({ name: 'generated_at' })
  generatedAt: Date;
}
