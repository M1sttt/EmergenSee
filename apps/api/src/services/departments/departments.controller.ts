import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@emergensee/shared';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { DepartmentsService } from './departments.service';
import { CreateDepartmentDto, UpdateDepartmentDto } from './departments.dto';

@ApiTags('Departments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('departments')
export class DepartmentsController {
    constructor(private readonly departmentsService: DepartmentsService) { }

    @Post()
    @ApiOperation({ summary: 'Create a new department (admin only)' })
    @ApiResponse({ status: 201, description: 'Department created.' })
    @ApiResponse({ status: 403, description: 'Forbidden — admin role required.' })
    @Roles(UserRole.ADMIN)
    @UseGuards(RolesGuard)
    create(@Body() createDepartmentDto: CreateDepartmentDto) {
        return this.departmentsService.create(createDepartmentDto);
    }

    @Get()
    @ApiOperation({ summary: 'Get all departments' })
    @ApiResponse({ status: 200, description: 'Return all departments.' })
    findAll() {
        return this.departmentsService.findAll();
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get a department by id' })
    @ApiResponse({ status: 200, description: 'Return a single department.' })
    findOne(@Param('id') id: string) {
        return this.departmentsService.findOne(id);
    }

    @Patch(':id')
    @ApiOperation({ summary: 'Update a department' })
    @ApiResponse({ status: 200, description: 'Department updated.' })
    update(@Param('id') id: string, @Body() updateDepartmentDto: UpdateDepartmentDto) {
        return this.departmentsService.update(id, updateDepartmentDto);
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Delete a department (admin only)' })
    @ApiResponse({ status: 200, description: 'Department deleted.' })
    @ApiResponse({ status: 403, description: 'Forbidden — admin role required.' })
    @Roles(UserRole.ADMIN)
    @UseGuards(RolesGuard)
    remove(@Param('id') id: string) {
        return this.departmentsService.remove(id);
    }
}
