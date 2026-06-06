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

  @ApiOperation({ summary: 'Update user by id' })
  @ApiParam({ name: 'id', description: 'User id' })
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
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

  @ApiOperation({ summary: 'Upload a face image for a user' })
  @ApiParam({ name: 'id', description: 'User id' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({ schema: { type: 'object', properties: { image: { type: 'string', format: 'binary' } } } })
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
  uploadFaceImage(@Param('id') id: string, @UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('Image file is required');
    return this.usersService.addFaceImage(id, file.filename, file.path, file.mimetype);
  }

  @ApiOperation({ summary: 'Delete a face image for a user' })
  @ApiParam({ name: 'id', description: 'User id' })
  @ApiParam({ name: 'filename', description: 'Image filename' })
  @Delete(':id/face-images/:filename')
  deleteFaceImage(@Param('id') id: string, @Param('filename') filename: string) {
    return this.usersService.removeFaceImage(id, filename);
  }
}
