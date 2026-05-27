import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { StatusService } from './status.service';
import { StatusController } from './status.controller';
import { StatusUpdate, StatusUpdateSchema } from './schemas/status.schema';
import { WebsocketModule } from '../websocket/websocket.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: StatusUpdate.name, schema: StatusUpdateSchema }]),
    WebsocketModule,
  ],
  controllers: [StatusController],
  providers: [StatusService],
  exports: [StatusService],
})
export class StatusModule {}
