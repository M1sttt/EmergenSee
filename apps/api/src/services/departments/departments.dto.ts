import {
    IsString,
    IsNotEmpty,
    IsOptional,
    IsArray,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateDepartmentDto {
    @IsString()
    @IsNotEmpty()
    @ApiProperty({ description: 'The name of the department', example: 'Engineering' })
    name!: string;

    @IsString()
    @IsNotEmpty()
    @ApiProperty({ description: 'The description of the department', example: 'Engineering department' })
    description!: string;

    @IsArray()
    @IsString({ each: true })
    @IsOptional()
    @ApiProperty({ description: 'The admins of the department (user IDs)', required: false, type: [String] })
    admins?: string[];

    @IsArray()
    @IsString({ each: true })
    @IsOptional()
    @ApiProperty({ description: 'The sub-departments (department IDs)', required: false, type: [String] })
    subDepartments?: string[];
}

export class UpdateDepartmentDto {
    @IsString()
    @IsOptional()
    @ApiProperty({ description: 'The name of the department', required: false, example: 'Engineering' })
    name?: string;

    @IsString()
    @IsOptional()
    @ApiProperty({ description: 'The description of the department', required: false, example: 'Engineering department' })
    description?: string;

    @IsArray()
    @IsString({ each: true })
    @IsOptional()
    @ApiProperty({ description: 'The admins of the department (user IDs)', required: false, type: [String] })
    admins?: string[];

    @IsArray()
    @IsString({ each: true })
    @IsOptional()
    @ApiProperty({ description: 'The sub-departments (department IDs)', required: false, type: [String] })
    subDepartments?: string[];
}
