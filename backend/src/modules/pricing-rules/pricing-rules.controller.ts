import { Body, Controller, Get, Param, Post, Put, Query } from '@nestjs/common';

import {
  CreatePricingRuleBody,
  CreatePricingRuleResponse,
  PricingRuleItem,
  PricingRuleListQuery,
  UpdatePricingRuleBody,
  UpdatePricingRuleResponse,
} from '../../../../shared/api.interface';
import { parseOptionalBoolean } from '../../utils/query';
import { PricingRulesService } from './pricing-rules.service';

@Controller('pricing-rules')
export class PricingRulesController {
  constructor(private readonly service: PricingRulesService) {}

  @Get()
  async list(
    @Query() query: Record<string, string>,
  ): Promise<PricingRuleItem[]> {
    const parsed: PricingRuleListQuery = {
      courier: query.courier,
      enabled: parseOptionalBoolean(query.enabled),
    };

    return this.service.list(parsed);
  }

  @Post()
  async create(
    @Body() body: CreatePricingRuleBody,
  ): Promise<CreatePricingRuleResponse> {
    const id = await this.service.create(body);
    return { id };
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() body: UpdatePricingRuleBody,
  ): Promise<UpdatePricingRuleResponse> {
    await this.service.update(id, body);
    return { success: true };
  }
}
