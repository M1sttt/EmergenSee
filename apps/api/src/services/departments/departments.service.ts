import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Department, DepartmentDocument } from './schemas/department.schema';
import { CreateDepartmentDto, UpdateDepartmentDto } from './departments.dto';

@Injectable()
export class DepartmentsService {
    constructor(
        @InjectModel(Department.name) private departmentModel: Model<DepartmentDocument>,
    ) { }

    async create(createDepartmentDto: CreateDepartmentDto): Promise<DepartmentDocument> {
        const created = new this.departmentModel(createDepartmentDto);
        return created.save();
    }

    async findAll(): Promise<DepartmentDocument[]> {
        return this.departmentModel.find().exec();
    }

    async findOne(id: string): Promise<DepartmentDocument> {
        const department = await this.departmentModel.findById(id).exec();
        if (!department) {
            throw new NotFoundException(`Department #${id} not found`);
        }
        return department;
    }

    async update(id: string, updateDepartmentDto: UpdateDepartmentDto): Promise<DepartmentDocument> {
        const department = await this.departmentModel
            .findByIdAndUpdate(id, updateDepartmentDto, { new: true })
            .exec();
        if (!department) {
            throw new NotFoundException(`Department #${id} not found`);
        }
        return department;
    }

    async remove(id: string): Promise<void> {
        const result = await this.departmentModel.findByIdAndDelete(id).exec();
        if (!result) {
            throw new NotFoundException(`Department #${id} not found`);
        }
    }
}
