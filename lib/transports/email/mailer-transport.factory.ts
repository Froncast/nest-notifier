import { createTransport } from 'nodemailer'
import * as Mail from 'nodemailer/lib/mailer'
import { IMailerTransportFactory, MailerOptions, TransportType } from './interfaces'

export class MailerTransportFactory implements IMailerTransportFactory {
  constructor(private readonly options: MailerOptions) {}

  public createTransport(opts?: TransportType): Mail {
    return createTransport(opts || this.options.transport, this.options.defaults)
  }
}
