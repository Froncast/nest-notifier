import { Inject } from '@nestjs/common'
import { NOTIFIER } from '../constants'

export const InjectNotifier = () => Inject(NOTIFIER)
