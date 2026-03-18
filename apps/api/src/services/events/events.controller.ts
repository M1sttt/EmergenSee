import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { EventsService } from './events.service';
import { UserRole } from '@emergensee/shared';
import { CreateEventDto, UpdateEventDto } from './events.dto';

@ApiTags('Events')
@ApiBearerAuth('access-token')
@Controller('events')
@UseGuards(JwtAuthGuard, RolesGuard)
export class EventsController {
  constructor(private readonly eventsService: EventsService) { }

  @ApiOperation({ summary: 'Create a new event' })
  @Post()
  @Roles(UserRole.ADMIN, UserRole.DISPATCHER)
  create(@Body() createEventDto: CreateEventDto) {
    return this.eventsService.create(createEventDto);
  }

  @ApiOperation({ summary: 'List events' })
  @Get()
  findAll() {
    return this.eventsService.findAll();
  }

  @ApiOperation({ summary: 'Find nearby events by coordinates' })
  @ApiQuery({ name: 'longitude', required: true, type: String, example: '34.7818' })
  @ApiQuery({ name: 'latitude', required: true, type: String, example: '32.0853' })
  @ApiQuery({ name: 'maxDistance', required: false, type: String, example: '5000' })
  @Get('nearby')
  findNearby(
    @Query('longitude') longitude: string,
    @Query('latitude') latitude: string,
    @Query('maxDistance') maxDistance?: string,
  ) {
    return this.eventsService.findNearby(
      parseFloat(longitude),
      parseFloat(latitude),
      maxDistance ? parseFloat(maxDistance) : undefined,
    );
  }

  @ApiOperation({ summary: 'Get event by id' })
  @ApiParam({ name: 'id', description: 'Event id' })
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.eventsService.findOne(id);
  }

  @ApiOperation({ summary: 'Update event by id' })
  @ApiParam({ name: 'id', description: 'Event id' })
  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.DISPATCHER)
  update(@Param('id') id: string, @Body() updateEventDto: UpdateEventDto) {
    return this.eventsService.update(id, updateEventDto);
  }

  @ApiOperation({ summary: 'Delete event by id' })
  @ApiParam({ name: 'id', description: 'Event id' })
  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.DISPATCHER)
  remove(@Param('id') id: string) {
    return this.eventsService.remove(id);
  }
}
