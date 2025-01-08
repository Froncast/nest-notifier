export interface NotificationProvider<T> {
  send(args: T): Promise<void>
}
