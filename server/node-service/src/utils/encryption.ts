import { createDecipheriv, pbkdf2Sync } from "crypto";
import { badRequest } from "../common/error";

// Spring's Encryptors.text uses AES-256-CBC with PBKDF2 (HmacSHA1, 1024 iterations).
const ALGORITHM = "aes-256-cbc";
const KEY_LENGTH = 32; // 256 bits
const IV_LENGTH = 16;  // 128 bits
const ITERATIONS = 1024;
const DIGEST = "sha1";

// You must set these to match your Java config:
const PASSWORD = process.env.LOWCODER_NODE_SERVICE_SECRET || "lowcoderpwd";
const SALT_HEX = process.env.LOWCODER_NODE_SERVICE_SECRET_SALT || "lowcodersalt";

/**
 * Derive key from password and salt using PBKDF2WithHmacSHA1 (Spring's default).
 */
function deriveKey(password: string, saltHex: string): Buffer {
  const salt = Buffer.from(saltHex, "utf8");
  return pbkdf2Sync(password, salt, ITERATIONS, KEY_LENGTH, DIGEST);
}

/**
 * Decrypt a string encrypted by Spring's Encryptors.text.
 */
export async function decryptString(encrypted: string): Promise<string> {
  try {
    // Spring's format: hex(salt) + encryptedHex(IV + ciphertext)
    const key = deriveKey(PASSWORD, SALT_HEX);

    const encryptedBuf = Buffer.from(encrypted, "hex");
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