import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { BanksModule } from './modules/banks/banks.module';
import { CategoriesModule } from './modules/categories/categories.module';
import { TransactionsModule } from './modules/transactions/transactions.module';
import { ReportsModule } from './modules/reports/reports.module';
import { InsightsModule } from './modules/insights/insights.module';
import { GoalsModule } from './modules/goals/goals.module';
import { validateEnv } from './config/env.validation';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validate: validateEnv }),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),
    DatabaseModule,
    AuthModule,
    UsersModule,
    BanksModule,
    CategoriesModule,
    TransactionsModule,
    ReportsModule,
    InsightsModule,
    GoalsModule,
  ],
  providers: [
    // ThrottlerModule.forRoot only registers the storage/options — without
    // this it never actually guards any route (confirmed: /auth/login and
    // /users/register had zero rate limiting before this fix).
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}
