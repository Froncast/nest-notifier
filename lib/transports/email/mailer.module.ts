import { DynamicModule, FactoryProvider, Module, ValueProvider } from '@nestjs/common'
import { OPTIONS_TYPE } from '../../notifier.module-definition'
import { NotificationEmailProvider } from './mailer.service'
import { NOTIFIER_EMAIL_SERVICE, NOTIFIER_GLOBAL_MODULE_OPTIONS } from '../../constants'
import { merge } from 'lodash'
import { generate } from '../../utils/generate-unique-string'

@Module({})
export class NotifierEmailModule {
  static register(options: typeof OPTIONS_TYPE.email): DynamicModule {
    const notificationProvider: ValueProvider = {
      provide: NOTIFIER_EMAIL_SERVICE,
      useValue: new NotificationEmailProvider(options),
    }

    return {
      module: NotifierEmailModule,
      providers: [notificationProvider],
      exports: [NOTIFIER_EMAIL_SERVICE],
    }
  }

  static forFeature(options: typeof OPTIONS_TYPE.email): DynamicModule {
    const uniqueProvider = {
      provide: generate(),
      useValue: options,
    }

    const notificationProvider: FactoryProvider = {
      provide: NOTIFIER_EMAIL_SERVICE,
      useFactory: (globalOptions: typeof OPTIONS_TYPE, _: string) =>
        new NotificationEmailProvider(merge({}, globalOptions?.email, options)),
      inject: [NOTIFIER_GLOBAL_MODULE_OPTIONS, uniqueProvider.provide],
    }

    return {
      module: NotifierEmailModule,
      providers: [notificationProvider, uniqueProvider],
      exports: [NOTIFIER_EMAIL_SERVICE],
    }
  }
}
