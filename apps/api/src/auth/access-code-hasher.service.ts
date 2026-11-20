import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { hashAccessCode } from './access-code';

@Injectable()
export class AccessCodeHasher {
  private readonly secret: string;

  constructor(configService: ConfigService) {
    this.secret = configService.getOrThrow<string>('PIN_HMAC_SECRET');
  }

  hash(accessCode: string): string {
    return hashAccessCode(accessCode, this.secret);
  }
}
