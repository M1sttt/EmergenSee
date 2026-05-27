import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { EventsService } from './events.service';
import { EventsController } from './events.controller';
import { Event, EventSchema } from './schemas/event.schema';
import { Department, DepartmentSchema } from '../departments/schemas/department.schema';
import { WebsocketModule } from '../websocket/websocket.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Event.name, schema: EventSchema },
      { name: Department.name, schema: DepartmentSchema },
    ]),
    WebsocketModule,
  ],
  controllers: [EventsController],
  providers: [EventsService],
  exports: [EventsService],
})
export class EventsModule {}
