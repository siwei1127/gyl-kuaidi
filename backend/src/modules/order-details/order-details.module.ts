import { Module } from '@nestjs/common';

import { ReconciliationBatchesModule } from '../reconciliation-batches/reconciliation-batches.module';
import { OrderDetailsController } from './order-details.controller';
import { OrderDetailsService } from './order-details.service';

@Module({
  imports: [ReconciliationBatchesModule],
  controllers: [OrderDetailsController],
  providers: [OrderDetailsService],
})
export class OrderDetailsModule {}
