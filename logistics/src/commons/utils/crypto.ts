import crypto from 'crypto'

const ALGORITHM = 'aes-256-gcm'
const ENCRYPTION_KEY = Buffer.from(process.env.MASTER_ENCRYPTION_KEY || '', 'hex')
const IV_LENGTH = 12

export function encryptSecret(plainText: string): string {
  const iv = crypto.randomBytes(IV_LENGTH)
  const cipher = crypto.createCipheriv(ALGORITHM, ENCRYPTION_KEY, iv)

  let encrypted = cipher.update(plainText, 'utf8', 'hex')
  encrypted += cipher.final('hex')

  const authTag = cipher.getAuthTag().toString('hex')

  // Format: iv:authTag:encryptedString
  return `${iv.toString('hex')}:${authTag}:${encrypted}`
}

export function decryptSecret(encryptedData: string): string {
  const [ivHex, authTagHex, encryptedHex] = encryptedData.split(':')

  const iv = Buffer.from(ivHex, 'hex')
  const authTag = Buffer.from(authTagHex, 'hex')
  const decipher = crypto.createDecipheriv(ALGORITHM, ENCRYPTION_KEY, iv)

  decipher.setAuthTag(authTag)

  let decrypted = decipher.update(encryptedHex, 'hex', 'utf8')
  decrypted += decipher.final('utf8')

  return decrypted
}

// Formula: Base64(MD5(Body + Secret))
export function calculateDigest(rawBody: string, plainTextSecret: string): string {
  const inputString = rawBody + plainTextSecret

  return crypto
    .createHash('md5')
    .update(inputString, 'utf8')
    .digest('base64')
}