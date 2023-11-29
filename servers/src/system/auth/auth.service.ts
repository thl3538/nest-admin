import { Inject, Injectable } from '@nestjs/common'

import { UserService } from '../user/user.service'
import { UserEntity } from '../user/user.entity'

@Injectable()
export class AuthService {
    constructor(
        @Inject(UserService)
        private readonly userService: UserService,
    ) {}

    async validateUser(payload: { id: string }): Promise<UserEntity> {
        return await this.userService.findOneById(payload.id)
    }
}
