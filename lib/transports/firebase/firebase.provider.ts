import { INotifierModuleOptions, type NotificationProvider } from '../../interfaces'
import { Injectable, Logger } from '@nestjs/common'
import * as admin from 'firebase-admin'
import { MulticastMessageWithoutTemplate, MulticastMessageWithTemplate } from './interfaces'
import { MulticastMessage as FirebaseMulticastMessage } from 'firebase-admin/lib/messaging/messaging-api'
import { chunk, get } from 'lodash'
import { NotifierFirebaseAdapters } from './adapters'
import { LodashAdapter } from './adapters/lodashAdapter'
import { MustacheAdapter } from './adapters/mustacheAdapter'

@Injectable()
export class NotificationFirebaseProvider
  implements NotificationProvider<MulticastMessageWithoutTemplate | MulticastMessageWithTemplate>
{
  private readonly logger = new Logger('NotifierModule')
  private templateAdapter: LodashAdapter | MustacheAdapter
  private initTemplateAdapter() {
    if (this.options?.adapter === NotifierFirebaseAdapters.MUSTACHE) {
      this.templateAdapter = new MustacheAdapter()
      return
    }
    this.templateAdapter = new LodashAdapter()
  }

  constructor(private readonly options: INotifierModuleOptions['firebase']['template']) {
    this.initTemplateAdapter()
  }

  async send(args: MulticastMessageWithoutTemplate): Promise<void>
  async send(args: MulticastMessageWithTemplate): Promise<void>
  async send(args: MulticastMessageWithoutTemplate | MulticastMessageWithTemplate) {
    const message = {
      ...args,
    }
    if (Boolean(get(args, 'notification.template'))) {
      message.notification = await this.templateAdapter.compile(args.notification, this.options)
    }
    let tokens: string[]
    if (Array.isArray(args.tokens)) {
      tokens = args.tokens
    } else {
      tokens = [args.tokens]
    }
    const tokensChunks = chunk(tokens, 250)
    for (const tokens of tokensChunks) {
      void this._send({
        ...(message as FirebaseMulticastMessage),
        tokens,
      })
    }
  }

  private async _send(args: FirebaseMulticastMessage) {
    return admin
      .messaging()
      .sendEachForMulticast(args)
      .then((response) => {
        this.logger.debug(response)
        return true
      })
      .catch((error) => {
        this.logger.error(error)
        return false
      })
  }
}
