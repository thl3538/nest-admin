import { Injectable } from '@nestjs/common'
import { InjectEntityManager, InjectRepository } from '@nestjs/typeorm'
import { EntityManager, Repository } from 'typeorm'
import { UserEntity } from './user.entity'
import { CreateUserDto } from './dto/create-user.dto'
import { ResultData } from 'src/common/utils/result'
import { AppHttpCode } from 'src/common/enum/code.enum'
import { genSalt, hash } from 'bcryptjs'
import { plainToInstance } from 'class-transformer'

@Injectable()
export class UserService {
    constructor(
        @InjectRepository(UserEntity)
        private readonly userRepo: Repository<UserEntity>,
        @InjectEntityManager()
        private readonly userManager: EntityManager,
    ) {}
    /** 创建用户 */
    async create(dto: CreateUserDto): Promise<ResultData> {
        if (dto.password !== dto.confirmPassword) {
            return ResultData.fail(
                AppHttpCode.USER_PASSWORD_INVALID,
                '两次输入的密码不一致，请重试',
            )
        }
        if (await this.userRepo.findOne({ where: { account: dto.account } })) {
            return ResultData.fail(
                AppHttpCode.USER_CREATE_EXISTING,
                '账号已存在，请调整后重新注册！',
            )
        }
        if (await this.userRepo.findOne({ where: { phoneNum: dto.phoneNum } })) {
            return ResultData.fail(
                AppHttpCode.USER_CREATE_EXISTING,
                '当前手机号已存在，请调整后重新注册！',
            )
        }
        if (await this.userRepo.findOne({ where: { email: dto.email } }))
            return ResultData.fail(
                AppHttpCode.USER_CREATE_EXISTING,
                '当前邮箱已存在，请调整后重新注册',
            )
        const salt = await genSalt()
        dto.password = await hash(dto.password, salt)
        // plainToInstance  忽略转换 @Exclude 装饰器
        const user = plainToInstance(UserEntity, { salt, ...dto }, { ignoreDecorators: true })
        const result = await this.userManager.transaction(async (transactionalEntityManager) => {
            return await transactionalEntityManager.save<UserEntity>(user)
        })
        return ResultData.ok(result)
    }
}
