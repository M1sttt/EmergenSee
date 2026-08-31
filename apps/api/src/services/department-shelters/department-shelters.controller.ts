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
import { ApiBearerAuth, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { DepartmentSheltersService, RequestingUser } from './department-shelters.service';
import { CreateDepartmentShelterDto, UpdateDepartmentShelterDto } from './department-shelters.dto';

@ApiTags('Department Shelters')
@ApiBearerAuth('access-token')
@Controller('department-shelters')
@UseGuards(JwtAuthGuard)
export class DepartmentSheltersController {
  constructor(private readonly departmentSheltersService: DepartmentSheltersService) { }

  @ApiOperation({ summary: 'List shelters of the departments the current user is linked to' })
  @ApiResponse({ status: 200, description: 'Return the visible department shelters.' })
  @Get()
  findAll(@Request() req: { user: RequestingUser }) {
    return this.departmentSheltersService.findAll(req.user);
  }

  @ApiOperation({ summary: 'Draw a new shelter for a department' })
  @ApiResponse({ status: 403, description: 'Forbidden — not linked to the department.' })
  @Post()
  create(
    @Request() req: { user: RequestingUser },
    @Body() createDepartmentShelterDto: CreateDepartmentShelterDto,
  ) {
    return this.departmentSheltersService.create(req.user, createDepartmentShelterDto);
  }

  @ApiOperation({ summary: 'Update a department shelter' })
  @ApiParam({ name: 'id', description: 'Shelter id' })
  @ApiResponse({ status: 403, description: 'Forbidden — not linked to the department.' })
  @Patch(':id')
  update(
    @Request() req: { user: RequestingUser },
    @Param('id') id: string,
    @Body() updateDepartmentShelterDto: UpdateDepartmentShelterDto,
  ) {
    return this.departmentSheltersService.update(req.user, id, updateDepartmentShelterDto);
  }

  @ApiOperation({ summary: 'Delete a department shelter' })
  @ApiParam({ name: 'id', description: 'Shelter id' })
  @ApiResponse({ status: 403, description: 'Forbidden — not linked to the department.' })
  @Delete(':id')
  remove(@Request() req: { user: RequestingUser }, @Param('id') id: string) {
    return this.departmentSheltersService.remove(req.user, id);
  }
}
