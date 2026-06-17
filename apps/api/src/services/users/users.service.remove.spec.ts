// Mock native/schema modules before any imports
jest.mock('bcrypt', () => ({ hash: jest.fn().mockResolvedValue('hashed') }));
jest.mock('fs');
jest.mock('./schemas/user.schema', () => ({ User: { name: 'User' } }));
jest.mock('../events/schemas/event.schema', () => ({ Event: { name: 'Event' } }));
jest.mock('../departments/schemas/department.schema', () => ({ Department: { name: 'Department' } }));

import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { NotFoundException } from '@nestjs/common';
import { Types } from 'mongoose';
import * as fs from 'fs';
import { UsersService } from './users.service';

const fsMock = fs as jest.Mocked<typeof fs>;

function makeModel(overrides: Record<string, jest.Mock> = {}) {
  return {
    findById: jest.fn(),
    findByIdAndDelete: jest.fn(),
    updateMany: jest.fn(),
    ...overrides,
  };
}

describe('UsersService.remove() — cascade deletion', () => {
  let service: UsersService;
  let userModel: ReturnType<typeof makeModel>;
  let eventModel: ReturnType<typeof makeModel>;
  let departmentModel: ReturnType<typeof makeModel>;

  const userId = new Types.ObjectId().toHexString();

  beforeEach(async () => {
    userModel = makeModel();
    eventModel = makeModel();
    departmentModel = makeModel();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: getModelToken('User'), useValue: userModel },
        { provide: getModelToken('Event'), useValue: eventModel },
        { provide: getModelToken('Department'), useValue: departmentModel },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);

    eventModel.updateMany.mockReturnValue({ exec: jest.fn().mockResolvedValue({ modifiedCount: 0 }) });
    departmentModel.updateMany.mockReturnValue({ exec: jest.fn().mockResolvedValue({ modifiedCount: 0 }) });
    userModel.findByIdAndDelete.mockReturnValue({ exec: jest.fn().mockResolvedValue({}) });

    fsMock.existsSync.mockReturnValue(false);
  });

  afterEach(() => jest.clearAllMocks());

  function mockUser(overrides: Partial<{ faceImages: string[]; faceIdentity: string | null }> = {}) {
    const user = { faceImages: [], faceIdentity: null, ...overrides };
    userModel.findById.mockReturnValue({ exec: jest.fn().mockResolvedValue(user) });
    return user;
  }

  it('throws NotFoundException when user does not exist', async () => {
    userModel.findById.mockReturnValue({ exec: jest.fn().mockResolvedValue(null) });
    await expect(service.remove(userId)).rejects.toThrow(NotFoundException);
  });

  it('deletes the user from MongoDB', async () => {
    mockUser();
    await service.remove(userId);
    expect(userModel.findByIdAndDelete).toHaveBeenCalledWith(userId);
  });

  it('calls face recognition service DELETE when faceIdentity is set', async () => {
    mockUser({ faceIdentity: 'identity-abc' });

    const fetchSpy = jest.spyOn(global, 'fetch').mockResolvedValue(
      new Response(null, { status: 200 }),
    );

    await service.remove(userId);

    expect(fetchSpy).toHaveBeenCalledWith(
      expect.stringContaining('identity-abc'),
      { method: 'DELETE' },
    );
    fetchSpy.mockRestore();
  });

  it('does NOT call face recognition service when faceIdentity is null', async () => {
    mockUser({ faceIdentity: null });

    const fetchSpy = jest.spyOn(global, 'fetch').mockResolvedValue(
      new Response(null, { status: 200 }),
    );

    await service.remove(userId);

    expect(fetchSpy).not.toHaveBeenCalled();
    fetchSpy.mockRestore();
  });

  it('deletes face image files from disk', async () => {
    mockUser({ faceImages: ['img1.jpg', 'img2.jpg'] });
    fsMock.existsSync.mockReturnValue(true);

    await service.remove(userId);

    expect(fsMock.unlinkSync).toHaveBeenCalledTimes(2);
    expect(fsMock.unlinkSync).toHaveBeenCalledWith(expect.stringContaining('img1.jpg'));
    expect(fsMock.unlinkSync).toHaveBeenCalledWith(expect.stringContaining('img2.jpg'));
  });

  it('skips unlinkSync for face images that do not exist on disk', async () => {
    mockUser({ faceImages: ['missing.jpg'] });
    fsMock.existsSync.mockReturnValue(false);

    await service.remove(userId);

    expect(fsMock.unlinkSync).not.toHaveBeenCalled();
  });

  it('pulls user from events.assignedTo', async () => {
    mockUser();
    await service.remove(userId);

    expect(eventModel.updateMany).toHaveBeenCalledWith(
      { assignedTo: expect.any(Types.ObjectId) },
      { $pull: { assignedTo: expect.any(Types.ObjectId) } },
    );
  });

  it('unsets events.reportedBy where the user is the reporter', async () => {
    mockUser();
    await service.remove(userId);

    expect(eventModel.updateMany).toHaveBeenCalledWith(
      { reportedBy: expect.any(Types.ObjectId) },
      { $unset: { reportedBy: '' } },
    );
  });

  it('pulls user ID string from departments.admins', async () => {
    mockUser();
    await service.remove(userId);

    expect(departmentModel.updateMany).toHaveBeenCalledWith(
      { admins: userId },
      { $pull: { admins: userId } },
    );
  });

  it('still deletes the user even if the face recognition service is unreachable', async () => {
    mockUser({ faceIdentity: 'identity-xyz' });

    jest.spyOn(global, 'fetch').mockRejectedValue(new Error('ECONNREFUSED'));

    await service.remove(userId);

    expect(userModel.findByIdAndDelete).toHaveBeenCalledWith(userId);
  });
});
