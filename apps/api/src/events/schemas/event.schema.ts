import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types, Schema as MongooseSchema } from 'mongoose';
import { EventType, EventPriority, EventStatus, Location } from '@emergensee/shared';

export type EventDocument = Event & Document;

@Schema({ timestamps: true })
export class Event {
  @Prop({ required: true, enum: EventType })
  type: EventType;

  @Prop({ required: true, enum: EventPriority })
  priority: EventPriority;

  @Prop({ required: true, enum: EventStatus, default: EventStatus.PENDING })
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

  @Prop({ required: true })
  address: string;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  reportedBy?: Types.ObjectId;

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
