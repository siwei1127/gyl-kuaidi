import 'dotenv/config';

import { randomUUID } from 'crypto';

import { db } from './index';
import { initDatabase } from './init';
import {
  orderDetailTable,
  pricingRuleTable,
  reconciliationBatchTable,
} from './schema';

type OrderSeed = typeof orderDetailTable.$inferInsert;

const batchIdEast = randomUUID();
const batchIdNorth = randomUUID();

const orders: OrderSeed[] = [
  {
    batchId: batchIdEast,
    waybillNumber: 'WB20250201001',
    courier: '顺丰',
    province: '浙江',
    shippingDate: new Date('2025-02-01T08:10:00Z'),
    totalDifference: 12.5,
    exceptionTypes: ['重量偏差'],
    conclusion: 'pending',
    processingNote: null,
  },
  {
    batchId: batchIdEast,
    waybillNumber: 'WB20250201002',
    courier: '顺丰',
    province: '江苏',
    shippingDate: new Date('2025-02-01T10:20:00Z'),
    totalDifference: -5.2,
    exceptionTypes: ['包装费偏差'],
    conclusion: 'pending',
    processingNote: null,
  },
  {
    batchId: batchIdNorth,
    waybillNumber: 'WB20250115001',
    courier: '京东',
    province: '北京',
    shippingDate: new Date('2025-01-15T09:00:00Z'),
    totalDifference: 0,
    exceptionTypes: [],
    conclusion: 'approved',
    processingNote: '已自动匹配规则',
  },
  {
    batchId: batchIdNorth,
    waybillNumber: 'WB20250115002',
    courier: '京东',
    province: '河北',
    shippingDate: new Date('2025-01-15T11:15:00Z'),
    totalDifference: 18.9,
    exceptionTypes: ['超区费', '重量偏差'],
    conclusion: 'pending',
    processingNote: null,
  },
];

function buildBatchSummary(batchId: string) {
  const batchOrders = orders.filter((item) => item.batchId === batchId);
  const exceptionCount = batchOrders.filter(
    (item) => (item.exceptionTypes ?? []).length > 0,
  ).length;
  const pendingExceptionCount = batchOrders.filter(
    (item) =>
      (item.exceptionTypes ?? []).length > 0 && item.conclusion === 'pending',
  ).length;
  const totalDifference = batchOrders.reduce(
    (sum, item) => sum + (item.totalDifference ?? 0),
    0,
  );

  return {
    exceptionCount,
    pendingExceptionCount,
    totalDifference,
  };
}

async function seed() {
  await initDatabase();
  await db.delete(orderDetailTable);
  await db.delete(reconciliationBatchTable);
  await db.delete(pricingRuleTable);

  await db.insert(pricingRuleTable).values([
    {
      name: '顺丰-华东标准',
      courier: '顺丰',
      firstWeight: 1,
      firstWeightPrice: 12,
      extraWeightPrice: 2,
      baseOperationFee: 1,
      toleranceExpressFee: 3,
      tolerancePackagingFee: 1.5,
      enabled: true,
    },
    {
      name: '京东-华北标准',
      courier: '京东',
      firstWeight: 1,
      firstWeightPrice: 10,
      extraWeightPrice: 1.8,
      baseOperationFee: 1,
      toleranceExpressFee: 2.5,
      tolerancePackagingFee: 1,
      enabled: true,
    },
  ]);

  await db.insert(reconciliationBatchTable).values([
    {
      id: batchIdEast,
      name: '2025-02 顺丰华东账单',
      courier: '顺丰',
      reconciliationMonth: '2025-02',
      status: 'processing',
      ...buildBatchSummary(batchIdEast),
    },
    {
      id: batchIdNorth,
      name: '2025-01 京东华北账单',
      courier: '京东',
      reconciliationMonth: '2025-01',
      status: 'completed',
      ...buildBatchSummary(batchIdNorth),
    },
  ]);

  await db.insert(orderDetailTable).values(orders);
}

seed()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('Seed failed:', error);
    process.exit(1);
  });
