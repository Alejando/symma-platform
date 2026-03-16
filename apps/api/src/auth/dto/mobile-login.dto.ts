import { IsString, IsNotEmpty, Length, Matches } from 'class-validator';
import type { MobileLoginRequest } from '@symma/shared-types';

export class MobileLoginDto implements MobileLoginRequest {
  @IsString()
  @IsNotEmpty()
  @Length(6, 6)
  @Matches(/^\d{6}$/, { message: 'Access code must be a 6-digit number' })
  accessCode: string;
}
