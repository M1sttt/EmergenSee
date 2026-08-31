import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { SHELTER_CATEGORIES } from '@emergensee/shared';
import type { ShelterCategory, ShelterPolygon } from '@emergensee/shared';

export type DepartmentShelterDocument = DepartmentShelter & Document;
type SerializedDepartmentShelter = {
  _id?: { toString(): string };
  __v?: unknown;
  id?: string;
};

@Schema({
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform: (_doc, ret: SerializedDepartmentShelter) => {
      ret.id = ret._id?.toString();
      delete ret._id;
      delete ret.__v;
    },
  },
})
export class DepartmentShelter {
  @Prop({ required: true })
  name: string;

  @Prop()
  description?: string;

  @Prop({ required: true, enum: SHELTER_CATEGORIES, default: 'general' })
  category: ShelterCategory;

  @Prop()
  capacity?: number;

  @Prop({ required: true, index: true })
  departmentId: string;

  @Prop({ type: [[Number]], required: true })
  polygon: ShelterPolygon;

  @Prop()
  createdBy?: string;

  @Prop()
  createdAt: Date;

  @Prop()
  updatedAt: Date;
}

export const DepartmentShelterSchema = SchemaFactory.createForClass(DepartmentShelter);
