import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { UserRole } from '@emergensee/shared';
import { Department, DepartmentDocument } from '../departments/schemas/department.schema';
import { UsersService } from '../users/users.service';
import { DepartmentShelter, DepartmentShelterDocument } from './schemas/department-shelter.schema';
import { CreateDepartmentShelterDto, UpdateDepartmentShelterDto } from './department-shelters.dto';

export interface RequestingUser {
  userId: string;
  role: string;
}

@Injectable()
export class DepartmentSheltersService {
  constructor(
    @InjectModel(DepartmentShelter.name)
    private departmentShelterModel: Model<DepartmentShelterDocument>,
    @InjectModel(Department.name) private departmentModel: Model<DepartmentDocument>,
    private usersService: UsersService,
  ) { }

  async getVisibleDepartmentIds(user: RequestingUser): Promise<string[]> {
    if (user.role === UserRole.ADMIN) {
      const departments = await this.departmentModel.find().select('_id').exec();
      return departments.map(department => department._id.toString());
    }

    const member = await this.usersService.findOne(user.userId);
    const memberDepartmentIds = (member.departments || []).map(id => id.toString());

    const administeredDepartments = await this.departmentModel
      .find({ admins: user.userId })
      .select('_id')
      .exec();

    return Array.from(
      new Set([...memberDepartmentIds, ...administeredDepartments.map(d => d._id.toString())]),
    );
  }

  async findAll(user: RequestingUser): Promise<DepartmentShelter[]> {
    const departmentIds = await this.getVisibleDepartmentIds(user);
    if (departmentIds.length === 0) {
      return [];
    }

    return this.departmentShelterModel
      .find({ departmentId: { $in: departmentIds } })
      .sort({ createdAt: -1 })
      .exec();
  }

  async create(
    user: RequestingUser,
    createDepartmentShelterDto: CreateDepartmentShelterDto,
  ): Promise<DepartmentShelter> {
    await this.assertCanManageDepartment(user, createDepartmentShelterDto.departmentId);

    const created = new this.departmentShelterModel({
      ...createDepartmentShelterDto,
      createdBy: user.userId,
    });
    return created.save();
  }

  async update(
    user: RequestingUser,
    id: string,
    updateDepartmentShelterDto: UpdateDepartmentShelterDto,
  ): Promise<DepartmentShelter> {
    const existing = await this.findOneOrFail(id);
    await this.assertCanManageDepartment(user, existing.departmentId);

    const updated = await this.departmentShelterModel
      .findByIdAndUpdate(id, updateDepartmentShelterDto, { new: true })
      .exec();

    if (!updated) {
      throw new NotFoundException(`Shelter with ID ${id} not found`);
    }

    return updated;
  }

  async remove(user: RequestingUser, id: string): Promise<void> {
    const existing = await this.findOneOrFail(id);
    await this.assertCanManageDepartment(user, existing.departmentId);
    await this.departmentShelterModel.findByIdAndDelete(id).exec();
  }

  private async findOneOrFail(id: string): Promise<DepartmentShelterDocument> {
    const shelter = await this.departmentShelterModel.findById(id).exec();
    if (!shelter) {
      throw new NotFoundException(`Shelter with ID ${id} not found`);
    }
    return shelter;
  }

  private async assertCanManageDepartment(user: RequestingUser, departmentId: string): Promise<void> {
    const departmentIds = await this.getVisibleDepartmentIds(user);
    if (!departmentIds.includes(departmentId)) {
      throw new ForbiddenException('You are not linked to this department');
    }
  }
}
