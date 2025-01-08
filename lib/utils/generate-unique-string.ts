import { randomBytes } from 'node:crypto'

export function generate() {
  return randomBytes(15).toString('base64url')
}
