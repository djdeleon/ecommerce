import { calculateDigest, decryptSecret, encryptSecret } from "#commons/utils/crypto.js";
import { beforeAll, describe, expect, it } from "vitest";

describe('Crypto Utilities', () => {
  const MOCK_KEY = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef'

  beforeAll(() => {
    process.env.MASTER_ENCRYPTION_KEY = MOCK_KEY
  })

  describe('encrypSecret & decryptSecret', () => {
    it('should successfully encrypt and decrypt a plain text string', () => {
      const secret = 'secret-password-123'

      const encrypted = encryptSecret(secret)

      expect(encrypted).toBeDefined()
      expect(encrypted).toContain(':')

      const decrypted = decryptSecret(encrypted)
      expect(decrypted).toBe(secret)
    })

    it('should produce different cipherTexts for the same inputs (due to random IV)', () => {
      const secret = 'same-input'

      const encrypted1 = encryptSecret(secret)
      const encrypted2 = encryptSecret(secret)

      expect(encrypted1).not.toBe(encrypted2)
    })

    it('should throw an error if the encrypted data is tampered with', () => {
      const secret = 'secure-data'
      const encrypted = encryptSecret(secret)

      const parts = encrypted.split(':')
      parts[2] = parts[2].substring(0, parts[2].length - 2) + '00'
      const tamperedData = parts.join(':')

      expect(() => decryptSecret(tamperedData)).toThrow()
    })
  })

  describe('Digest Calculation', () => {
    it('should calculate the correct Base64 MD5 digest', () => {
      const rawBody = '{"user":"john"}'
      const secret = 'my-api-secret'

      // Pre-calculated expected hash for {"user":"john"}my-api-secret
      const expectedDigest = 'hajArw0pWzpZ6Ecdb8S1Mw=='

      const result = calculateDigest(rawBody, secret)

      expect(result).toBe(expectedDigest)
    })

    it('should return different digests for different inputs', () => {
      const digest1 = calculateDigest('body1', 'secret')
      const digest2 = calculateDigest('body2', 'secret')

      expect(digest1).not.toBe(digest2)
    })
  })
})