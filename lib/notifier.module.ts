import { ClassProvider, DynamicModule, Module, Provider, ValueProvider } from '@nestjs/common'
import { ASYNC_OPTIONS_TYPE, ConfigurableModuleClass, OPTIONS_TYPE } from './notifier.module-definition'
import { NOTIFIER_GLOBAL_MODULE_OPTIONS, NOTIFIER } from './constants'
import { Notifier } from './notifier'
import { NotifierEmailModule } from './transports/email/mailer.module'
import { NotifierFirebaseModule } from './transports/firebase/firebase.module'
import { INotifierModuleOptions } from './interfaces'

@Module({})
export class NotifierModule extends ConfigurableModuleClass {
  static register(options: typeof OPTIONS_TYPE): DynamicModule {
    const notifierGlobalOptionsProvider: ValueProvider<INotifierModuleOptions> = {
      provide: NOTIFIER_GLOBAL_MODULE_OPTIONS,
      useValue: options,
    }

    const notifierProvider: ClassProvider = {
      provide: NOTIFIER,
      useClass: Notifier,
    }

    return {
      ...super.register(options),
      global: true,
      imports: [
        NotifierEmailModule.register(options.email || {}),
        NotifierFirebaseModule.register(options.firebase || {}),
      ],
      providers: [notifierGlobalOptionsProvider, notifierProvider],
      exports: [NOTIFIER_GLOBAL_MODULE_OPTIONS, NOTIFIER],
    }
  }

  static registerAsync(options: typeof ASYNC_OPTIONS_TYPE): DynamicModule {
    const asyncProviders = this.createAsyncProviders(options)

    return {
      ...super.registerAsync(options),
      imports: [NotifierFirebaseModule],
      providers: [
        ...asyncProviders,
        {
          provide: NOTIFIER_GLOBAL_MODULE_OPTIONS,
          useFactory: (options: INotifierModuleOptions) => options,
          inject: [NOTIFIER_GLOBAL_MODULE_OPTIONS],
        },
        Notifier,
      ],
      exports: [Notifier, NOTIFIER_GLOBAL_MODULE_OPTIONS],
    }
  }

  private static createAsyncProviders(options: typeof ASYNC_OPTIONS_TYPE): Provider[] {
    if (options.useFactory) {
      return [
        {
          provide: NOTIFIER_GLOBAL_MODULE_OPTIONS,
          useFactory: options.useFactory,
          inject: options.inject || [],
        },
      ]
    }

    return []
  }

  static forFeature(options: typeof OPTIONS_TYPE): DynamicModule {
    const notifierProvider: ClassProvider = {
      provide: NOTIFIER,
      useClass: Notifier,
    }

    const providers = [notifierProvider]

    const exports = [NOTIFIER]

    return {
      module: NotifierModule,
      imports: [
        NotifierEmailModule.forFeature(options.email),
        NotifierFirebaseModule.forFeature(options.firebase?.template),
      ],
      providers,
      exports,
    }
  }
}
