import { Injectable, Logger } from '@nestjs/common'
import { get, defaultsDeep } from 'lodash'
import { SentMessageInfo, Transporter } from 'nodemailer'
import SMTPTransport from 'nodemailer/lib/smtp-transport'
import { IMailerTransportFactory, ISendMailOptions, MailerOptions, TemplateAdapter } from './interfaces'
import { MailerTransportFactory } from './mailer-transport.factory'
import { NotificationProvider } from '../../interfaces'

@Injectable()
export class NotificationEmailProvider implements NotificationProvider<ISendMailOptions> {
  private readonly mailerLogger = new Logger(NotificationEmailProvider.name)
  private transporter!: Transporter
  private transporters = new Map<string, Transporter>()
  private readonly templateAdapter: TemplateAdapter
  private readonly transportFactory: IMailerTransportFactory
  private initTemplateAdapter(templateAdapter: TemplateAdapter, transporter: Transporter): void {
    if (templateAdapter) {
      transporter.use('compile', (mail, callback) => {
        if (mail.data.html) {
          return callback()
        }

        return templateAdapter.compile(mail, callback, this.options)
      })

      let previewEmail

      try {
        previewEmail = require('preview-email')
      } catch (err) {
        this.mailerLogger.warn(
          'preview-email is not installed. This is an optional dependency. Install it if you want to preview emails in the development environment. You can install it using npm (npm install preview-email), yarn (yarn add preview-email), or pnpm (pnpm add preview-email).',
        )
      }

      if (this.options.preview) {
        transporter.use('stream', (mail, callback) => {
          if (typeof previewEmail !== 'undefined') {
            return previewEmail(mail.data, this.options.preview)
              .then(() => callback())
              .catch(callback)
          } else {
            this.mailerLogger.warn('previewEmail is not available. Skipping preview.')
            return callback()
          }
        })
      }
    }
  }

  constructor(private readonly options: MailerOptions) {
    this.transportFactory = new MailerTransportFactory(options)

    this.templateAdapter = get(this.options, 'template.adapter')

    if (this.options.preview) {
      const defaults = { open: { wait: false } }
      this.options.preview =
        typeof this.options.preview === 'boolean' ? defaults : defaultsDeep(this.options.preview, defaults)
    }

    this.setupTransporters()
  }

  private verifyTransporter(transporter: Transporter, name?: string): void {
    const transporterName = name ? ` '${name}'` : ''
    if (!transporter.verify) return
    Promise.resolve(transporter.verify())
      .then(() => this.mailerLogger.debug(`Transporter${transporterName} is ready`))
      .catch((error) =>
        this.mailerLogger.error(`Error occurred while verifying the transporter${transporterName}: ${error.message}`),
      )
  }

  private createTransporter(config: string | SMTPTransport | SMTPTransport.Options, name?: string): Transporter {
    const transporter = this.transportFactory.createTransport(config)
    if (this.options.verifyTransporters) this.verifyTransporter(transporter, name)
    this.initTemplateAdapter(this.templateAdapter, transporter)
    return transporter
  }

  private setupTransporters(): void {
    if (this.options.transports) {
      Object.keys(this.options.transports).forEach((name) => {
        const transporter = this.createTransporter(this.options.transports![name], name)
        this.transporters.set(name, transporter)
      })
    }

    if (this.options.transport) {
      this.transporter = this.createTransporter(this.options.transport)
    }
  }

  public async send(sendMailOptions: ISendMailOptions): Promise<SentMessageInfo> {
    if (sendMailOptions.transporterName) {
      if (this.transporters && this.transporters.get(sendMailOptions.transporterName)) {
        return await this.transporters.get(sendMailOptions.transporterName)!.sendMail(sendMailOptions)
      } else {
        throw new ReferenceError(`Transporters object doesn't have ${sendMailOptions.transporterName} key`)
      }
    } else {
      if (this.transporter) {
        return await this.transporter.sendMail(sendMailOptions)
      } else {
        throw new ReferenceError(`Transporter object undefined`)
      }
    }
  }
}
