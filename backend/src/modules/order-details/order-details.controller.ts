import { Body, Controller, Get, Header, Post, Query } from '@nestjs/common';

import {
  BatchUpdateOrdersBody,
  BatchUpdateOrdersResponse,
  OrderExceptionsQuery,
  OrderExceptionsResponse,
} from '../../../../shared/api.interface';
import {
  parseNumber,
  parseOptionalNumber,
} from '../../utils/query';
import { OrderDetailsService } from './order-details.service';

@Controller('order-details')
export class OrderDetailsController {
  constructor(private readonly service: OrderDetailsService) {}

  @Get('exceptions')
  async listExceptions(
    @Query() query: Record<string, string>,
  ): Promise<OrderExceptionsResponse> {
    const parsed: OrderExceptionsQuery = {
      batchId: query.batchId,
      courier: query.courier,
      exceptionType: query.exceptionType,
      minDiff: parseOptionalNumber(query.minDiff),
      maxDiff: parseOptionalNumber(query.maxDiff),
      conclusion: query.conclusion as OrderExceptionsQuery['conclusion'],
      page: parseNumber(query.page, 1),
      limit: parseNumber(query.limit, 50),
    };

    return this.service.listExceptions(parsed);
  }

  @Get('exceptions/export')
  @Header('Content-Type', 'text/csv; charset=utf-8')
  @Header(
    'Content-Disposition',
    'attachment; filename="exception-orders.csv"',
  )
  async exportExceptions(
    @Query() query: Record<string, string>,
  ): Promise<string> {
    const parsed: OrderExceptionsQuery = {
      batchId: query.batchId,
      courier: query.courier,
      exceptionType: query.exceptionType,
      minDiff: parseOptionalNumber(query.minDiff),
      maxDiff: parseOptionalNumber(query.maxDiff),
      conclusion: query.conclusion as OrderExceptionsQuery['conclusion'],
    };

    return this.service.exportExceptions(parsed);
  }

  @Post('batch-update')
  async batchUpdate(
    @Body() body: BatchUpdateOrdersBody,
  ): Promise<BatchUpdateOrdersResponse> {
    const result = await this.service.batchUpdate(body);
    return { success: true, updatedCount: result.updatedCount };
  }
}
