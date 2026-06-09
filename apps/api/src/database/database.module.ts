import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { User } from '../modules/users/entities/user.entity';
import { Bank } from '../modules/banks/entities/bank.entity';
import { Category } from '../modules/categories/entities/category.entity';
import { Transaction } from '../modules/transactions/entities/transaction.entity';
import { Insight } from '../modules/insights/entities/insight.entity';
import { Goal } from '../modules/goals/entities/goal.entity';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get('DB_HOST', 'localhost'),
        port: config.get<number>('DB_PORT', 5432),
        username: config.get('DB_USER', 'wyden'),
        password: config.get('DB_PASS', 'wyden_secret'),
        database: config.get('DB_NAME', 'wyden_db'),
        entities: [User, Bank, Category, Transaction, Insight, Goal],
        synchronize: config.get('NODE_ENV') !== 'production',
        logging: config.get('NODE_ENV') === 'development',
      }),
    }),
  ],
})
export class DatabaseModule {}
