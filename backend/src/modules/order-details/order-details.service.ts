import { Injectable } from '@nestjs/common';
import {
  and,
  desc,
  eq,
  gte,
  inArray,
  lte,
  sql,
} from 'drizzle-orm';

import {
  BatchUpdateOrdersBody,
  OrderExceptionsQuery,
  OrderExceptionsResponse,
} from '../../../../shared/api.interface';
import { db } from '../../db';
import { orderDetailTable } from '../../db/schema';
import { ReconciliationBatchesService } from '../reconciliation-batches/reconciliation-batches.service';

@Injectable()
export class OrderDetailsService {
  constructor(
    private readonly reconciliationBatchesService: ReconciliationBatchesService,
  ) {}

  async listExceptions(
    query: OrderExceptionsQuery,
  ): Promise<OrderExceptionsResponse> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 50;
    const offset = (page - 1) * limit;

    const conditions = [
      sql`array_length(${orderDetailTable.exceptionTypes}, 1) > 0`,
    ];

    if (query.courier) {
      conditions.push(eq(orderDetailTable.courier, query.courier));
    }
    if (query.conclusion) {
      conditions.push(eq(orderDetailTable.conclusion, query.conclusion));
    }
    if (query.exceptionType) {
      conditions.push(
        sql`${orderDetailTable.exceptionTypes} @> ${[
          query.exceptionType,
        ]}`,
      );
    }
    if (query.minDiff !== undefined) {
      conditions.push(gte(orderDetailTable.totalDifference, query.minDiff));
    }
    if (query.maxDiff !== undefined) {
      conditions.push(lte(orderDetailTable.totalDifference, query.maxDiff));
    }

    const [{ total }] = await db
      .select({
        total: sql<number>`count(*)`,
      })
      .from(orderDetailTable)
      .where(and(...conditions));

    const rows = await db
      .select({
        waybillNumber: orderDetailTable.waybillNumber,
        courier: orderDetailTable.courier,
        province: orderDetailTable.province,
        shippingDate: orderDetailTable.shippingDate,
        totalDifference: orderDetailTable.totalDifference,
        exceptionTypes: orderDetailTable.exceptionTypes,
        conclusion: orderDetailTable.conclusion,
        processingNote: orderDetailTable.processingNote,
      })
      .from(orderDetailTable)
      .where(and(...conditions))
      .orderBy(desc(orderDetailTable.totalDifference))
      .limit(limit)
      .offset(offset);

    return {
      items: rows.map((row) => ({
        ...row,
        shippingDate: row.shippingDate.toISOString(),
        exceptionTypes: row.exceptionTypes ?? [],
        processingNote: row.processingNote ?? null,
      })),
      total: Number(total ?? 0),
    };
  }

  async batchUpdate(body: BatchUpdateOrdersBody) {
    const updatePayload: Partial<typeof orderDetailTable.$inferInsert> = {
      conclusion: body.conclusion,
      updatedAt: new Date(),
    };

    if (body.processingNote !== undefined) {
      updatePayload.processingNote = body.processingNote;
    }

    const updated = await db
      .update(orderDetailTable)
      .set(updatePayload)
      .where(inArray(orderDetailTable.waybillNumber, body.waybillNumbers))
      .returning({ batchId: orderDetailTable.batchId });

    const batchIds = Array.from(new Set(updated.map((row) => row.batchId)));
    await Promise.all(
      batchIds.map((batchId) =>
        this.reconciliationBatchesService.refreshSummary(batchId),
      ),
    );

    return { updatedCount: updated.length };
  }
}
