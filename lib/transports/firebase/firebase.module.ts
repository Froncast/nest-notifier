import { DynamicModule, FactoryProvider, Logger, Module, Provider } from '@nestjs/common'
import * as admin from 'firebase-admin'
import { NotificationFirebaseProvider } from './firebase.provider'
import { NOTIFIER_GLOBAL_MODULE_OPTIONS, NOTIFIER_FIREBASE_SERVICE } from '../../constants'
import { merge } from 'lodash'
import { OPTIONS_TYPE } from '../../notifier.module-definition'
import { generate } from '../../utils/generate-unique-string'

@Module({})
export class NotifierFirebaseModule {
  private static logger = new Logger('NotifierModule')

  static register(options: typeof OPTIONS_TYPE.firebase = {}): DynamicModule {
    const notificationFirebaseProvider: Provider = {
      provide: NOTIFIER_FIREBASE_SERVICE,
      useValue: new NotificationFirebaseProvider(options.template),
    }

    this.initializeApp(options.credential)

    return {
      module: NotifierFirebaseModule,
      providers: [notificationFirebaseProvider],
      exports: [NOTIFIER_FIREBASE_SERVICE],
    }
  }

  private static initializeApp(credentials: admin.ServiceAccount): void {
    if (!credentials) {
      return
    }

    const isAllCredentialsSpecified = Object.values(credentials).every((value) => Boolean(value))

    if (!isAllCredentialsSpecified) {
      Object.keys(credentials).forEach((key) => {
        if (!credentials[key]) {
          this.logger.warn(`FirebaseConfig: The value for the "${key}" variable is not set`)
        }
      })

      return
    }

    try {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: credentials.projectId,
          privateKey: credentials.privateKey.replace(/\\n/g, '\n'),
          clientEmail: credentials.clientEmail,
        }),
      })
    } catch (error) {
      this.logger.error(error)
    }
  }

  static forFeature(options?: typeof OPTIONS_TYPE.firebase.template): DynamicModule {
    const uniqueProvider = {
      provide: generate(),
      useValue: options,
    }

    const notificationProvider: FactoryProvider = {
      provide: NOTIFIER_FIREBASE_SERVICE,
      useFactory: (globalOptions: typeof OPTIONS_TYPE, _: string) =>
        new NotificationFirebaseProvider(merge({}, globalOptions?.firebase?.template, options)),
      inject: [NOTIFIER_GLOBAL_MODULE_OPTIONS, uniqueProvider.provide],
    }

    return {
      module: NotifierFirebaseModule,
      providers: [notificationProvider, uniqueProvider],
      exports: [NOTIFIER_FIREBASE_SERVICE],
    }
  }
}
