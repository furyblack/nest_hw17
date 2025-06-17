import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthRepository } from '../infrastructure/auth.repository';
import { UsersRepository } from '../infrastructure/users.repository';
import { CreateUserInputDto, LoginDto } from '../dto/create-input-dto';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { EmailService } from '../../notifications/email.service';
import { JwtService } from '@nestjs/jwt';
import { Response } from 'express';
import { randomUUID } from 'crypto';

@Injectable()
export class AuthService {
  constructor(
    private readonly authRepository: AuthRepository,
    private readonly usersRepository: UsersRepository,
    private readonly emailService: EmailService,
    private readonly jwtService: JwtService,
  ) {}

  async registerUser(dto: CreateUserInputDto): Promise<void> {
    // Проверка login
    const existingLoginUser = await this.usersRepository.findByLogin(dto.login);
    if (existingLoginUser) {
      throw new BadRequestException({
        errorsMessages: [
          {
            message: 'User with the same login already exists',
            field: 'login',
          },
        ],
      });
    }

    // Проверка email
    const existingEmailUser = await this.usersRepository.findByEmail(dto.email);
    if (existingEmailUser) {
      throw new BadRequestException({
        errorsMessages: [
          {
            message: 'User with the same email already exists',
            field: 'email',
          },
        ],
      });
    }

    // Хешируем пароль
    const password_hash = await bcrypt.hash(dto.password, 10);
    console.log('REGISTER: Generated hash:', password_hash); // Логируем хеш

    // Генерация кода подтверждения
    const confirmationCode = uuidv4();

    // Создаем пользователя
    const user = await this.authRepository.createUser({
      login: dto.login,
      email: dto.email,
      password_hash,
      confirmationCode,
      isEmailConfirmed: false,
    });
    console.log('REGISTER: Created user:', user); // Логируем созданного пользователя
    // Отправка письма
    this.emailService
      .sendConfirmationEmail(user.email, confirmationCode)
      .catch((err) => {
        console.error('Error sending confirmation email', err);
      });

    // Возвращаем 204 (ничего не возвращаем)
  }

  private generateAccessToken(userId: string, login: string): string {
    return this.jwtService.sign(
      { userId, login },
      { secret: 'ACCESS_SECRET', expiresIn: '10s' },
    );
  }

  private generateRefreshToken(userId: string, deviceId: string): string {
    return this.jwtService.sign(
      { userId, deviceId },
      { secret: 'REFRESH_SECRET', expiresIn: '20s' },
    );
  }

  async login(
    dto: LoginDto,
    ip: string,
    userAgent: string,
    response: Response,
  ): Promise<{ accessToken: string }> {
    // 1. Находим пользователя
    const user = await this.usersRepository.findByLoginOrEmail(
      dto.loginOrEmail,
    );
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // 2. Проверяем пароль
    const isMatch = await bcrypt.compare(dto.password, user.password_hash);
    if (!isMatch) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // 3. Генерируем токены
    const deviceId = randomUUID();
    const accessToken = this.generateAccessToken(user.id, user.login);
    const refreshToken = this.generateRefreshToken(user.id, deviceId);

    // 4. Сохраняем сессию (если нужно)
    // await this.sessionService.createSession({
    //   ip,
    //   title: userAgent,
    //   deviceId,
    //   userId: user.id,
    //   lastActiveDate: new Date()
    // });

    // 5. Устанавливаем куки
    response.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 20 * 1000,
    });

    return { accessToken };
  }
}
