import { createDecipheriv, createHash } from "crypto";
import { badRequest } from "../common/error";

// Spring's Encryptors.text uses AES-256-CBC with a key derived from password and salt (hex).
// The encrypted string format is: hex(salt) + encryptedBase64
// See: https://docs.spring.io/spring-security/site/docs/current/api/org/springframework/security/crypto/encrypt/Encryptors.html

const ALGORITHM = "aes-256-cbc";
const KEY_LENGTH = 32; // 256 bits
const IV_LENGTH = 16;  // 128 bits

// You must set these to match your Java config:
const PASSWORD = process.env.LOWCODER_NODE_SERVICE_SECRET || "lowcoderpwd";
const SALT_HEX = process.env.LOWCODER_NODE_SERVICE_SECRET_SALT || "lowcodersalt";

/**
 * Convert a string to its binary representation, then to a hex string.
 */
function stringToHexFromBinary(str: string): string {
  // Convert string to binary (Buffer), then to hex string
  return Buffer.from(str, "utf8").toString("hex");
}

/**
 * Derive key from password and salt using SHA-256 (Spring's default).
 */
function deriveKey(password: string, saltHex: string): Buffer {
  // Convert salt string to binary, then to hex string
  const saltHexFromBinary = stringToHexFromBinary(saltHex);
  const salt = Buffer.from(saltHexFromBinary, "hex");
  const hash = createHash("sha256");
  hash.update(password);
  hash.update(salt);
  return hash.digest();
}

/**
 * Decrypt a string encrypted by Spring's Encryptors.text.
 */
export async function decryptString(encrypted: string): Promise<string> {
  try {
    // Spring's format: hex(salt) + encryptedBase64
    // But if you know salt, encrypted is just Base64(IV + ciphertext)
    const key = deriveKey(PASSWORD, SALT_HEX);

    // Spring's Encryptors.text prepends a random IV (16 bytes) to the ciphertext, all base64 encoded.
    const encryptedBuf = Buffer.from(encrypted, "base64");
    const iv = encryptedBuf.slice(0, IV_LENGTH);
    const ciphertext = encryptedBuf.slice(IV_LENGTH);

    const decipher = createDecipheriv(ALGORITHM, key, iv);
    let decrypted = decipher.update(ciphertext, undefined, "utf8");
    decrypted += decipher.final("utf8");
    return decrypted;
  } catch (e) {
    throw badRequest("Failed to decrypt string");
  }
}