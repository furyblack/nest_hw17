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
    const user = await this.authRepository.findUserByLoginOrEmail(
      dto.loginOrEmail,
    );
    console.log('LOGIN: found user:', user);
    if (!user) {
      console.log('LOGIN: user not found');
      throw new UnauthorizedException();
    }
    console.log('LOGIN: passwordHash in db =', user.passwordHash);
    const isMatch = await bcrypt.compare(dto.password, user.password_hash);
    console.log('LOGIN: password match?', isMatch);
    if (!isMatch) {
      console.log('LOGIN: password does not match');
      throw new UnauthorizedException();
    }

    const payload = { userId: user.id };

    const accessToken = await this.jwtService.signAsync(payload, {
      secret: 'ACCESS_SECRET', // вынеси в env
      expiresIn: '10s',
    });

    const refreshToken = await this.jwtService.signAsync(payload, {
      secret: 'REFRESH_SECRET', // вынеси в env
      expiresIn: '20s',
    });

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: true, // на локалке можно временно отключить для тестов
      maxAge: 20 * 1000, // 20 секунд
    });

    return { accessToken };
  }
}
