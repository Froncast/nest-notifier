import { ConfigurableModuleBuilder } from '@nestjs/common'
import { INotifierModuleOptions } from './interfaces'

export const { ConfigurableModuleClass, MODULE_OPTIONS_TOKEN, OPTIONS_TYPE, ASYNC_OPTIONS_TYPE } =
  new ConfigurableModuleBuilder<INotifierModuleOptions>().build()
