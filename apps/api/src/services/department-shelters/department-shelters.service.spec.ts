// Mock native/schema modules before any imports
jest.mock('bcrypt', () => ({ hash: jest.fn() }));
jest.mock('fs');
jest.mock('./schemas/department-shelter.schema', () => ({ DepartmentShelter: { name: 'DepartmentShelter' } }));
jest.mock('../departments/schemas/department.schema', () => ({ Department: { name: 'Department' } }));
jest.mock('../users/schemas/user.schema', () => ({ User: { name: 'User' } }));
jest.mock('../events/schemas/event.schema', () => ({ Event: { name: 'Event' } }));

import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { UserRole } from '@emergensee/shared';
import { UsersService } from '../users/users.service';
import { DepartmentSheltersService } from './department-shelters.service';

const memberDeptId = 'dept-member';
const adminOfDeptId = 'dept-administered';
const otherDeptId = 'dept-other';

const member = { userId: 'user-1', role: UserRole.MEMBER };
const admin = { userId: 'user-admin', role: UserRole.ADMIN };

describe('DepartmentSheltersService', () => {
  let service: DepartmentSheltersService;
  let shelterModel: Record<string, jest.Mock>;
  let departmentModel: Record<string, jest.Mock>;
  let usersService: { findOne: jest.Mock };

  const selectExec = (result: unknown) => ({ select: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue(result) }) });

  beforeEach(async () => {
    shelterModel = {
      find: jest.fn(),
      findById: jest.fn(),
      findByIdAndUpdate: jest.fn(),
      findByIdAndDelete: jest.fn(),
    };
    departmentModel = { find: jest.fn() };
    usersService = { findOne: jest.fn().mockResolvedValue({ departments: [memberDeptId] }) };

    departmentModel.find.mockImplementation((filter?: Record<string, unknown>) => {
      if (filter && filter.admins) {
        return selectExec([{ _id: adminOfDeptId }]);
      }
      return selectExec([{ _id: memberDeptId }, { _id: adminOfDeptId }, { _id: otherDeptId }]);
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DepartmentSheltersService,
        { provide: getModelToken('DepartmentShelter'), useValue: shelterModel },
        { provide: getModelToken('Department'), useValue: departmentModel },
        { provide: UsersService, useValue: usersService },
      ],
    }).compile();

    service = module.get(DepartmentSheltersService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('getVisibleDepartmentIds()', () => {
    it('returns every department for a global admin', async () => {
      await expect(service.getVisibleDepartmentIds(admin)).resolves.toEqual([
        memberDeptId,
        adminOfDeptId,
        otherDeptId,
      ]);
      expect(usersService.findOne).not.toHaveBeenCalled();
    });

    it('merges member departments with administered departments, without duplicates', async () => {
      usersService.findOne.mockResolvedValue({ departments: [memberDeptId, adminOfDeptId] });

      await expect(service.getVisibleDepartmentIds(member)).resolves.toEqual([memberDeptId, adminOfDeptId]);
    });
  });

  describe('findAll()', () => {
    it('queries only the departments the user is linked to', async () => {
      shelterModel.find.mockReturnValue({ sort: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue([]) }) });

      await service.findAll(member);

      expect(shelterModel.find).toHaveBeenCalledWith({
        departmentId: { $in: [memberDeptId, adminOfDeptId] },
      });
    });

    it('returns an empty list without querying when the user has no departments', async () => {
      usersService.findOne.mockResolvedValue({ departments: [] });
      departmentModel.find.mockReturnValue(selectExec([]));

      await expect(service.findAll(member)).resolves.toEqual([]);
      expect(shelterModel.find).not.toHaveBeenCalled();
    });
  });

  describe('create()', () => {
    it('rejects a department the user is not linked to', async () => {
      await expect(
        service.create(member, {
          name: 'Basement',
          category: 'missile',
          departmentId: otherDeptId,
          polygon: [[1, 1], [1, 2], [2, 2]],
        }),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });
  });

  describe('remove()', () => {
    it('throws when the shelter does not exist', async () => {
      shelterModel.findById.mockReturnValue({ exec: jest.fn().mockResolvedValue(null) });

      await expect(service.remove(member, 'missing')).rejects.toBeInstanceOf(NotFoundException);
    });

    it('refuses to delete a shelter owned by another department', async () => {
      shelterModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue({ departmentId: otherDeptId }),
      });

      await expect(service.remove(member, 'shelter-1')).rejects.toBeInstanceOf(ForbiddenException);
      expect(shelterModel.findByIdAndDelete).not.toHaveBeenCalled();
    });

    it('deletes a shelter of a linked department', async () => {
      shelterModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue({ departmentId: memberDeptId }),
      });
      shelterModel.findByIdAndDelete.mockReturnValue({ exec: jest.fn().mockResolvedValue({}) });

      await service.remove(member, 'shelter-1');

      expect(shelterModel.findByIdAndDelete).toHaveBeenCalledWith('shelter-1');
    });
  });
});
