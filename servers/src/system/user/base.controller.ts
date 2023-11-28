import { Body, Controller, Post } from '@nestjs/common'
import { ApiOperation, ApiTags } from '@nestjs/swagger'
import { UserService } from './user.service'
import { CreateUserDto } from './dto/create-user.dto'
import { ResultData } from 'src/common/utils/result'
import { AllowAnon } from '../../common/decorators/allow-anon.decorator'
import { ApiResult } from '../../common/decorators/api-result.decorator'
import { UserEntity } from './user.entity'

@ApiTags('登录注册')
@Controller()
export class BaseController {
    constructor(private readonly userService: UserService) {}

    @Post('register')
    @ApiOperation({ summary: '用户注册' })
    @ApiResult(UserEntity)
    @AllowAnon()
    async create(@Body() user: CreateUserDto): Promise<ResultData> {
        return await this.userService.create(user)
    }
}
