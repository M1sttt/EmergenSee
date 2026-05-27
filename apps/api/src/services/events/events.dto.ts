import {
    IsString,
    IsEnum,
    IsNumber,
    IsArray,
    IsOptional,
    IsNotEmpty,
    ValidateNested,
    IsDate,
} from 'class-validator';
import { Type } from 'class-transformer';
import { EventType, EventPriority, EventStatus } from '@emergensee/shared';
import { ApiProperty } from '@nestjs/swagger';

export class LocationDto {
    @IsString()
    @IsNotEmpty()
    @ApiProperty({ description: 'The type of location', example: 'Point' })
    type!: 'Point';

    @IsArray()
    @IsNumber({}, { each: true })
    @ApiProperty({ description: 'The coordinates of the location [longitude, latitude]', example: [34.7818, 32.0853] })
    coordinates!: [number, number];
}

export class CreateEventDto {
    @IsEnum(EventType)
    @ApiProperty({ description: 'The type of the event', enum: EventType, example: EventType.FIRE })
    type!: EventType;

    @IsEnum(EventPriority)
    @ApiProperty({ description: 'The priority of the event', enum: EventPriority, example: EventPriority.HIGH })
    priority!: EventPriority;

    @IsString()
    @IsNotEmpty()
    @ApiProperty({ description: 'The title of the event', example: 'Building Fire' })
    title!: string;

    @IsString()
    @IsNotEmpty()
    @ApiProperty({ description: 'The description of the event', example: 'A large fire in an office building' })
    description!: string;

    @ValidateNested()
    @Type(() => LocationDto)
    @ApiProperty({ description: 'The location of the event' })
    location!: LocationDto;

    @IsString()
    @IsOptional()
    @ApiProperty({ description: 'The user ID who reported the event', required: false, example: 'user123' })
    reportedBy?: string;

    @IsArray()
    @IsString({ each: true })
    @ApiProperty({ description: 'The departments associated with the event', type: [String] })
    departments!: string[];
}

export class UpdateEventDto {
    @IsEnum(EventType)
    @IsOptional()
    @ApiProperty({ description: 'The type of the event', required: false, enum: EventType, example: EventType.FIRE })
    type?: EventType;

    @IsEnum(EventPriority)
    @IsOptional()
    @ApiProperty({ description: 'The priority of the event', required: false, enum: EventPriority, example: EventPriority.HIGH })
    priority?: EventPriority;

    @IsEnum(EventStatus)
    @IsOptional()
    @ApiProperty({ description: 'The status of the event', required: false, enum: EventStatus, example: EventStatus.ONGOING })
    status?: EventStatus;

    @IsString()
    @IsOptional()
    @ApiProperty({ description: 'The title of the event', required: false, example: 'Building Fire' })
    title?: string;

    @IsString()
    @IsOptional()
    @ApiProperty({ description: 'The description of the event', required: false, example: 'A large fire in an office building' })
    description?: string;

    @ValidateNested()
    @Type(() => LocationDto)
    @IsOptional()
    @ApiProperty({ description: 'The location of the event', required: false })
    location?: LocationDto;

    @IsArray()
    @IsString({ each: true })
    @IsOptional()
    @ApiProperty({ description: 'The IDs of users assigned to the event', required: false, example: ['user1', 'user2'] })
    assignedTo?: string[];

    @IsDate()
    @Type(() => Date)
    @IsOptional()
    @ApiProperty({ description: 'The resolved timestamp of the event', required: false })
    resolvedAt?: Date;

    @IsArray()
    @IsString({ each: true })
    @IsOptional()
    @ApiProperty({ description: 'The departments associated with the event', required: false, type: [String] })
    departments?: string[];
}
