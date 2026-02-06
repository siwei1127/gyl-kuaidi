export type BatchStatus = 'draft' | 'processing' | 'completed' | 'archived';

export interface PaginationQuery {
  page?: number;
  limit?: number;
}

export interface ReconciliationBatchListQuery extends PaginationQuery {
  status?: BatchStatus;
  courier?: string;
}

export interface ReconciliationBatchListItem {
  id: string;
  name: string;
  courier: string;
  totalDifference: number;
  exceptionCount: number;
  pendingExceptionCount: number;
  status: BatchStatus;
  createdAt: string;
}

export interface CreateReconciliationBatchBody {
  name: string;
  courier: string;
  reconciliationMonth: string;
}

export interface CreateReconciliationBatchResponse {
  id: string;
}

export interface UpdateBatchStatusBody {
  status: 'archived';
}

export interface UpdateBatchStatusResponse {
  success: boolean;
}

export type ExceptionConclusion = 'pending' | 'approved' | 'rejected';

export interface OrderExceptionsQuery extends PaginationQuery {
  courier?: string;
  exceptionType?: string;
  minDiff?: number;
  maxDiff?: number;
  conclusion?: ExceptionConclusion;
}

export interface ExceptionOrderItem {
  waybillNumber: string;
  courier: string;
  province: string;
  shippingDate: string;
  totalDifference: number;
  exceptionTypes: string[];
  conclusion: ExceptionConclusion;
  processingNote: string | null;
}

export interface OrderExceptionsResponse {
  items: ExceptionOrderItem[];
  total: number;
}

export interface BatchUpdateOrdersBody {
  waybillNumbers: string[];
  conclusion: ExceptionConclusion;
  processingNote?: string;
}

export interface BatchUpdateOrdersResponse {
  success: boolean;
  updatedCount: number;
}

export interface PricingRuleListQuery {
  courier?: string;
  enabled?: boolean;
}

export interface PricingRuleItem {
  id: string;
  name: string;
  courier: string;
  firstWeight: number;
  firstWeightPrice: number;
  extraWeightPrice: number;
  baseOperationFee: number;
  toleranceExpressFee: number;
  tolerancePackagingFee: number;
  enabled: boolean;
}

export interface CreatePricingRuleBody {
  name: string;
  courier: string;
  firstWeight: number;
  firstWeightPrice: number;
  extraWeightPrice: number;
  baseOperationFee: number;
  toleranceExpressFee: number;
  tolerancePackagingFee: number;
}

export interface CreatePricingRuleResponse {
  id: string;
}

export interface UpdatePricingRuleBody {
  name?: string;
  courier?: string;
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
