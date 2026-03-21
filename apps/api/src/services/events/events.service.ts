import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Event, EventDocument } from './schemas/event.schema';
import { Department, DepartmentDocument } from '../departments/schemas/department.schema';
import { CreateEventDto, UpdateEventDto, EventStatus } from '@emergensee/shared';
import { WebsocketGateway } from '../websocket/websocket.gateway';

@Injectable()
export class EventsService {
  constructor(
    @InjectModel(Event.name) private eventModel: Model<EventDocument>,
    @InjectModel(Department.name) private departmentModel: Model<DepartmentDocument>,
    private websocketGateway: WebsocketGateway,
  ) { }

  private async expandDepartmentIdsRecursively(initialDepartmentIds: string[] = []): Promise<string[]> {
    const uniqueInitialIds = Array.from(new Set(initialDepartmentIds.filter(Boolean)));
    if (uniqueInitialIds.length === 0) {
      return [];
    }

    await this.departmentModel
      .updateMany(
        {
          $or: [
            { departmentKey: { $exists: false } },
            { departmentKey: null },
            { departmentKey: '' },
          ],
        },
        [{ $set: { departmentKey: { $toString: '$_id' } } }],
      )
      .exec();

    const [aggregationResult] = await this.departmentModel
      .aggregate<{ allDepartmentIds: string[] }>([
        {
          $match: {
            departmentKey: { $in: uniqueInitialIds },
          },
        },
        {
          $graphLookup: {
            from: this.departmentModel.collection.name,
            startWith: '$subDepartments',
            connectFromField: 'subDepartments',
            connectToField: 'departmentKey',
            as: 'descendants',
          },
        },
        {
          $project: {
            allDepartmentIds: {
              $setUnion: [['$departmentKey'], '$descendants.departmentKey'],
            },
          },
        },
        {
          $group: {
            _id: null,
            groupedIds: { $addToSet: '$allDepartmentIds' },
          },
        },
        {
          $project: {
            _id: 0,
            allDepartmentIds: {
              $reduce: {
                input: '$groupedIds',
                initialValue: [],
                in: { $setUnion: ['$$value', '$$this'] },
              },
            },
          },
        },
      ])
      .exec();

    return aggregationResult?.allDepartmentIds?.length
      ? aggregationResult.allDepartmentIds
      : uniqueInitialIds;
  }

  async create(createEventDto: CreateEventDto): Promise<Event> {
    const departments = await this.expandDepartmentIdsRecursively(createEventDto.departments);

    const createdEvent = new this.eventModel({
      ...createEventDto,
      departments,
      status: EventStatus.ONGOING,
    });
    const savedEvent = await createdEvent.save();

    // Emit event created via WebSocket
    this.websocketGateway.emitEventCreated(savedEvent);

    return savedEvent;
  }

  async findAll(): Promise<Event[]> {
    return this.eventModel
      .find()
      .populate('reportedBy', 'firstName lastName email')
      .populate('assignedTo', 'firstName lastName email')
      .sort({ createdAt: -1 })
      .exec();
  }

  async findOne(id: string): Promise<Event> {
    const event = await this.eventModel
      .findById(id)
      .populate('reportedBy', 'firstName lastName email')
      .populate('assignedTo', 'firstName lastName email')
      .exec();

    if (!event) {
      throw new NotFoundException(`Event with ID ${id} not found`);
    }

    return event;
  }

  async update(id: string, updateEventDto: UpdateEventDto): Promise<Event> {
    const updatePayload: UpdateEventDto = { ...updateEventDto };

    if (updateEventDto.departments) {
      updatePayload.departments = await this.expandDepartmentIdsRecursively(updateEventDto.departments);
    }

    const event = await this.eventModel
      .findByIdAndUpdate(id, updatePayload, { new: true })
      .populate('reportedBy', 'firstName lastName email')
      .populate('assignedTo', 'firstName lastName email')
      .exec();

    if (!event) {
      throw new NotFoundException(`Event with ID ${id} not found`);
    }

    // Emit event updated via WebSocket
    this.websocketGateway.emitEventUpdated(event);

    return event;
  }

  async remove(id: string): Promise<void> {
    const result = await this.eventModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException(`Event with ID ${id} not found`);
    }

    // Emit event deleted via WebSocket
    this.websocketGateway.emitEventDeleted(id);
  }

  async findNearby(longitude: number, latitude: number, maxDistance: number = 10000): Promise<Event[]> {
    return this.eventModel
      .find({
        location: {
          $near: {
            $geometry: {
              type: 'Point',
              coordinates: [longitude, latitude],
            },
            $maxDistance: maxDistance,
          },
        },
      })
      .populate('reportedBy', 'firstName lastName email')
      .populate('assignedTo', 'firstName lastName email')
      .exec();
  }
}
