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
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { StatusService } from './status.service';
import { UserRole } from '@emergensee/shared';
import { CreateStatusUpdateDto, UpdateStatusUpdateDto } from './status.dto';

@ApiTags('Status')
@ApiBearerAuth('access-token')
@Controller('status')
@UseGuards(JwtAuthGuard, RolesGuard)
export class StatusController {
  constructor(private readonly statusService: StatusService) { }

  @ApiOperation({ summary: 'Create a status update for the current user' })
  @Post()
  @Roles(UserRole.ADMIN, UserRole.DISPATCHER, UserRole.FIELD_RESPONDER)
  create(@Request() req, @Body() createStatusUpdateDto: CreateStatusUpdateDto) {
    return this.statusService.create(req.user.userId, createStatusUpdateDto);
  }

  @ApiOperation({ summary: 'List status updates' })
  @Get()
  @Roles(UserRole.ADMIN, UserRole.DISPATCHER)
  findAll() {
    return this.statusService.findAll();
  }

  @ApiOperation({ summary: 'Get status updates by user id' })
  @ApiParam({ name: 'userId', description: 'User id' })
  @Get('user/:userId')
  @Roles(UserRole.ADMIN, UserRole.DISPATCHER)
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
  @Roles(UserRole.ADMIN, UserRole.DISPATCHER)
  update(@Param('id') id: string, @Body() updateStatusUpdateDto: UpdateStatusUpdateDto) {
    return this.statusService.update(id, updateStatusUpdateDto);
  }

  @ApiOperation({ summary: 'Delete status update by id' })
  @ApiParam({ name: 'id', description: 'Status update id' })
  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.DISPATCHER)
  remove(@Param('id') id: string) {
    return this.statusService.remove(id);
  }
}
