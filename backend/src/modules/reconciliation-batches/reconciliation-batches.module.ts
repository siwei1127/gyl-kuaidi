import { Module } from '@nestjs/common';

import { ReconciliationBatchesController } from './reconciliation-batches.controller';
import { ReconciliationBatchesService } from './reconciliation-batches.service';

@Module({
  controllers: [ReconciliationBatchesController],
  providers: [ReconciliationBatchesService],
  exports: [ReconciliationBatchesService],
})
export class ReconciliationBatchesModule {}
