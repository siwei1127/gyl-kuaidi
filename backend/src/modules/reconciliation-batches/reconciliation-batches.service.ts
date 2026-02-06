import { BadRequestException, Injectable } from '@nestjs/common';
import { and, desc, eq, sql } from 'drizzle-orm';
import * as xlsx from 'xlsx';

import {
  CreateReconciliationBatchBody,
  ImportReconciliationBatchResponse,
  ReconciliationBatchListItem,
  ReconciliationBatchListQuery,
} from '../../../../shared/api.interface';
import { db } from '../../db';
import {
  orderDetailTable,
  reconciliationBatchTable,
} from '../../db/schema';

type OrderInsert = typeof orderDetailTable.$inferInsert;

const normalizeKey = (value: string) =>
  value
    .replace(/\s+/g, '')
    .replace(/[（）()]/g, '')
    .replace(/[：:]/g, '')
    .toLowerCase();

const columnAliases = {
  waybillNumber: ['运单号', '运单编号', '运单号码', '快递单号'],
  courier: ['快递公司', '承运公司', '物流公司', '承运商'],
  province: ['省', '省份', '目的省', '收件省', '到达省'],
  shippingDate: ['发货日期', '发货时间', '寄件日期', '寄件时间', '揽收时间'],
  totalDifference: ['差额', '费用差额', '总差额', '对账差额'],
  exceptionTypes: ['异常类型', '异常原因', '问题类型'],
  processingNote: ['备注', '处理备注', '说明'],
  systemAmount: [
    '系统费用',
    '系统金额',
    '系统应付',
    '系统总金额',
    '应付金额系统',
    '应付金额系统值',
  ],
  billAmount: [
    '账单费用',
    '账单金额',
    '快递费用',
    '应付金额',
    '账单应付',
    '应付金额账单',
  ],
};

const parseNumber = (value: unknown) => {
  if (value === null || value === undefined || value === '') {
    return undefined;
  }
  const parsed = Number(String(value).replace(/,/g, '').trim());
  return Number.isNaN(parsed) ? undefined : parsed;
};

const parseDate = (value: unknown) => {
  if (!value) {
    return undefined;
  }
  if (value instanceof Date) {
    return value;
  }
  if (typeof value === 'number') {
    const excelEpoch = new Date(Date.UTC(1899, 11, 30));
    return new Date(excelEpoch.getTime() + value * 86400000);
  }
  const parsed = new Date(String(value));
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
};

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

  async importOrders(
    batchId: string,
    fileBuffer: Buffer,
  ): Promise<ImportReconciliationBatchResponse> {
    const [batch] = await db
      .select({
        id: reconciliationBatchTable.id,
        courier: reconciliationBatchTable.courier,
      })
      .from(reconciliationBatchTable)
      .where(eq(reconciliationBatchTable.id, batchId))
      .limit(1);

    if (!batch) {
      throw new BadRequestException('Batch not found.');
    }

    const workbook = xlsx.read(fileBuffer, { type: 'buffer', cellDates: true });
    const sheetName = workbook.SheetNames[0];
    if (!sheetName) {
      throw new BadRequestException('No sheet found in file.');
    }

    const sheet = workbook.Sheets[sheetName];
    const rows = xlsx.utils.sheet_to_json<Record<string, unknown>>(sheet, {
      defval: null,
    });

    if (!rows.length) {
      return { success: true, insertedCount: 0, skippedCount: 0 };
    }

    let skippedCount = 0;
    const insertRows = rows
      .map((row) => {
        const normalizedRow: Record<string, unknown> = {};
        Object.entries(row).forEach(([key, value]) => {
          normalizedRow[normalizeKey(key)] = value;
        });

        const pickValue = (aliases: string[]) => {
          for (const alias of aliases) {
            const normalized = normalizeKey(alias);
            if (
              Object.prototype.hasOwnProperty.call(normalizedRow, normalized) &&
              normalizedRow[normalized] !== null &&
              normalizedRow[normalized] !== ''
            ) {
              return normalizedRow[normalized];
            }
          }
          return undefined;
        };

        const waybillNumber = String(
          pickValue(columnAliases.waybillNumber) ?? '',
        ).trim();

        if (!waybillNumber) {
          skippedCount += 1;
          return null;
        }

        const courier =
          String(pickValue(columnAliases.courier) ?? '').trim() ||
          batch.courier;
        const province =
          String(pickValue(columnAliases.province) ?? '').trim() || '未知';

        const shippingDate =
          parseDate(pickValue(columnAliases.shippingDate)) ?? new Date();

        const totalDifferenceValue = parseNumber(
          pickValue(columnAliases.totalDifference),
        );
        const systemAmount = parseNumber(
          pickValue(columnAliases.systemAmount),
        );
        const billAmount = parseNumber(pickValue(columnAliases.billAmount));

        let totalDifference = totalDifferenceValue;
        if (
          totalDifference === undefined &&
          systemAmount !== undefined &&
          billAmount !== undefined
        ) {
          totalDifference = billAmount - systemAmount;
        }
        if (totalDifference === undefined) {
          totalDifference = 0;
        }

        const exceptionRaw = pickValue(columnAliases.exceptionTypes);
        let exceptionTypes: string[] = [];
        if (Array.isArray(exceptionRaw)) {
          exceptionTypes = exceptionRaw.map((item) => String(item).trim());
        } else if (exceptionRaw) {
          exceptionTypes = String(exceptionRaw)
            .split(/[,，、/]/)
            .map((item) => item.trim())
            .filter(Boolean);
        }

        if (!exceptionTypes.length && totalDifference !== 0) {
          exceptionTypes = ['费用差额'];
        }

        const processingNote = pickValue(columnAliases.processingNote);

        const order: OrderInsert = {
          batchId,
          waybillNumber,
          courier,
          province,
          shippingDate,
          totalDifference,
          exceptionTypes,
          conclusion: 'pending',
          processingNote: processingNote
            ? String(processingNote).trim()
            : null,
          rawData: row,
          updatedAt: new Date(),
        };

        return order;
      })
      .filter((row): row is OrderInsert => row !== null);

    if (!insertRows.length) {
      return { success: true, insertedCount: 0, skippedCount };
    }

    await db.insert(orderDetailTable).values(insertRows);

    await db
      .update(reconciliationBatchTable)
      .set({ status: 'processing', updatedAt: new Date() })
      .where(eq(reconciliationBatchTable.id, batchId));

    await this.refreshSummary(batchId);

    return {
      success: true,
      insertedCount: insertRows.length,
      skippedCount,
    };
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
