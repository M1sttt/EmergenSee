import {
    IsString,
    IsNotEmpty,
    IsOptional,
    IsArray,
    IsIn,
    IsInt,
    Min,
    ArrayMinSize,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { SHELTER_CATEGORIES } from '@emergensee/shared';
import type { ShelterCategory, ShelterPolygon } from '@emergensee/shared';

export class CreateDepartmentShelterDto {
    @IsString()
    @IsNotEmpty()
    @ApiProperty({ description: 'The name of the shelter', example: 'North wing basement' })
    name!: string;

    @IsString()
    @IsOptional()
    @ApiProperty({ description: 'Extra details about the shelter', required: false })
    description?: string;

    @IsIn(SHELTER_CATEGORIES as unknown as string[])
    @ApiProperty({ description: 'The shelter category', enum: SHELTER_CATEGORIES, example: 'missile' })
    category!: ShelterCategory;

    @IsInt()
    @Min(0)
    @IsOptional()
    @ApiProperty({ description: 'How many people the shelter holds', required: false, example: 40 })
    capacity?: number;

    @IsString()
    @IsNotEmpty()
    @ApiProperty({ description: 'The department that owns the shelter', example: '65f1c2...' })
    departmentId!: string;

    @IsArray()
    @ArrayMinSize(3)
    @ApiProperty({
        description: 'Polygon ring as [latitude, longitude] pairs',
        example: [[32.08, 34.78], [32.081, 34.78], [32.081, 34.781]],
    })
    polygon!: ShelterPolygon;
}

export class UpdateDepartmentShelterDto {
    @IsString()
    @IsOptional()
    @ApiProperty({ description: 'The name of the shelter', required: false })
    name?: string;

    @IsString()
    @IsOptional()
    @ApiProperty({ description: 'Extra details about the shelter', required: false })
    description?: string;

    @IsIn(SHELTER_CATEGORIES as unknown as string[])
    @IsOptional()
    @ApiProperty({ description: 'The shelter category', required: false, enum: SHELTER_CATEGORIES })
    category?: ShelterCategory;

    @IsInt()
    @Min(0)
    @IsOptional()
    @ApiProperty({ description: 'How many people the shelter holds', required: false })
    capacity?: number;

    @IsArray()
    @ArrayMinSize(3)
    @IsOptional()
    @ApiProperty({ description: 'Polygon ring as [latitude, longitude] pairs', required: false })
    polygon?: ShelterPolygon;
}
