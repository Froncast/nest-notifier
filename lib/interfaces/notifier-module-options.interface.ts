import * as admin from 'firebase-admin'
import { MailerOptions } from '../transports/email/interfaces'
import { NotifierFirebaseAdapters } from '../transports/firebase/adapters'

export interface INotifierModuleOptions {
  firebase?: {
    credential?: admin.ServiceAccount
    template?: {
      dir?: string
      adapter?: NotifierFirebaseAdapters
    }
  }
  email?: MailerOptions
}
