import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'
import { ConfigService } from '@nestjs/config'

import express from 'express'
import path from 'path'

import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'

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

    const swaggerOptions = new DocumentBuilder()
        .setTitle('Nest-Admin App')
        .setDescription('Nest-Admin App 接口文档')
        .setVersion('2.0.0')
        .addBearerAuth()
        .build()
    const document = SwaggerModule.createDocument(app, swaggerOptions)
    // 项目依赖当前文档功能，最好不要改变当前地址
    // 生产环境使用 nginx 可以将当前文档地址 屏蔽外部访问
    SwaggerModule.setup(`${prefix}/docs`, app, document, {
        swaggerOptions: {
            persistAuthorization: true,
        },
        customSiteTitle: 'Nest-Admin API Docs',
    })

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
        Chalk.green('swagger 文档地址        '),
        `http://localhost:${port}${prefix}/docs/`,
    )
}
bootstrap()
