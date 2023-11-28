import { Module } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm'
import { ServeStaticModule, ServeStaticModuleOptions } from '@nestjs/serve-static'
import { AppController } from './app.controller'
import { AppService } from './app.service'
import * as path from 'path'

import configuration from './config/index'
import { RedisClientOptions } from '@liaoliaots/nestjs-redis'
import { RedisModule } from './common/libs/redis/redis.module'

import { UserModule } from './system/user/user.module'

@Module({
    imports: [
        // 配置模块
        ConfigModule.forRoot({
            cache: true,
            load: [configuration],
            isGlobal: true,
        }),
        // 服务静态化, 生产环境最好使用 nginx 做资源映射， 可以根据环境配置做区分
        ServeStaticModule.forRootAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: (config: ConfigService) => {
                const fileUploadLocationConfig =
                    config.get<string>('app.file.location') || '../upload'
                const rootPath = path.isAbsolute(fileUploadLocationConfig)
                    ? `${fileUploadLocationConfig}`
                    : path.join(process.cwd(), `${fileUploadLocationConfig}`)
                return [
                    {
                        rootPath,
                        exclude: [`${config.get('app.prefix')}`],
                        serveRoot: config.get('app.file.serveRoot'),
                        serveStaticOptions: {
                            cacheControl: true,
                        },
                    },
                ] as ServeStaticModuleOptions[]
            },
        }),
        TypeOrmModule.forRootAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: (config: ConfigService) => {
                return {
                    type: 'mysql',
                    // 可能不再支持这种方式，entities 将改成接收 实体类的引用
                    //
                    // entities: [`${__dirname}/**/*.entity{.ts,.js}`],
                    autoLoadEntities: true,
                    keepConnectionAlive: true,
                    ...config.get('db.mysql'),
                } as TypeOrmModuleOptions
            },
        }),
        // libs redis
        RedisModule.forRootAsync(
            {
                imports: [ConfigModule],
                inject: [ConfigService],
                useFactory: (config: ConfigService) => {
                    return {
                        closeClient: true,
                        readyLog: true,
                        errorLog: true,
                        config: config.get<RedisClientOptions>('redis'),
                    }
                },
            },
            true,
        ),
        UserModule,
    ],
    controllers: [AppController],
    providers: [AppService],
})
export class AppModule {}
