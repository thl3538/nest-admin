import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'
import { ConfigService } from '@nestjs/config'

import express from 'express'
import path from 'path'

import { logger } from './common/libs/log4js/logger.middleware'
import { Logger } from './common/libs/log4js/log4j.util'
import { TransformInterceptor } from './common/libs/log4js/transform.interceptor'
import { HttpExceptionsFilter } from './common/libs/log4js/http-exceptions-filter'
import { ExceptionsFilter } from './common/libs/log4js/exceptions-filter'

import Chalk from 'chalk'

async function bootstrap() {
    const app = await NestFactory.create(AppModule, {
        cors: true,
    })

    const config = app.get(ConfigService)

    // 设置 api 访问前缀
    const prefix = config.get<string>('app.prefix')
    app.setGlobalPrefix(prefix)

    // 日志
    app.use(express.json())
    app.use(express.urlencoded({ extended: true }))
    app.use(logger)
    // 使用全局拦截器打印出参
    app.useGlobalInterceptors(new TransformInterceptor())
    // 所有异常
    app.useGlobalFilters(new ExceptionsFilter())
    app.useGlobalFilters(new HttpExceptionsFilter())
    // 获取配置端口
    const port = config.get<number>('app.port') || 8080
    await app.listen(port)

    const fileUploadLocationConfig = config.get<string>('app.file.location') || '../upload'
    const fileUploadBastPath = path.normalize(
        path.isAbsolute(fileUploadLocationConfig)
            ? `${fileUploadLocationConfig}`
            : path.join(process.cwd(), `${fileUploadLocationConfig}`),
    )
    Logger.log(
        Chalk.green(`Nest-Admin 服务启动成功 `),
        '\n',
        Chalk.green('上传文件存储路径'),
        `        ${fileUploadBastPath}`,
        '\n',
        Chalk.green('服务地址'),
        `                http://localhost:${port}${prefix}/`,
        '\n',
    )
}
bootstrap()
