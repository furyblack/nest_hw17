import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Post,
  Query,
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
  async getAllUsers(
    @Query('sortBy') sortBy: string = 'created_at',
    @Query('sortDirection') sortDirection: 'asc' | 'desc' = 'desc',
    @Query('pageNumber') pageNumber: number = 1,
    @Query('pageSize') pageSize: number = 10,
    @Query('searchLoginTerm') searchLoginTerm?: string,
    @Query('searchEmailTerm') searchEmailTerm?: string,
  ) {
    const result = await this.usersService.findAll({
      sortBy,
      sortDirection,
      pageNumber: Number(pageNumber),
      pageSize: Number(pageSize),
      searchLoginTerm,
      searchEmailTerm,
    });
    console.log('RESULT BEFORE RETURN', JSON.stringify(result.items, null, 2));

    // мапим перед возвратом
    return {
      pagesCount: Math.ceil(result.totalCount / pageSize),
      page: pageNumber,
      pageSize: pageSize,
      totalCount: result.totalCount,
      items: result.items.map((user) => this.mapUserToOutput(user)),
    };
  }

  @Get(':id')
  async getUserById(@Param('id') id: string) {
    const user = await this.usersService.findById(id);
    return this.mapUserToOutput(user);
  }

  @Delete(':id')
  @HttpCode(204)
  deleteUserById(@Param('id') id: string) {
    return this.usersService.deleteById(id);
  }

  private mapUserToOutput(user: any) {
    console.log('MAP INPUT', JSON.stringify(user, null, 2));
    return {
      id: user.id,
      login: user.login,
      email: user.email,
      createdAt: user.createdAt || user.created_at, // преобразуем snake_case -> camelCase
    };
  }

  private hashPassword(password: string): string {
    return createHash('sha256').update(password).digest('hex');
  }
}
