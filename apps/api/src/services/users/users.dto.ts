import {
    IsString,
    IsEmail,
    MinLength,
    IsNotEmpty,
    IsOptional,
    IsEnum,
} from 'class-validator';
import { UserRole, UserStatus } from '@emergensee/shared';
import { ApiProperty } from '@nestjs/swagger';

export class CreateUserDto {
    @IsEmail()
    @IsOptional()
    @ApiProperty({ description: 'The email of the user', required: false, example: 'user@example.com' })
    email?: string;

    @IsString()
    @MinLength(6)
    @ApiProperty({ description: 'The password of the user', minLength: 6, example: 'password123' })
    password!: string;

    @IsString()
    @IsNotEmpty()
    @IsOptional()
    @ApiProperty({ description: 'The first name of the user', required: false, example: 'John' })
    firstName?: string;

    @IsString()
    @IsNotEmpty()
    @IsOptional()
    @ApiProperty({ description: 'The last name of the user', required: false, example: 'Doe' })
    lastName?: string;

    @IsEnum(UserRole)
    @ApiProperty({ description: 'The role of the user', enum: UserRole, example: UserRole.VIEWER })
    role!: UserRole;

    @IsString()
    @IsOptional()
    @ApiProperty({ description: 'The phone number of the user', required: false, example: '+1234567890' })
    phoneNumber?: string;

    @IsString({ each: true })
    @IsOptional()
    @ApiProperty({ description: 'The departments of the user', required: false, type: [String] })
    departments?: string[];

    @IsString()
    @IsOptional()
    @ApiProperty({ description: 'Physical location label for camera-role users', required: false, example: 'Main Entrance' })
    location?: string;
}

export class UpdateUserDto {
    @IsEmail()
    @IsOptional()
    @ApiProperty({ description: 'The email of the user', required: false, example: 'user@example.com' })
    email?: string;

    @IsString()
    @MinLength(6)
    @IsOptional()
    @ApiProperty({ description: 'The password of the user', minLength: 6, required: false, example: 'password123' })
    password?: string;

    @IsString()
    @IsOptional()
    @ApiProperty({ description: 'The first name of the user', required: false, example: 'John' })
    firstName?: string;

    @IsString()
    @IsOptional()
    @ApiProperty({ description: 'The last name of the user', required: false, example: 'Doe' })
    lastName?: string;

    @IsEnum(UserRole)
    @IsOptional()
    @ApiProperty({ description: 'The role of the user', required: false, enum: UserRole, example: UserRole.VIEWER })
    role?: UserRole;

    @IsEnum(UserStatus)
    @IsOptional()
    @ApiProperty({ description: 'The status of the user', required: false, enum: UserStatus, example: UserStatus.ACTIVE })
    status?: UserStatus;

    @IsString()
    @IsOptional()
    @ApiProperty({ description: 'The phone number of the user', required: false, example: '+1234567890' })
    phoneNumber?: string;

    @IsString({ each: true })
    @IsOptional()
    @ApiProperty({ description: 'The departments of the user', required: false, type: [String] })
    departments?: string[];

    @IsString()
    @IsOptional()
    @ApiProperty({ description: 'Physical location label for camera-role users', required: false, example: 'Main Entrance' })
    location?: string;

    @IsString()
    @IsOptional()
    @ApiProperty({ description: 'Face recognition identity slug (set by face registration flow)', required: false, example: 'john_doe' })
    faceIdentity?: string;
}
