import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { UsersRepository } from './infrastructure/users.repository';
import { UsersController } from './api/users.controller';
import { UsersService } from './application/users.service';
import { AuthController } from './api/auth.controller';
import { AuthService } from './application/auth.service';
import { AuthRepository } from './infrastructure/auth.repository';

@Module({
  imports: [
    JwtModule.register({
      secret: 'secret-key', // TODO return process.env.JWT_SECRET ||
      signOptions: { expiresIn: '20s' }, // Базовые настройки
    }),
  ],
  controllers: [UsersController, AuthController],
  providers: [UsersRepository, UsersService, AuthService, AuthRepository],

  exports: [
    UsersRepository,
    JwtModule,
    /* MongooseModule реэкспорт делаем, если хотим чтобы зарегистрированные здесь модельки могли
    инджектиться в сервисы других модулей, которые импортнут этот модуль */
  ],
})
export class UserAccountsModule {}
