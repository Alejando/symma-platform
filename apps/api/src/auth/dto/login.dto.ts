import { IsEmail, IsNotEmpty, IsString } from 'class-validator';
import type { LoginRequest } from '@symma/shared-types';

export class LoginDto implements LoginRequest {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  password: string;
}
