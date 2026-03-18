import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from './services/auth/auth.module';
import { UsersModule } from './services/users/users.module';
import { EventsModule } from './services/events/events.module';
import { StatusModule } from './services/status/status.module';
import { WebsocketModule } from './services/websocket/websocket.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    MongooseModule.forRoot(process.env.MONGODB_URI || 'mongodb://localhost:27017/emergensee'),
    AuthModule,
    UsersModule,
    EventsModule,
    StatusModule,
    WebsocketModule,
  ],
})
export class AppModule { }
