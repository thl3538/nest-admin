import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { InjectEntityManager, InjectRepository } from '@nestjs/typeorm'
import { EntityManager, Repository } from 'typeorm'
import { JwtService } from '@nestjs/jwt'
import { compare, genSalt, hash } from 'bcryptjs'
import { instanceToPlain, plainToInstance } from 'class-transformer'
import ms from 'ms'

import { UserEntity } from './user.entity'
import { CreateUserDto } from './dto/create-user.dto'
import { ResultData } from 'src/common/utils/result'
import { AppHttpCode } from 'src/common/enums/code.enum'
import { RedisKeyPrefix } from 'src/common/enums/redis-key-prefix.enum'
import { LoginUserDto } from './dto/login-user.dto'
import { validEmail, validPhone } from 'src/common/utils/validate'
import { StatusValue } from 'src/common/enums/common.enum'
import { CreateTokenDto } from './dto/create-token.dto'
import { getRedisKey } from 'src/common/utils/utils'
import { RedisService } from 'src/common/libs/redis/redis.service'

@Injectable()
export class UserService {
    constructor(
        @InjectRepository(UserEntity)
        private readonly userRepo: Repository<UserEntity>,
        @InjectEntityManager()
        private readonly userManager: EntityManager,
        private readonly config: ConfigService,
        private readonly jwtService: JwtService,
        private readonly redisService: RedisService,
    ) {}

    async findOneById(id: string): Promise<UserEntity> {
        const redisKey = getRedisKey(RedisKeyPrefix.USER_INFO, id)
        const result = await this.redisService.hGetAll(redisKey)
        // plainToInstance 去除 password slat
        let user = plainToInstance(UserEntity, result, { enableImplicitConversion: true })
        if (!user?.id) {
            user = await this.userRepo.findOne({ where: { id } })
            user = plainToInstance(UserEntity, { ...user }, { enableImplicitConversion: true })
            await this.redisService.hmset(
                redisKey,
                instanceToPlain(user),
                ms(this.config.get<string>('jwt.expiresin')) / 1000,
            )
        }
        user.password = ''
        user.salt = ''
        return user
    }

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

    /** 用户登录 */
    async login(dto: LoginUserDto): Promise<ResultData> {
        const { account, password } = dto
        let user = null
        if (validPhone(dto.account)) {
            // 手机登录
            user = await this.userRepo.findOne({ where: { phoneNum: account } })
        } else if (validEmail(dto.account)) {
            user = await this.userRepo.findOne({ where: { email: account } })
        } else {
            user = await this.userRepo.findOne({ where: { account: account } })
        }

        if (!user) return ResultData.fail(AppHttpCode.USER_PASSWORD_INVALID, '账号或密码错误')
        const checkPassword = await compare(password, user.password)
        if (!checkPassword)
            return ResultData.fail(AppHttpCode.USER_PASSWORD_INVALID, '账号或密码错误')
        if (user.status === StatusValue.FORBIDDEN)
            return ResultData.fail(
                AppHttpCode.USER_ACCOUNT_FORBIDDEN,
                '您已被禁用，如需正常使用请联系管理员',
            )
        // 生成token
        const data = this.genToken({ id: user.id })
        return ResultData.ok(data)
    }

    /**
     * 生成token
     */
    genToken(payload: { id: string }): CreateTokenDto {
        const accessToken = `Bear ${this.jwtService.sign(payload)}`
        const refreshToken = this.jwtService.sign(payload, {
            expiresIn: this.config.get('jwt.refreshExpiresIn'),
        })
        return {
            accessToken,
            refreshToken,
        }
    }

    /**
     * 生成刷新 token
     */
    refreshToken(id: string): string {
        return this.jwtService.sign({ id })
    }

    /** 校验 token */
    verifyToken(token: string): string {
        try {
            if (!token) return null
            const id = this.jwtService.verify(token.replace('Bearer ', ''))
            return id
        } catch (error) {
            return null
        }
    }
}
