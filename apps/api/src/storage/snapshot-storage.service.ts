import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

export const SNAPSHOT_URL_TTL_SECONDS = 300;

interface StorageSettings {
  client: S3Client;
  bucket: string;
}

@Injectable()
export class SnapshotStorage {
  private readonly settings: StorageSettings | null;

  constructor(configService: ConfigService) {
    this.settings = readStorageSettings(configService);
  }

  isAvailable(): boolean {
    return this.settings !== null;
  }

  async createUploadUrl(key: string, contentType: string): Promise<string> {
    const { client, bucket } = this.requireSettings();
    return getSignedUrl(
      client,
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        ContentType: contentType,
      }),
      {
        expiresIn: SNAPSHOT_URL_TTL_SECONDS,
        signableHeaders: new Set(['content-type']),
      },
    );
  }

  async createReadUrl(key: string | null): Promise<string | null> {
    if (!key || !this.settings) {
      return null;
    }
    const { client, bucket } = this.settings;
    return getSignedUrl(
      client,
      new GetObjectCommand({ Bucket: bucket, Key: key }),
      { expiresIn: SNAPSHOT_URL_TTL_SECONDS },
    );
  }

  private requireSettings(): StorageSettings {
    if (!this.settings) {
      throw new ServiceUnavailableException('errors.storage.unavailable');
    }
    return this.settings;
  }
}

function readStorageSettings(
  configService: ConfigService,
): StorageSettings | null {
  const read = (name: string) =>
    configService.get<string>(name)?.trim() || undefined;
  const region = read('S3_REGION');
  const bucket = read('S3_BUCKET');
  const accessKeyId = read('S3_ACCESS_KEY_ID');
  const secretAccessKey = read('S3_SECRET_ACCESS_KEY');

  if (!region || !bucket || !accessKeyId || !secretAccessKey) {
    return null;
  }

  return {
    bucket,
    client: new S3Client({
      region,
      endpoint: read('S3_ENDPOINT'),
      forcePathStyle: read('S3_FORCE_PATH_STYLE') === 'true',
      credentials: { accessKeyId, secretAccessKey },
    }),
  };
}
