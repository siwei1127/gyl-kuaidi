/**
 * Frontend/Backend shared API contracts.
 *
 * Keep this file as the single source of truth for:
 * - request query/body shapes
 * - response payload shapes
 */

// -----------------------------
// Common
// -----------------------------

export type ISODateString = string; // e.g. 2026-02-06
export type YearMonthString = string; // e.g. 2026-02

export interface PageQuery {
  page?: number;
  limit?: number;
}

export type CourierCode = string;

// -----------------------------
// Pricing Rules
// -----------------------------

export interface PricingRuleDto {
  id: string;
  name: string;
  courier: CourierCode;
  firstWeight: number;
  firstWeightPrice: number;
  extraWeightPrice: number;
  baseOperationFee: number;
  toleranceExpressFee: number;
  tolerancePackagingFee: number;
  enabled: boolean;
}

export interface GetPricingRulesQuery {
  courier?: CourierCode;
  enabled?: boolean;
}

export type GetPricingRulesResponse = PricingRuleDto[];

export interface CreatePricingRuleBody {
  name: string;
  courier: CourierCode;
  firstWeight: number;
  firstWeightPrice: number;
  extraWeightPrice: number;
  baseOperationFee: number;
  toleranceExpressFee: number;
  tolerancePackagingFee: number;
  // ... other packaging fields can be extended later
}

export interface CreatePricingRuleResponse {
  id: string;
}

export interface UpdatePricingRuleBody {
  name?: string;
  firstWeight?: number;
  firstWeightPrice?: number;
  extraWeightPrice?: number;
  baseOperationFee?: number;
  toleranceExpressFee?: number;
  tolerancePackagingFee?: number;
  enabled?: boolean;
}

export interface UpdatePricingRuleResponse {
  success: boolean;
}

// -----------------------------
// Reconciliation Batches
// -----------------------------

export type ReconciliationBatchStatus = 'draft' | 'processing' | 'archived' | (string & {});

export interface ReconciliationBatchListItemDto {
  id: string;
  name: string;
  courier: CourierCode;
  totalDifference: number;
  exceptionCount: number;
  pendingExceptionCount: number;
  status: ReconciliationBatchStatus;
  createdAt: ISODateString;
}

export interface GetReconciliationBatchesQuery extends PageQuery {
  status?: ReconciliationBatchStatus;
  courier?: CourierCode;
}

export type GetReconciliationBatchesResponse = ReconciliationBatchListItemDto[];

export interface CreateReconciliationBatchBody {
  name: string;
  courier: CourierCode;
  reconciliationMonth: YearMonthString; // YYYY-MM
}

export interface CreateReconciliationBatchResponse {
  id: string;
}

export interface UpdateReconciliationBatchStatusBody {
  status: 'archived';
}

export interface UpdateReconciliationBatchStatusResponse {
  success: boolean;
}

// -----------------------------
// Order Details - Exceptions Workbench
// -----------------------------

export type ExceptionTypeCode = string;
export type OrderConclusion = 'pending' | 'accepted' | 'rejected' | 'ignored' | (string & {});

export interface OrderExceptionItemDto {
  waybillNumber: string;
  courier: CourierCode;
  province: string;
  shippingDate: ISODateString;
  totalDifference: number;
  exceptionTypes: ExceptionTypeCode[];
  conclusion: OrderConclusion;
  processingNote: string;
}

export interface GetOrderDetailExceptionsQuery extends PageQuery {
  courier?: CourierCode;
  exceptionType?: ExceptionTypeCode;
  minDiff?: number;
  maxDiff?: number;
  conclusion?: OrderConclusion;
}

export interface GetOrderDetailExceptionsResponse {
  items: OrderExceptionItemDto[];
  total: number;
}

export interface BatchUpdateOrderDetailsBody {
  waybillNumbers: string[];
  conclusion: OrderConclusion;
  processingNote?: string;
}

export interface BatchUpdateOrderDetailsResponse {
  success: boolean;
  updatedCount: number;
}

