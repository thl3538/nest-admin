import { Module, forwardRef } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { JwtModule } from '@nestjs/jwt'
import { ConfigModule, ConfigService } from '@nestjs/config'

import { AuthModule } from '../auth/auth.module'

import { UserEntity } from './user.entity'
import { UserService } from './user.service'
import { BaseController } from './base.controller'

@Module({
    imports: [
        TypeOrmModule.forFeature([UserEntity]),
        forwardRef(() => AuthModule),
        JwtModule.registerAsync({
            imports: [ConfigModule],
            useFactory: async (config: ConfigService) => {
                return {
                    secret: config.get('jwt.secretkey'),
                    signOptions: {
                        expiresIn: config.get('jwt.expiresin'),
                    },
                }
            },
            inject: [ConfigService],
        }),
    ],
    providers: [UserService],
    controllers: [BaseController],
    exports: [UserService],
})
export class UserModule {}
