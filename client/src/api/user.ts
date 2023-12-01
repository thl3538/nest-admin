import request from '@/utils/request'
import {
    ApiMethodContants,
    type BaseResult,
    type ListResultData,
    type Pagination,
    type ResultData,
} from './base'
import { getRefreshToken } from '@/utils/cache'

/** 返回用户类型 */
export interface UserApiResult extends BaseResult {
    /** 用户头像 */
    avatar?: string
    /** 账号 */
    account?: string
    /** 用户手机号 */
    phoneNum?: string
    /** 用户邮箱 */
    email?: string
    /** 用户类型 0-超管 1-普通用户 */
    type?: 0 | 1
    /** 用户状态 1-活动中 0-禁用 */
    status?: 0 | 1 | string
}

export interface UserLogin {
    account: string
    password: string
}

export interface LoginResult {
    accessToken: string
    refreshToken: string
}

export interface ICreateOrUpdateUser extends UserApiResult {
    password?: string
    roleIds?: number[]
}

export interface QueryUserList extends Pagination {
    /** 帐号，手机号，名称 */
    account?: string
    /** 用户是否可用 */
    status?: string | 0 | 1
    /** 角色id */
    roleId?: string
    /** 是否绑定当前角色 0-无， 1-绑定 */
    hasCurrRole?: 0 | 1
}

export interface BindUserData {
    userIds: string[]
    roleId: string
    type: 'create' | 'cancel'
}

/** 登录 */
export function login(loginData: UserLogin): Promise<ResultData<LoginResult>> {
    return request<ResultData<LoginResult>>({
        url: '/login',
        method: ApiMethodContants.POST,
        data: loginData,
    })
}

export function updateToken(): Promise<ResultData<LoginResult>> {
    return request({
        url: '/update/token',
        method: ApiMethodContants.POST,
        headers: { Authorization: 'Bearer ' + getRefreshToken() },
    })
}
