import { Module } from '@nestjs/common';

import { OrderDetailsModule } from './modules/order-details/order-details.module';
import { PricingRulesModule } from './modules/pricing-rules/pricing-rules.module';
import { ReconciliationBatchesModule } from './modules/reconciliation-batches/reconciliation-batches.module';

@Module({
  imports: [
    PricingRulesModule,
    ReconciliationBatchesModule,
    OrderDetailsModule,
  ],
})
export class AppModule {}
