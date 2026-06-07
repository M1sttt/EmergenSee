import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  ForbiddenException,
  NotFoundException,
  Request,
  StreamableFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiResponse, ApiTags, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { UserRole } from '@emergensee/shared';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UsersService } from './users.service';
import { CreateUserDto, UpdateUserDto } from './users.dto';
import * as fs from 'fs';
import * as path from 'path';

@ApiTags('Users')
@ApiBearerAuth('access-token')
@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) { }

  @ApiOperation({ summary: 'Create a new user (admin only)' })
  @ApiResponse({ status: 403, description: 'Forbidden — admin role required.' })
  @Post()
  @Roles(UserRole.ADMIN)
  @UseGuards(RolesGuard)
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @ApiOperation({ summary: 'List users' })
  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  @ApiOperation({ summary: 'Get user by id' })
  @ApiParam({ name: 'id', description: 'User id' })
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @ApiOperation({ summary: 'Update user by id (admin or own profile)' })
  @ApiParam({ name: 'id', description: 'User id' })
  @ApiResponse({ status: 403, description: 'Forbidden — must be admin or updating own profile.' })
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto, @Request() req: any) {
    if (req.user.role !== UserRole.ADMIN && req.user.userId !== id) {
      throw new ForbiddenException();
    }
    return this.usersService.update(id, updateUserDto);
  }

  @ApiOperation({ summary: 'Delete user by id (admin only)' })
  @ApiParam({ name: 'id', description: 'User id' })
  @ApiResponse({ status: 403, description: 'Forbidden — admin role required.' })
  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @UseGuards(RolesGuard)
  remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }

  @ApiOperation({ summary: 'Upload a face image for a user (admin or own profile)' })
  @ApiParam({ name: 'id', description: 'User id' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({ schema: { type: 'object', properties: { image: { type: 'string', format: 'binary' } } } })
  @ApiResponse({ status: 403, description: 'Forbidden — must be admin or uploading to own profile.' })
  @Post(':id/face-images')
  @UseInterceptors(
    FileInterceptor('image', {
      storage: diskStorage({
        destination: (_req, _file, cb) => {
          const uploadPath = path.join(process.cwd(), 'uploads', 'faces');
          fs.mkdirSync(uploadPath, { recursive: true });
          cb(null, uploadPath);
        },
        filename: (req, file, cb) => {
          const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
          cb(null, `${req.params.id}-${uniqueSuffix}${extname(file.originalname)}`);
        },
      }),
      fileFilter: (_req, file, cb) => {
        if (!file.mimetype.match(/^image\/(jpeg|jpg|png|webp)$/)) {
          return cb(new BadRequestException('Only JPEG, PNG, and WebP images are allowed'), false);
        }
        cb(null, true);
      },
      limits: { fileSize: 5 * 1024 * 1024 },
    }),
  )
  uploadFaceImage(@Param('id') id: string, @UploadedFile() file: Express.Multer.File, @Request() req: any) {
    if (req.user.role !== UserRole.ADMIN && req.user.userId !== id) {
      throw new ForbiddenException();
    }
    if (!file) throw new BadRequestException('Image file is required');
    return this.usersService.addFaceImage(id, file.filename);
  }

  @ApiOperation({ summary: 'Get a face image for a user (admin or own profile)' })
  @ApiParam({ name: 'id', description: 'User id' })
  @ApiParam({ name: 'filename', description: 'Image filename' })
  @ApiResponse({ status: 403, description: 'Forbidden — must be admin or accessing own image.' })
  @Get(':id/face-images/:filename')
  getFaceImage(@Param('id') id: string, @Param('filename') filename: string, @Request() req: any): StreamableFile {
    if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      throw new BadRequestException('Invalid filename');
    }
    if (req.user.role !== UserRole.ADMIN && req.user.userId !== id) {
      throw new ForbiddenException();
    }
    const filePath = path.join(process.cwd(), 'uploads', 'faces', filename);
    if (!fs.existsSync(filePath)) throw new NotFoundException('Image not found');
    const ext = extname(filename).slice(1).toLowerCase();
    const mimeTypes: Record<string, string> = { jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp' };
    return new StreamableFile(fs.createReadStream(filePath), { type: mimeTypes[ext] ?? 'application/octet-stream' });
  }

  @ApiOperation({ summary: 'Delete a face image for a user (admin or own profile)' })
  @ApiParam({ name: 'id', description: 'User id' })
  @ApiParam({ name: 'filename', description: 'Image filename' })
  @ApiResponse({ status: 403, description: 'Forbidden — must be admin or deleting own image.' })
  @Delete(':id/face-images/:filename')
  deleteFaceImage(@Param('id') id: string, @Param('filename') filename: string, @Request() req: any) {
    if (req.user.role !== UserRole.ADMIN && req.user.userId !== id) {
      throw new ForbiddenException();
    }
    return this.usersService.removeFaceImage(id, filename);
  }
}
