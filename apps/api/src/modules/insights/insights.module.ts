import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InsightsService } from './insights.service';
import { InsightsController } from './insights.controller';
import { Insight } from './entities/insight.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Insight])],
  controllers: [InsightsController],
  providers: [InsightsService],
  exports: [InsightsService],
})
export class InsightsModule {}
