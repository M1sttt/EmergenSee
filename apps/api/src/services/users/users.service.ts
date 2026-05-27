import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { User, UserDocument } from './schemas/user.schema';
import { UserRole } from '@emergensee/shared';
import { CreateUserDto, UpdateUserDto } from './users.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) { }

  async create(createUserDto: CreateUserDto): Promise<UserDocument> {
    let dto = { ...createUserDto };

    if (dto.role === UserRole.CAMERA) {
      const code = this._generateCameraCode();
      dto = {
        ...dto,
        email: `${code.toLowerCase().replace('-', '')}@camera.local`,
        firstName: code,
        lastName: '',
      };
      const hashedPassword = await bcrypt.hash(dto.password, 10);
      const createdUser = new this.userModel({ ...dto, password: hashedPassword, cameraCode: code });
      return createdUser.save();
    }

    const existingUser = await this.userModel.findOne({ email: dto.email });
    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);
    const createdUser = new this.userModel({ ...dto, password: hashedPassword });
    return createdUser.save();
  }

  async findAll(): Promise<UserDocument[]> {
    return this.userModel.find().select('-password -sessionVersion').exec();
  }

  async findOne(id: string): Promise<UserDocument> {
    const user = await this.userModel.findById(id).select('-password -sessionVersion').exec();
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return user;
  }

  async findByCameraCode(code: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ cameraCode: code.toUpperCase() }).exec();
  }

  async findOneForSessionCheck(id: string): Promise<UserDocument | null> {
    return this.userModel.findById(id).select('sessionVersion role').exec();
  }

  private _generateCameraCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    const rand = Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
    return `CAM-${rand}`;
  }

  async findByEmail(email: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ email }).exec();
  }

  async findOrCreateGoogleUser(profile: {
    googleId: string;
    email: string;
    firstName: string;
    lastName: string;
  }): Promise<UserDocument> {
    // Try finding by googleId first, then by email
    let user = await this.userModel.findOne({ googleId: profile.googleId }).exec();
    if (user) return user;

    user = await this.userModel.findOne({ email: profile.email }).exec();
    if (user) {
      // Link the Google account to the existing user
      user.googleId = profile.googleId;
      return user.save();
    }

    // Create a brand-new user — Google accounts have no password
    const created = new this.userModel({
      email: profile.email,
      firstName: profile.firstName,
      lastName: profile.lastName,
      password: Math.random().toString(36), // unusable placeholder
      role: UserRole.MEMBER,
      googleId: profile.googleId,
    });
    return created.save();
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<UserDocument> {
    const updateData = { ...updateUserDto };
    if (updateData.password) {
      updateData.password = await bcrypt.hash(updateData.password, 10);
    }

    const user = await this.userModel
      .findByIdAndUpdate(id, updateData, { new: true })
      .select('-password')
      .exec();

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return user;
  }

  async remove(id: string): Promise<void> {
    const result = await this.userModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
  }
}
