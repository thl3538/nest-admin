import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { JwtModule } from '@nestjs/jwt'

import { UserEntity } from './user.entity'
import { UserService } from './user.service'
import { BaseController } from './base.controller'
import { ConfigModule, ConfigService } from '@nestjs/config'

@Module({
    imports: [
        TypeOrmModule.forFeature([UserEntity]),
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
