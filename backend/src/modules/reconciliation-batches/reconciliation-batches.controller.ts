import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';

import {
  CreateReconciliationBatchBody,
  CreateReconciliationBatchResponse,
  ReconciliationBatchListItem,
  ReconciliationBatchListQuery,
  UpdateBatchStatusBody,
  UpdateBatchStatusResponse,
} from '../../../../shared/api.interface';
import { parseNumber } from '../../utils/query';
import { ReconciliationBatchesService } from './reconciliation-batches.service';

@Controller('reconciliation-batches')
export class ReconciliationBatchesController {
  constructor(private readonly service: ReconciliationBatchesService) {}

  @Get()
  async list(
    @Query() query: Record<string, string>,
  ): Promise<ReconciliationBatchListItem[]> {
    const parsed: ReconciliationBatchListQuery = {
      status: query.status as ReconciliationBatchListQuery['status'],
      courier: query.courier,
      page: parseNumber(query.page, 1),
      limit: parseNumber(query.limit, 20),
    };

    return this.service.list(parsed);
  }

  @Post()
  async create(
    @Body() body: CreateReconciliationBatchBody,
  ): Promise<CreateReconciliationBatchResponse> {
    const id = await this.service.create(body);
    return { id };
  }

  @Patch(':id/status')
  async updateStatus(
    @Param('id') id: string,
    @Body() body: UpdateBatchStatusBody,
  ): Promise<UpdateBatchStatusResponse> {
    await this.service.updateStatus(id, body.status);
    return { success: true };
  }
}
