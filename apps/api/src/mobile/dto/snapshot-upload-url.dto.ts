import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsNotEmpty, IsString, IsUUID } from 'class-validator';
import type {
  SnapshotContentType,
  SnapshotUploadUrlRequest,
} from '@symma/shared-types';
import { SNAPSHOT_CONTENT_TYPE } from '../../storage/snapshot-key';

export class SnapshotUploadUrlDto implements SnapshotUploadUrlRequest {
  @ApiProperty({
    description: 'Client-generated id of the session being recorded',
  })
  @IsUUID()
  sessionId: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  exerciseId: string;

  @ApiProperty({ enum: [SNAPSHOT_CONTENT_TYPE] })
  @IsIn([SNAPSHOT_CONTENT_TYPE])
  contentType: SnapshotContentType;
}
