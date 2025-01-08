import { Inject } from '@nestjs/common'
import { NOTIFIER_FIREBASE_SERVICE } from '../constants'

export const InjectFirebaseNotificationService = () => Inject(NOTIFIER_FIREBASE_SERVICE)
