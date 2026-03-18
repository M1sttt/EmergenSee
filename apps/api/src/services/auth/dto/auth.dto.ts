import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';
import { LoginDto, RegisterDto, UserRole, UserStatus } from '@emergensee/shared';

export class LoginRequestDto implements LoginDto {
  @ApiProperty({ example: 'dispatcher@emergensee.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'StrongPass123!' })
  @IsString()
  @MinLength(1)
  password: string;
}

export class RegisterRequestDto implements RegisterDto {
  @ApiProperty({ example: 'responder@emergensee.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'StrongPass123!' })
  @IsString()
  @MinLength(8)
  password: string;

  @ApiProperty({ example: 'StrongPass123!' })
  @IsString()
  @MinLength(8)
  confirmPassword: string;

  @ApiProperty({ example: 'Dana' })
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @ApiProperty({ example: 'Levi' })
  @IsString()
  @IsNotEmpty()
  lastName: string;
}

export class GoogleTokenRequestDto {
  @ApiProperty({
    description: 'ID token from Google Identity Services (`credential` field)',
  })
  @IsString()
  @IsNotEmpty()
  credential: string;
}

export class RefreshTokenRequestDto {
  @ApiProperty({
    description: 'Refresh token returned by login/registration',
  })
  @IsString()
  @IsNotEmpty()
  refreshToken: string;
}

export class UserResponseDto {
  @ApiProperty({ example: '65fc823ecce232f9750349ce' })
  id: string;

  @ApiProperty({ example: 'dispatcher@emergensee.com' })
  email: string;

  @ApiProperty({ example: 'Dana' })
  firstName: string;

  @ApiProperty({ example: 'Levi' })
  lastName: string;

  @ApiProperty({ enum: UserRole, example: UserRole.FIELD_RESPONDER })
  role: UserRole;

  @ApiProperty({ enum: UserStatus, example: UserStatus.ACTIVE })
  status: UserStatus;

  @ApiPropertyOptional({ example: '+972501234567' })
  phoneNumber?: string;

  @ApiPropertyOptional({ example: 'R-2041' })
  badgeNumber?: string;

  @ApiPropertyOptional({ example: 'North District' })
  department?: string;

  @ApiProperty({ example: '2026-03-18T08:20:01.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2026-03-18T08:20:01.000Z' })
  updatedAt: Date;
}

export class AuthResponseDto {
  @ApiProperty()
  accessToken: string;

  @ApiProperty()
  refreshToken: string;

  @ApiProperty({ type: UserResponseDto })
  user: UserResponseDto;
}

export class RefreshTokenResponseDto {
  @ApiProperty()
  accessToken: string;
}
