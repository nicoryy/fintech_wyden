import {
  Controller,
  Post,
  Body,
  Patch,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { JwtPayload } from '../../common/types/jwt-payload.type';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post('register')
  create(@Body() dto: CreateUserDto) {
    return this.usersService.create(dto);
  }

  // No :id routes and no GET / here on purpose — this used to accept an
  // arbitrary user id from the URL with nothing checking it against the
  // caller's token (IDOR: any authenticated user could read/edit/delete any
  // other user, including changing their password). Every write is scoped to
  // the token's own id via @CurrentUser(); profile reads already live at
  // GET /auth/me.
  @UseGuards(JwtAuthGuard)
  @Patch('me')
  update(@CurrentUser() user: JwtPayload, @Body() dto: UpdateUserDto) {
    return this.usersService.update(user.id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('me')
  remove(@CurrentUser() user: JwtPayload) {
    return this.usersService.remove(user.id);
  }
}
