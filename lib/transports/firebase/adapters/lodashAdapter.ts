import { basename, isAbsolute, dirname, join } from 'path'
import { get, template } from 'lodash'
import { INotifierModuleOptions } from '../../../interfaces'
import { readFile } from 'fs/promises'
import { Notification } from 'firebase-admin/lib/messaging/messaging-api'

export class LodashAdapter {
  async compile(notification: any, options: INotifierModuleOptions['firebase']['template']) {
    const templateExt = '.json'
    const templateName = basename(notification?.template?.name, templateExt)
    const templateDir = isAbsolute(notification?.template?.name)
      ? dirname(notification?.template?.name)
      : join(get(options, 'dir', ''), dirname(notification?.template?.name))
    const templatePath = join(templateDir, templateName + templateExt)

    const templateFile = await readFile(templatePath, 'utf-8')
      .then((template) => JSON.parse(template))
      .catch((err) => {
        console.error(err)
      })

    const result: Notification = {}

    const notificationTemplate = templateFile?.[notification?.template?.key]

    if (!notificationTemplate) {
      return
    }

    Object.keys(notificationTemplate).forEach((key) => {
      if (notificationTemplate[key]) {
        const compiled = template(notificationTemplate[key])
        result[key] = compiled(notification?.context)
      }
    })

    return result
  }
}
