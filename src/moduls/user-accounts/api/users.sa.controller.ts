import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { UsersService } from '../application/users.service';
import { BasicAuthGuard } from '../guards/basic/basic-auth.guard';
import { createHash } from 'crypto';

@UseGuards(BasicAuthGuard)
@Controller('sa/users')
export class UsersSaController {
  constructor(private usersService: UsersService) {}

  @Post()
  async createUser(
    @Body() body: { email: string; login: string; password: string },
  ) {
    const passwordHash = this.hashPassword(body.password);
    const result = await this.usersService.createUser({
      email: body.email,
      login: body.login,
      passwordHash,
    });

    return this.mapUserToOutput(result);
  }

  @Get()
  async getAllUsers() {
    const users = await this.usersService.findAll();
    return users.map((user) => this.mapUserToOutput(user));
  }

  @Get(':id')
  async getUserById(@Param('id') id: string) {
    const user = await this.usersService.findById(id);
    return this.mapUserToOutput(user);
  }

  @Delete(':id')
  deleteUserById(@Param('id') id: string) {
    return this.usersService.deleteById(id);
  }

  private mapUserToOutput(user: any) {
    return {
      id: user.id,
      login: user.login,
      email: user.email,
      createdAt: user.created_at, // преобразуем snake_case -> camelCase
    };
  }

  private hashPassword(password: string): string {
    return createHash('sha256').update(password).digest('hex');
  }
}
