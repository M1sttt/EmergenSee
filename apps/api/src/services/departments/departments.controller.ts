import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { DepartmentsService } from './departments.service';
import { CreateDepartmentDto, UpdateDepartmentDto } from './departments.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Departments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('departments')
export class DepartmentsController {
    constructor(private readonly departmentsService: DepartmentsService) { }

    @Post()
    @ApiOperation({ summary: 'Create a new department' })
    @ApiResponse({ status: 201, description: 'The department has been successfully created.' })
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
    @ApiResponse({ status: 200, description: 'The department has been successfully updated.' })
    update(@Param('id') id: string, @Body() updateDepartmentDto: UpdateDepartmentDto) {
        return this.departmentsService.update(id, updateDepartmentDto);
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Delete a department' })
    @ApiResponse({ status: 200, description: 'The department has been successfully deleted.' })
    remove(@Param('id') id: string) {
        return this.departmentsService.remove(id);
    }
}
