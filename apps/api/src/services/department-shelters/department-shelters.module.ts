import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DepartmentSheltersService } from './department-shelters.service';
import { DepartmentSheltersController } from './department-shelters.controller';
import { DepartmentShelter, DepartmentShelterSchema } from './schemas/department-shelter.schema';
import { Department, DepartmentSchema } from '../departments/schemas/department.schema';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: DepartmentShelter.name, schema: DepartmentShelterSchema },
      { name: Department.name, schema: DepartmentSchema },
    ]),
    UsersModule,
  ],
  controllers: [DepartmentSheltersController],
  providers: [DepartmentSheltersService],
  exports: [DepartmentSheltersService],
})
export class DepartmentSheltersModule { }
