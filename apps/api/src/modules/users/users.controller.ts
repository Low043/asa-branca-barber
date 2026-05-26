import { Controller, Post, Body } from '@nestjs/common';
import { UsersService } from './users.service';
import { LoginDto } from './dtos/user.dto';

@Controller('/users')
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Post('/login')
  async login(@Body() dto: LoginDto) {
    return await this.users.login(dto);
  }
}
