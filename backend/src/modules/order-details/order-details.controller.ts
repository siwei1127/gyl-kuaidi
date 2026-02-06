import { Body, Controller, Get, Post, Query } from '@nestjs/common';

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

  @Post('batch-update')
  async batchUpdate(
    @Body() body: BatchUpdateOrdersBody,
  ): Promise<BatchUpdateOrdersResponse> {
    const result = await this.service.batchUpdate(body);
    return { success: true, updatedCount: result.updatedCount };
  }
}
