import { Injectable, Logger } from '@nestjs/common'
import { type NotificationProvider } from './interfaces'
import { ISendMailOptions } from './transports/email/interfaces'
import { NotificationTransports } from './transports/transports'
import { InjectNotifierEmailService, InjectFirebaseNotificationService } from './decorators'
import { MulticastMessageWithoutTemplate, MulticastMessageWithTemplate } from './transports/firebase/interfaces'

@Injectable()
export class Notifier {
  private readonly logger = new Logger('NotifierModule')

  constructor(
    @InjectNotifierEmailService()
    private readonly emailProvider: NotificationProvider<ISendMailOptions>,
    @InjectFirebaseNotificationService()
    private readonly firebaseProvider: NotificationProvider<
      MulticastMessageWithoutTemplate | MulticastMessageWithTemplate
    >,
  ) {}

  private isMulticastMessageWithTemplate(args: any): args is MulticastMessageWithTemplate {
    return Boolean(args.notification && args.notification.template)
  }

  /**
   * Sends notifications using the specified transport method.
   *
   * This method supports email and Firebase transports. It determines the
   * correct provider to use based on the `transport` argument and forwards
   * the message to that provider for sending.
   *
   * @param {NotificationTransports} transport - The transport method to use for sending the message.
   *        Can be one of `Transports.EMAIL` or `Transports.FIREBASE`.
   * @param {unknown} args - The message arguments. The type of `args` depends
   *        on the selected transport:
   *        - For `Transports.EMAIL`, `args` should be of type `ISendMailOptions`.
   *        - For `Transports.FIREBASE`, `args` should be of type `MulticastMessageWithoutTemplate`
   *          or `MulticastMessageWithTemplate`.
   *
   * @throws Will log an error message if an exception occurs during sending.
   *
   * @returns {Promise<void>} A promise that resolves once the message has been
   *          handled by the appropriate provider.
   *
   * @example
   * // Sending an email
   * notifierService.send(Transports.EMAIL, emailOptions);
   *
   * @example
   * // Sending a Firebase message without template
   * notifierService.send(Transports.FIREBASE, firebaseMessageWithoutTemplate);
   *
   * @example
   * // Sending a Firebase message with a template
   * notifierService.send(Transports.FIREBASE, firebaseMessageWithTemplate);
   */

  async send(transport: NotificationTransports.EMAIL, args: ISendMailOptions): Promise<void>
  async send(transport: NotificationTransports.FIREBASE, args: MulticastMessageWithoutTemplate): Promise<void>
  async send(transport: NotificationTransports.FIREBASE, args: MulticastMessageWithTemplate): Promise<void>
  async send(transport: NotificationTransports, args: unknown): Promise<void> {
    try {
      if (transport === NotificationTransports.EMAIL) {
        return this.emailProvider.send(args as ISendMailOptions)
      }

      if (transport === NotificationTransports.FIREBASE) {
        if (this.isMulticastMessageWithTemplate(args)) {
          return this.firebaseProvider.send(args as MulticastMessageWithoutTemplate)
        }

        return this.firebaseProvider.send(args as MulticastMessageWithoutTemplate)
      }
    } catch (error) {
      this.logger.error(error)
    }
  }
}
