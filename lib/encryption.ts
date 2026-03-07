import { createCipheriv, createDecipheriv, randomBytes } from "crypto";

const ALGORITHM = "aes-256-gcm";

function getKey(): Buffer {
  const secret = process.env.ENCRYPTION_KEY;
  if (!secret || secret.length < 64) throw new Error("ENCRYPTION_KEY must be a 64-char hex string (32 bytes)");
  const key = Buffer.from(secret, "hex");
  if (key.length !== 32) throw new Error("ENCRYPTION_KEY must decode to exactly 32 bytes");
  return key;
}

function getKeyFromHex(secret: string): Buffer {
  if (!secret || secret.length < 64) throw new Error("Key must be a 64-char hex string (32 bytes)");
  const key = Buffer.from(secret, "hex");
  if (key.length !== 32) throw new Error("Key must decode to exactly 32 bytes");
  return key;
}

export function encrypt(plaintext: string): string {
  const key = getKey();
  const iv = randomBytes(16);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return [iv.toString("hex"), authTag.toString("hex"), encrypted.toString("hex")].join(":");
}

export function decrypt(ciphertext: string): string {
  const [ivHex, authTagHex, encryptedHex] = ciphertext.split(":");
  if (!ivHex || !authTagHex || !encryptedHex) throw new Error("Invalid ciphertext format");
  const iv = Buffer.from(ivHex, "hex");
  const authTag = Buffer.from(authTagHex, "hex");
  const encrypted = Buffer.from(encryptedHex, "hex");

  const tryDecrypt = (key: Buffer): string => {
    const decipher = createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);
    return decipher.update(encrypted, undefined, "utf8") + decipher.final("utf8");
  };

  try {
    return tryDecrypt(getKey());
  } catch {
    const prevSecret = process.env.ENCRYPTION_KEY_PREVIOUS;
    if (prevSecret) {
      try {
        return tryDecrypt(getKeyFromHex(prevSecret));
      } catch {
        // fall through to throw
      }
    }
    throw new Error("Decryption failed");
  }
}
