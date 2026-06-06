import { Module } from '@nestjs/common';
import { WebsocketGateway } from './websocket.gateway';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [UsersModule],
  providers: [WebsocketGateway],
  exports: [WebsocketGateway],
})
export class WebsocketModule {}
