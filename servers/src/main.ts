import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'
import { ConfigService } from '@nestjs/config'

async function bootstrap() {
    const app = await NestFactory.create(AppModule, {
        cors: true,
    })

    const config = app.get(ConfigService)

    // 设置 api 访问前缀
    const prefix = config.get<string>('app.prefix')
    app.setGlobalPrefix(prefix)

    await app.listen(8080)
}
bootstrap()
