import { Injectable } from '@nestjs/common';
import { and, desc, eq } from 'drizzle-orm';

import {
  CreatePricingRuleBody,
  PricingRuleItem,
  PricingRuleListQuery,
  UpdatePricingRuleBody,
} from '../../../../shared/api.interface';
import { db } from '../../db';
import { pricingRuleTable } from '../../db/schema';

@Injectable()
export class PricingRulesService {
  async list(query: PricingRuleListQuery): Promise<PricingRuleItem[]> {
    const conditions = [];

    if (query.courier) {
      conditions.push(eq(pricingRuleTable.courier, query.courier));
    }
    if (query.enabled !== undefined) {
      conditions.push(eq(pricingRuleTable.enabled, query.enabled));
    }

    const rows = await db
      .select({
        id: pricingRuleTable.id,
        name: pricingRuleTable.name,
        courier: pricingRuleTable.courier,
        firstWeight: pricingRuleTable.firstWeight,
        firstWeightPrice: pricingRuleTable.firstWeightPrice,
        extraWeightPrice: pricingRuleTable.extraWeightPrice,
        baseOperationFee: pricingRuleTable.baseOperationFee,
        toleranceExpressFee: pricingRuleTable.toleranceExpressFee,
        tolerancePackagingFee: pricingRuleTable.tolerancePackagingFee,
        enabled: pricingRuleTable.enabled,
      })
      .from(pricingRuleTable)
      .where(conditions.length ? and(...conditions) : undefined)
      .orderBy(desc(pricingRuleTable.createdAt));

    return rows;
  }

  async create(body: CreatePricingRuleBody): Promise<string> {
    const [row] = await db
      .insert(pricingRuleTable)
      .values({
        ...body,
        updatedAt: new Date(),
      })
      .returning({ id: pricingRuleTable.id });

    return row.id;
  }

  async update(id: string, body: UpdatePricingRuleBody): Promise<void> {
    await db
      .update(pricingRuleTable)
      .set({
        ...body,
        updatedAt: new Date(),
      })
      .where(eq(pricingRuleTable.id, id));
  }
}
