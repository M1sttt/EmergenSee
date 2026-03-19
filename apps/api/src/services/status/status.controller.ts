import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { StatusService } from './status.service';
import { CreateStatusUpdateDto, UpdateStatusUpdateDto } from './status.dto';

@ApiTags('Status')
@ApiBearerAuth('access-token')
@Controller('status')
@UseGuards(JwtAuthGuard)
export class StatusController {
  constructor(private readonly statusService: StatusService) { }

  @ApiOperation({ summary: 'Create a status update for the current user' })
  @Post()
  create(@Request() req, @Body() createStatusUpdateDto: CreateStatusUpdateDto) {
    return this.statusService.create(createStatusUpdateDto.userId || req.user.userId, createStatusUpdateDto);
  }

  @ApiOperation({ summary: 'List status updates' })
  @Get()
  findAll() {
    return this.statusService.findAll();
  }

  @ApiOperation({ summary: 'Get status updates by user id' })
  @ApiParam({ name: 'userId', description: 'User id' })
  @Get('user/:userId')
  findByUser(@Param('userId') userId: string) {
    return this.statusService.findByUser(userId);
  }

  @ApiOperation({ summary: 'Get latest status update by user id' })
  @ApiParam({ name: 'userId', description: 'User id' })
  @Get('user/:userId/latest')
  findLatestByUser(@Param('userId') userId: string) {
    return this.statusService.findLatestByUser(userId);
  }

  @ApiOperation({ summary: 'Get status update by id' })
  @ApiParam({ name: 'id', description: 'Status update id' })
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.statusService.findOne(id);
  }

  @ApiOperation({ summary: 'Update status update by id' })
  @ApiParam({ name: 'id', description: 'Status update id' })
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateStatusUpdateDto: UpdateStatusUpdateDto) {
    return this.statusService.update(id, updateStatusUpdateDto);
  }

  @ApiOperation({ summary: 'Delete status update by id' })
  @ApiParam({ name: 'id', description: 'Status update id' })
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.statusService.remove(id);
  }
}
