import { readFileSync } from 'fs'
import * as yaml from 'js-yaml'
import { join } from 'path'

const configFileNameObj = {
    development: 'dev',
}

const env = process.env.NODE_ENV || 'development'

export default () => {
    return yaml.load(
        readFileSync(join(__dirname, `./${configFileNameObj[env]}.yml`), 'utf8'),
    ) as Record<string, any>
}
