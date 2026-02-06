import { Injectable } from '@nestjs/common';
import { and, desc, eq, sql } from 'drizzle-orm';

import {
  CreateReconciliationBatchBody,
  ReconciliationBatchListItem,
  ReconciliationBatchListQuery,
} from '../../../../shared/api.interface';
import { db } from '../../db';
import {
  orderDetailTable,
  reconciliationBatchTable,
} from '../../db/schema';

@Injectable()
export class ReconciliationBatchesService {
  async list(
    query: ReconciliationBatchListQuery,
  ): Promise<ReconciliationBatchListItem[]> {
    const conditions = [];
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const offset = (page - 1) * limit;

    if (query.status) {
      conditions.push(eq(reconciliationBatchTable.status, query.status));
    }
    if (query.courier) {
      conditions.push(eq(reconciliationBatchTable.courier, query.courier));
    }

    const rows = await db
      .select({
        id: reconciliationBatchTable.id,
        name: reconciliationBatchTable.name,
        courier: reconciliationBatchTable.courier,
        totalDifference: reconciliationBatchTable.totalDifference,
        exceptionCount: reconciliationBatchTable.exceptionCount,
        pendingExceptionCount: reconciliationBatchTable.pendingExceptionCount,
        status: reconciliationBatchTable.status,
        createdAt: reconciliationBatchTable.createdAt,
      })
      .from(reconciliationBatchTable)
      .where(conditions.length ? and(...conditions) : undefined)
      .orderBy(desc(reconciliationBatchTable.createdAt))
      .limit(limit)
      .offset(offset);

    return rows.map((row) => ({
      ...row,
      createdAt: row.createdAt.toISOString(),
    }));
  }

  async create(body: CreateReconciliationBatchBody): Promise<string> {
    const [row] = await db
      .insert(reconciliationBatchTable)
      .values({
        ...body,
        totalDifference: 0,
        exceptionCount: 0,
        pendingExceptionCount: 0,
        status: 'draft',
        updatedAt: new Date(),
      })
      .returning({ id: reconciliationBatchTable.id });

    return row.id;
  }

  async updateStatus(id: string, status: 'archived'): Promise<void> {
    await db
      .update(reconciliationBatchTable)
      .set({ status, updatedAt: new Date() })
      .where(eq(reconciliationBatchTable.id, id));
  }

  async refreshSummary(batchId: string): Promise<void> {
    const [summary] = await db
      .select({
        totalDifference: sql<number>`coalesce(sum(${orderDetailTable.totalDifference}), 0)`,
        exceptionCount: sql<number>`coalesce(sum(case when array_length(${orderDetailTable.exceptionTypes}, 1) > 0 then 1 else 0 end), 0)`,
        pendingExceptionCount: sql<number>`coalesce(sum(case when array_length(${orderDetailTable.exceptionTypes}, 1) > 0 and ${orderDetailTable.conclusion} = 'pending' then 1 else 0 end), 0)`,
      })
      .from(orderDetailTable)
      .where(eq(orderDetailTable.batchId, batchId));

    await db
      .update(reconciliationBatchTable)
      .set({
        totalDifference: summary?.totalDifference ?? 0,
        exceptionCount: summary?.exceptionCount ?? 0,
        pendingExceptionCount: summary?.pendingExceptionCount ?? 0,
        updatedAt: new Date(),
      })
      .where(eq(reconciliationBatchTable.id, batchId));
  }
}
