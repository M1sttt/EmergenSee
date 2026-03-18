import {
    IsString,
    IsEnum,
    IsNumber,
    IsArray,
    IsOptional,
    IsNotEmpty,
    ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ResponderStatus } from '@emergensee/shared';
import { ApiProperty } from '@nestjs/swagger';

export class ResponderLocationDto {
    @IsString()
    @IsNotEmpty()
    @ApiProperty({ description: 'The type of location', example: 'Point' })
    type!: 'Point';

    @IsArray()
    @IsNumber({}, { each: true })
    @ApiProperty({ description: 'The coordinates of the location [longitude, latitude]', example: [34.7818, 32.0853] })
    coordinates!: [number, number];
}

export class CreateStatusUpdateDto {
    @IsEnum(ResponderStatus)
    @ApiProperty({ description: 'The status of the responder', enum: ResponderStatus, example: ResponderStatus.AVAILABLE })
    status!: ResponderStatus;

    @ValidateNested()
    @Type(() => ResponderLocationDto)
    @IsOptional()
    @ApiProperty({ description: 'The location of the responder', required: false })
    location?: ResponderLocationDto;

    @IsString()
    @IsOptional()
    @ApiProperty({ description: 'The ID of the event the responder is assigned to', required: false, example: 'event123' })
    eventId?: string;

    @IsString()
    @IsOptional()
    @ApiProperty({ description: 'Any notes provided by the responder', required: false, example: 'On my way' })
    notes?: string;
}

export class UpdateStatusUpdateDto {
    @IsEnum(ResponderStatus)
    @IsOptional()
    @ApiProperty({ description: 'The status of the responder', required: false, enum: ResponderStatus, example: ResponderStatus.AVAILABLE })
    status?: ResponderStatus;

    @ValidateNested()
    @Type(() => ResponderLocationDto)
    @IsOptional()
    @ApiProperty({ description: 'The location of the responder', required: false })
    location?: ResponderLocationDto;

    @IsString()
    @IsOptional()
    @ApiProperty({ description: 'The ID of the event the responder is assigned to', required: false, example: 'event123' })
    eventId?: string;

    @IsString()
    @IsOptional()
    @ApiProperty({ description: 'Any notes provided by the responder', required: false, example: 'Arrived at scene' })
    notes?: string;
}
