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

@UseGuards(BasicAuthGuard)
@Controller('sa/users')
export class UsersSaController {
  constructor(private usersService: UsersService) {}

  @Post()
  @Post()
  createUser(@Body() body: { email: string; login: string; password: string }) {
    return this.usersService.createUserWithPassword(body);
  }

  @Get()
  getAllUsers() {
    return this.usersService.findAll();
  }

  @Get(':id')
  getUserById(@Param('id') id: string) {
    return this.usersService.findById(id);
  }

  @Delete(':id')
  deleteUserById(@Param('id') id: string) {
    return this.usersService.deleteById(id);
  }
}
