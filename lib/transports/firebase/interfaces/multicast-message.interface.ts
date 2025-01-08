import { MulticastMessage as FirebaseMulticastMessage, Notification } from 'firebase-admin/lib/messaging/messaging-api'

export interface MulticastMessageWithoutTemplate extends Omit<FirebaseMulticastMessage, 'tokens' | 'notification'> {
  tokens: string | string[]
  notification?: Notification
}

export interface MulticastMessageWithTemplate extends Omit<FirebaseMulticastMessage, 'tokens' | 'notification'> {
  tokens: string | string[]
  notification?: {
    template?: {
      name: string
      key: string
    }
    context?: Record<string, unknown>
  }
}
