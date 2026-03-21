import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type DepartmentDocument = Department & Document;

@Schema({
    timestamps: true,
    toJSON: {
        virtuals: true,
        transform: (_doc, ret: any) => {
            ret.id = ret._id.toString();
            delete ret._id;
            delete ret.__v;
            delete ret.departmentKey;
        }
    }
})

export class Department {
    @Prop({ required: true })
    name: string;

    @Prop({ required: true })
    description: string;

    @Prop({ type: [String], default: [] })
    admins: string[];

    @Prop({ type: [String], default: [] })
    subDepartments: string[];

    @Prop({ index: true })
    departmentKey: string;

    @Prop()
    createdAt: Date;

    @Prop()
    updatedAt: Date;
}

export const DepartmentSchema = SchemaFactory.createForClass(Department);

DepartmentSchema.pre('save', function (next) {
    if (!this.departmentKey) {
        this.departmentKey = this._id.toString();
    }
    next();
});
