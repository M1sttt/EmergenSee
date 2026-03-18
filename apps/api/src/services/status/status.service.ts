import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { StatusUpdate, StatusUpdateDocument } from './schemas/status.schema';
import { CreateStatusUpdateDto, UpdateStatusUpdateDto } from '@emergensee/shared';
import { WebsocketGateway } from '../websocket/websocket.gateway';

@Injectable()
export class StatusService {
  constructor(
    @InjectModel(StatusUpdate.name) private statusUpdateModel: Model<StatusUpdateDocument>,
    private websocketGateway: WebsocketGateway,
  ) {}

  async create(userId: string, createStatusUpdateDto: CreateStatusUpdateDto): Promise<StatusUpdate> {
    const createdStatusUpdate = new this.statusUpdateModel({
      ...createStatusUpdateDto,
      userId,
    });
    const savedStatusUpdate = await createdStatusUpdate.save();

    // Emit status updated via WebSocket
    this.websocketGateway.emitStatusUpdated(savedStatusUpdate, userId);

    return savedStatusUpdate;
  }

  async findAll(): Promise<StatusUpdate[]> {
    return this.statusUpdateModel
      .find()
      .populate('userId', 'firstName lastName email')
      .populate('eventId', 'title type')
      .sort({ createdAt: -1 })
      .exec();
  }

  async findByUser(userId: string): Promise<StatusUpdate[]> {
    return this.statusUpdateModel
      .find({ userId })
      .populate('eventId', 'title type')
      .sort({ createdAt: -1 })
      .exec();
  }

  async findLatestByUser(userId: string): Promise<StatusUpdate | null> {
    return this.statusUpdateModel
      .findOne({ userId })
      .populate('eventId', 'title type')
      .sort({ createdAt: -1 })
      .exec();
  }

  async findOne(id: string): Promise<StatusUpdate> {
    const statusUpdate = await this.statusUpdateModel
      .findById(id)
      .populate('userId', 'firstName lastName email')
      .populate('eventId', 'title type')
      .exec();

    if (!statusUpdate) {
      throw new NotFoundException(`Status update with ID ${id} not found`);
    }

    return statusUpdate;
  }

  async update(id: string, updateStatusUpdateDto: UpdateStatusUpdateDto): Promise<StatusUpdate> {
    const statusUpdate = await this.statusUpdateModel
      .findByIdAndUpdate(id, updateStatusUpdateDto, { new: true })
      .populate('userId', 'firstName lastName email')
      .populate('eventId', 'title type')
      .exec();

    if (!statusUpdate) {
      throw new NotFoundException(`Status update with ID ${id} not found`);
    }

    // Emit status updated via WebSocket
    this.websocketGateway.emitStatusUpdated(statusUpdate, statusUpdate.userId.toString());

    return statusUpdate;
  }

  async remove(id: string): Promise<void> {
    const result = await this.statusUpdateModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException(`Status update with ID ${id} not found`);
    }
  }
}
