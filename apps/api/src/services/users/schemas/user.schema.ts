import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { UserRole, UserStatus } from '@emergensee/shared';

export type UserDocument = User & Document;
type SerializedUser = {
  _id?: { toString(): string };
  __v?: unknown;
  password?: unknown;
  sessionVersion?: unknown;
  id?: string;
};

@Schema({
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform: (_doc, ret: SerializedUser) => {
      ret.id = ret._id?.toString();
      delete ret._id;
      delete ret.__v;
      delete ret.password;
      delete ret.sessionVersion;
    }
  }
})
export class User {
  @Prop({ unique: true, sparse: true })
  email: string;

  @Prop({ required: true })
  password: string;

  @Prop()
  firstName: string;

  @Prop()
  lastName: string;

  @Prop({ required: true, enum: UserRole })
  role: UserRole;

  @Prop({ default: UserStatus.ACTIVE, enum: UserStatus })
  status: UserStatus;

  @Prop()
  phoneNumber?: string;

  @Prop({ type: [String], default: [] })
  departments?: string[];

  @Prop()
  location?: string;

  @Prop({ sparse: true, unique: true })
  cameraCode?: string;

  @Prop({ default: 0 })
  sessionVersion: number;

  @Prop({ sparse: true })
  googleId?: string;

  @Prop({ sparse: true, unique: true })
  faceIdentity?: string;

  @Prop({ type: [String], default: [] })
  faceImages?: string[];

  @Prop()
  createdAt: Date;

  @Prop()
  updatedAt: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);
