import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types, Schema as MongooseSchema } from 'mongoose';
import { EventType, EventPriority, EventStatus } from '@emergensee/shared';
import type { Location } from '@emergensee/shared';

export type EventDocument = Event & Document;
type SerializedEvent = {
  _id?: { toString(): string };
  __v?: unknown;
  id?: string;
};

@Schema({
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform: (_doc, ret: SerializedEvent) => {
      ret.id = ret._id?.toString();
      delete ret._id;
      delete ret.__v;
    }
  }
})
export class Event {
  @Prop({ required: true, enum: EventType })
  type: EventType;

  @Prop({ required: true, enum: EventPriority })
  priority: EventPriority;

  @Prop({ required: true, enum: EventStatus, default: EventStatus.ONGOING })
  status: EventStatus;

  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  description: string;

  @Prop({
    type: MongooseSchema.Types.Mixed,
    required: true,
  })
  location: Location;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  reportedBy?: Types.ObjectId;

  @Prop({ type: [{ type: String, ref: 'Department' }], required: true })
  departments: string[];

  @Prop({ type: [{ type: Types.ObjectId, ref: 'User' }] })
  assignedTo?: Types.ObjectId[];

  @Prop()
  resolvedAt?: Date;

  @Prop()
  createdAt: Date;

  @Prop()
  updatedAt: Date;
}

export const EventSchema = SchemaFactory.createForClass(Event);

// Create geospatial index for location queries
EventSchema.index({ location: '2dsphere' });
