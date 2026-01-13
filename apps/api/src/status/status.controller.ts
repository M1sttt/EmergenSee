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
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { StatusService } from './status.service';
import { CreateStatusUpdateDto, UpdateStatusUpdateDto, UserRole } from '@emergensee/shared';

@Controller('status')
@UseGuards(JwtAuthGuard, RolesGuard)
export class StatusController {
  constructor(private readonly statusService: StatusService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.DISPATCHER, UserRole.FIELD_RESPONDER)
  create(@Request() req, @Body() createStatusUpdateDto: CreateStatusUpdateDto) {
    return this.statusService.create(req.user.userId, createStatusUpdateDto);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.DISPATCHER)
  findAll() {
    return this.statusService.findAll();
  }

  @Get('user/:userId')
  @Roles(UserRole.ADMIN, UserRole.DISPATCHER)
  findByUser(@Param('userId') userId: string) {
    return this.statusService.findByUser(userId);
  }

  @Get('user/:userId/latest')
  findLatestByUser(@Param('userId') userId: string) {
    return this.statusService.findLatestByUser(userId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.statusService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.DISPATCHER)
  update(@Param('id') id: string, @Body() updateStatusUpdateDto: UpdateStatusUpdateDto) {
    return this.statusService.update(id, updateStatusUpdateDto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.DISPATCHER)
  remove(@Param('id') id: string) {
    return this.statusService.remove(id);
  }
}
