import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import * as fs from 'fs';
import * as path from 'path';
import { User, UserDocument } from './schemas/user.schema';
import { UserRole } from '@emergensee/shared';
import { CreateUserDto, UpdateUserDto } from './users.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) { }

  async create(createUserDto: CreateUserDto): Promise<UserDocument> {
    const existingUser = await this.userModel.findOne({ email: createUserDto.email });
    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);
    const createdUser = new this.userModel({
      ...createUserDto,
      password: hashedPassword,
    });

    return createdUser.save();
  }

  async findAll(): Promise<UserDocument[]> {
    return this.userModel.find().select('-password').exec();
  }

  async findOne(id: string): Promise<UserDocument> {
    const user = await this.userModel.findById(id).select('-password').exec();
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return user;
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

  private readonly faceRecognitionUrl = process.env.FACE_RECOGNITION_URL || 'http://localhost:8000';

  private async registerWithFaceService(userId: string, filePath: string, filename: string, mimeType: string): Promise<void> {
    try {
      const formData = new FormData();
      formData.append('name', userId);
      const buffer = fs.readFileSync(filePath);
      formData.append('image', new Blob([buffer], { type: mimeType }), filename);
      const res = await fetch(`${this.faceRecognitionUrl}/api/v1/faces/register`, {
        method: 'POST',
        body: formData,
      });
      if (!res.ok) {
        const text = await res.text();
        console.warn(`Face recognition service error (${res.status}): ${text}`);
      }
    } catch (err: any) {
      console.warn('Face recognition service unreachable:', err.message);
    }
  }

  private async unregisterFromFaceService(userId: string): Promise<void> {
    try {
      await fetch(`${this.faceRecognitionUrl}/api/v1/faces/${userId}`, { method: 'DELETE' });
    } catch (err: any) {
      console.warn('Face recognition service unreachable:', err.message);
    }
  }

  async addFaceImage(id: string, filename: string, filePath: string, mimeType: string): Promise<UserDocument> {
    await this.registerWithFaceService(id, filePath, filename, mimeType);

    const user = await this.userModel
      .findByIdAndUpdate(id, { $push: { faceImages: filename } }, { new: true })
      .select('-password')
      .exec();
    if (!user) throw new NotFoundException(`User with ID ${id} not found`);
    return user;
  }

  async removeFaceImage(id: string, filename: string): Promise<UserDocument> {
    const filepath = path.join(process.cwd(), 'uploads', 'faces', filename);
    if (fs.existsSync(filepath)) fs.unlinkSync(filepath);

    const user = await this.userModel
      .findByIdAndUpdate(id, { $pull: { faceImages: filename } }, { new: true })
      .select('-password')
      .exec();
    if (!user) throw new NotFoundException(`User with ID ${id} not found`);

    if ((user.faceImages ?? []).length === 0) {
      await this.unregisterFromFaceService(id);
    }

    return user;
  }
}
