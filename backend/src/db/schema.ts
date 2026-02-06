import {
  boolean,
  doublePrecision,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';

export const batchStatusEnum = pgEnum('batch_status', [
  'draft',
  'processing',
  'completed',
  'archived',
]);

export const pricingRuleTable = pgTable('pricing_rule', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  courier: text('courier').notNull(),
  firstWeight: doublePrecision('first_weight').notNull(),
  firstWeightPrice: doublePrecision('first_weight_price').notNull(),
  extraWeightPrice: doublePrecision('extra_weight_price').notNull(),
  baseOperationFee: doublePrecision('base_operation_fee').notNull(),
  toleranceExpressFee: doublePrecision('tolerance_express_fee').notNull(),
  tolerancePackagingFee: doublePrecision('tolerance_packaging_fee').notNull(),
  enabled: boolean('enabled').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const reconciliationBatchTable = pgTable('reconciliation_batch', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  courier: text('courier').notNull(),
  reconciliationMonth: text('reconciliation_month').notNull(),
  totalDifference: doublePrecision('total_difference').notNull().default(0),
  exceptionCount: integer('exception_count').notNull().default(0),
  pendingExceptionCount: integer('pending_exception_count').notNull().default(0),
  status: batchStatusEnum('status').notNull().default('draft'),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const orderDetailTable = pgTable('order_detail', {
  id: uuid('id').primaryKey().defaultRandom(),
  batchId: uuid('batch_id')
    .notNull()
    .references(() => reconciliationBatchTable.id),
  waybillNumber: text('waybill_number').notNull(),
  courier: text('courier').notNull(),
  province: text('province').notNull(),
  shippingDate: timestamp('shipping_date', { withTimezone: true }).notNull(),
  totalDifference: doublePrecision('total_difference').notNull().default(0),
  exceptionTypes: text('exception_types').array().notNull().default([]),
  conclusion: text('conclusion').notNull().default('pending'),
  processingNote: text('processing_note'),
  rawData: jsonb('raw_data').$type<Record<string, unknown> | null>(),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
});
