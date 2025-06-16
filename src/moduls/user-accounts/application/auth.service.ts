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

  async loginUser(
    dto: LoginDto,
    res: Response,
  ): Promise<{ accessToken: string }> {
    console.log('LOGIN: Starting login process for:', dto.loginOrEmail);

    // 1. Находим пользователя
    const user = await this.authRepository.findUserByLoginOrEmail(
      dto.loginOrEmail,
    );

    if (!user) {
      console.log('LOGIN: ERROR - User not found');
      throw new UnauthorizedException('Invalid credentials');
    }

    // 2. Проверяем активность аккаунта
    if (user.deletion_status === 'deleted') {
      console.log('LOGIN: ERROR - Account deleted');
      throw new UnauthorizedException('Account deleted');
    }

    // 3. Проверяем пароль
    const isMatch = await bcrypt.compare(dto.password, user.password_hash);
    if (!isMatch) {
      console.log('LOGIN: ERROR - Password does not match');
      throw new UnauthorizedException('Invalid credentials');
    }

    // 4. Генерируем токены
    const payload = { userId: user.id };
    const accessToken = await this.jwtService.signAsync(payload, {
      secret: 'ACCESS_SECRET',
      expiresIn: '10s',
    });

    const refreshToken = await this.jwtService.signAsync(payload, {
      secret: 'REFRESH_SECRET',
      expiresIn: '20s',
    });

    // 5. Устанавливаем куки
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 20 * 1000,
    });

    return { accessToken };
  }
}
