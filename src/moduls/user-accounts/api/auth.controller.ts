import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { AuthService } from '../application/auth.service';
import { CreateUserInputDto, LoginDto } from '../dto/create-input-dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('registration')
  @HttpCode(HttpStatus.NO_CONTENT)
  async registration(@Body() dto: CreateUserInputDto): Promise<void> {
    await this.authService.registerUser(dto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() dto: LoginDto): Promise<{ message: string }> {
    const user = await this.authService.validateUser(dto);
    // пока возвращаем простое сообщение
    return { message: `User ${user.login} logged in successfully` };
  }
}
