import { ApiProperty } from '@nestjs/swagger';
import { LIMITS, type LoginRequest } from '@ds/contracts';
import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';
import { Trim } from '../../../common/utils/text';

export class LoginDto implements LoginRequest {
  @ApiProperty({ example: 'admin@example.com' })
  @Trim()
  @IsEmail()
  @MaxLength(LIMITS.emailMax)
  email: string;

  @ApiProperty({ format: 'password' })
  @IsString()
  @MinLength(1)
  @MaxLength(256)
  password: string;
}
