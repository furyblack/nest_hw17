import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserAccountsModule } from './moduls/user-accounts/user-accounts.module';
import { TestingController } from './moduls/testing/testing.controller';
import { TestingModule } from './moduls/testing/testing.module';
import { NotificationsModule } from './moduls/notifications/notifications.module';
import { ThrottlerModule } from '@nestjs/throttler';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'localhost',
      port: 5433,
      username: 'postgres',
      password: '3991',
      database: 'blogger_platform',
      autoLoadEntities: false,
      synchronize: false,
    }),
    UserAccountsModule,
    TestingModule,
    NotificationsModule,
    ThrottlerModule.forRoot([
      {
        ttl: 10000,
        limit: 5,
      },
    ]),
  ],
  controllers: [AppController, TestingController],
  providers: [AppService],
})
export class AppModule {}
