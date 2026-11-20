import { Module } from '@nestjs/common';
import { SnapshotStorage } from './snapshot-storage.service';

@Module({
  providers: [SnapshotStorage],
  exports: [SnapshotStorage],
})
export class StorageModule {}
