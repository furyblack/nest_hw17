import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthRepository } from '../infrastructure/auth.repository';
import { CreateUserInputDto, LoginDto } from '../dto/create-input-dto';
import * as bcrypt from 'bcrypt';
import { UsersRepository } from '../infrastructure/users.repository';

@Injectable()
export class AuthService {
  constructor(
    private readonly authRepository: AuthRepository,
    private readonly usersRepository: UsersRepository,
  ) {}

  async registerUser(dto: CreateUserInputDto): Promise<string> {
    // Проверка на существующий логин
    const existingLoginUser = await this.usersRepository.findByLogin(dto.login);
    if (existingLoginUser) {
      throw new BadRequestException({
        message: 'User with the same login already exists',
        field: 'login',
      });
    }

    // Проверка на существующий email
    const existingEmailUser = await this.usersRepository.findByEmail(dto.email);
    if (existingEmailUser) {
      throw new BadRequestException({
        message: 'User with the same email already exists',
        field: 'email',
      });
    }

    // Хешируем пароль
    const passwordHash = await bcrypt.hash(dto.password, 10);

    // Создаем пользователя
    const user = await this.authRepository.createUser({
      login: dto.login,
      email: dto.email,
      passwordHash,
    });

    return user.id; // возвращаем id нового пользователя
  }

  async validateUser(dto: LoginDto): Promise<any> {
    const user = await this.authRepository.findUserByLoginOrEmail(
      dto.loginOrEmail,
    );
    if (!user) throw new UnauthorizedException();

    const isMatch = await bcrypt.compare(dto.password, user.password_hash);
    if (!isMatch) throw new UnauthorizedException();

    return user;
  }
}
