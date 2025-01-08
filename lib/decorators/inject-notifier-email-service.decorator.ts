import { Inject } from '@nestjs/common'
import { NOTIFIER_EMAIL_SERVICE } from '../constants'

export const InjectNotifierEmailService = () => Inject(NOTIFIER_EMAIL_SERVICE)
