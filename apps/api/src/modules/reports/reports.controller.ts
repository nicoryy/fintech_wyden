import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { JwtPayload } from '../../common/types/jwt-payload.type';
import {
  ByCategoryQueryDto,
  MonthlyComparisonQueryDto,
  MonthQueryDto,
} from './dto/report-query.dto';

@UseGuards(JwtAuthGuard)
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('summary')
  summary(@CurrentUser() user: JwtPayload, @Query() query: MonthQueryDto) {
    return this.reportsService.summary(user.id, query.month);
  }

  @Get('by-category')
  byCategory(
    @CurrentUser() user: JwtPayload,
    @Query() query: ByCategoryQueryDto,
  ) {
    return this.reportsService.byCategory(user.id, query.month, query.type);
  }

  @Get('by-bank')
  byBank(@CurrentUser() user: JwtPayload, @Query() query: MonthQueryDto) {
    return this.reportsService.byBank(user.id, query.month);
  }

  @Get('monthly-comparison')
  monthlyComparison(
    @CurrentUser() user: JwtPayload,
    @Query() query: MonthlyComparisonQueryDto,
  ) {
    return this.reportsService.monthlyComparison(user.id, query.months);
  }
}
