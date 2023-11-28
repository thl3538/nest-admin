import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { UserEntity } from './user.entity'
import { UserService } from './user.service'
import { BaseController } from './base.controller'

@Module({
    imports: [TypeOrmModule.forFeature([UserEntity])],
    providers: [UserService],
    controllers: [BaseController],
    exports: [UserService],
})
export class UserModule {}
