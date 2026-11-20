import { ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SnapshotStorage } from './snapshot-storage.service';

describe('SnapshotStorage', () => {
  const storageWith = (values: Record<string, string>) =>
    new SnapshotStorage({
      get: (name: string) => values[name],
    } as unknown as ConfigService);

  const minio = {
    S3_ENDPOINT: 'http://localhost:9000',
    S3_REGION: 'us-east-1',
    S3_BUCKET: 'symma-snapshots',
    S3_ACCESS_KEY_ID: 'access-key',
    S3_SECRET_ACCESS_KEY: 'secret-key',
    S3_FORCE_PATH_STYLE: 'true',
  };

  it('is unavailable without credentials, and refuses upload URLs', async () => {
    const storage = storageWith({});

    expect(storage.isAvailable()).toBe(false);
    await expect(
      storage.createUploadUrl('snapshots/a.jpg', 'image/jpeg'),
    ).rejects.toThrow(ServiceUnavailableException);
    await expect(storage.createReadUrl('snapshots/a.jpg')).resolves.toBeNull();
  });

  it('signs a short-lived PUT bound to the content type', async () => {
    const url = new URL(
      await storageWith(minio).createUploadUrl(
        'snapshots/p/s/e.jpg',
        'image/jpeg',
      ),
    );

    expect(url.origin).toBe('http://localhost:9000');
    expect(url.pathname).toBe('/symma-snapshots/snapshots/p/s/e.jpg');
    expect(url.searchParams.get('X-Amz-Expires')).toBe('300');
    expect(url.searchParams.get('X-Amz-SignedHeaders')).toContain(
      'content-type',
    );
  });

  it('signs a GET for a stored key and returns null without one', async () => {
    const storage = storageWith(minio);

    const url = new URL((await storage.createReadUrl('snapshots/p/s/e.jpg'))!);

    expect(url.searchParams.get('X-Amz-Signature')).toBeTruthy();
    await expect(storage.createReadUrl(null)).resolves.toBeNull();
  });
});
