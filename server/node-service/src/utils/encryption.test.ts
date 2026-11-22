import { createCipheriv, pbkdf2Sync } from "crypto";

// Vector source: until a Java-produced vector exists, these vectors are built with Node's
// createCipheriv from Spring's documented Encryptors.text scheme (PBKDF2-HmacSHA1, 1024 iterations,
// 256-bit key, salt = the UTF-8 bytes, output = hex(iv || ciphertext)). This is a WEAKER check than a
// Java-produced vector: it shares the scheme assumptions with the code under test, so it proves the code
// implements that scheme, not that the scheme is what Spring really does.
const DEFAULT_PASSWORD = "lowcoderpwd";
const DEFAULT_SALT = "lowcodersalt";
const CUSTOM_PASSWORD = "custom-secret";
const CUSTOM_SALT = "custom-salt";
const ENV_SECRET = "LOWCODER_NODE_SERVICE_SECRET";
const ENV_SALT = "LOWCODER_NODE_SERVICE_SECRET_SALT";
const PBKDF2_ITERATIONS = 1024;
const KEY_BYTES = 32;
const IV_BYTES = 16;
const BAD_REQUEST = 400;
const DECRYPT_FAILED_MESSAGE = "Failed to decrypt string";
const FIXED_IV = Buffer.from("000102030405060708090a0b0c0d0e0f", "hex");
// Chosen because, with the fixed IV and the ASCII plaintext, decryption with the default key deterministically
// fails the padding check ("wrong-salt" happens to yield valid padding, so it is not used).
const WRONG_SALT = "other-salt";
const PLAINTEXT_ASCII = "hello lowcoder";
const PLAINTEXT_UNICODE = "héllo wörld ✓ 日本語 😀";

function encryptLikeSpring(plaintext: string, password: string, salt: string, iv: Buffer = FIXED_IV): string {
  const key = pbkdf2Sync(password, Buffer.from(salt, "utf8"), PBKDF2_ITERATIONS, KEY_BYTES, "sha1");
  const cipher = createCipheriv("aes-256-cbc", key, iv);
  const body = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  return Buffer.concat([iv, body]).toString("hex");
}

// isolateModules gives the module its own registry, so ServiceError must come from the same registry
// for instanceof to be meaningful.
type EncryptionModule = typeof import("./encryption") & { ServiceError: typeof import("../common/error").ServiceError };

const ORIGINAL_ENV = { ...process.env };

function loadWithEnv(env: Record<string, string | undefined>): EncryptionModule {
  let mod!: EncryptionModule;
  jest.isolateModules(() => {
    for (const [k, v] of Object.entries(env)) {
      if (v === undefined) {
        delete process.env[k];
      } else {
        process.env[k] = v;
      }
    }
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    mod = { ...require("./encryption"), ServiceError: require("../common/error").ServiceError };
  });
  return mod;
}

async function expectDecryptFailure(promise: Promise<string>, ServiceError: EncryptionModule["ServiceError"]) {
  const err = await promise.then(
    (v) => {
      throw new Error(`expected rejection, got ${JSON.stringify(v)}`);
    },
    (e) => e
  );
  expect(err).toBeInstanceOf(ServiceError);
  expect(err.code).toBe(BAD_REQUEST);
  expect(err.message).toBe(DECRYPT_FAILED_MESSAGE);
}

afterEach(() => {
  for (const k of Object.keys(process.env)) {
    if (!(k in ORIGINAL_ENV)) delete process.env[k];
  }
  Object.assign(process.env, ORIGINAL_ENV);
});

describe("decryptString with the default secret and salt", () => {
  const defaults = () => loadWithEnv({ [ENV_SECRET]: undefined, [ENV_SALT]: undefined });

  test("returns the exact plaintext of a vector made with the defaults", async () => {
    const { decryptString, ServiceError } = defaults();
    await expect(decryptString(encryptLikeSpring(PLAINTEXT_ASCII, DEFAULT_PASSWORD, DEFAULT_SALT))).resolves.toBe(
      PLAINTEXT_ASCII
    );
  });

  test("returns non-ASCII plaintext as exact UTF-8", async () => {
    const { decryptString, ServiceError } = defaults();
    await expect(decryptString(encryptLikeSpring(PLAINTEXT_UNICODE, DEFAULT_PASSWORD, DEFAULT_SALT))).resolves.toBe(
      PLAINTEXT_UNICODE
    );
  });

  test("takes the IV from the first 16 bytes, so a different IV decrypts too", async () => {
    const { decryptString, ServiceError } = defaults();
    const otherIv = Buffer.alloc(IV_BYTES, 0xab);
    await expect(
      decryptString(encryptLikeSpring(PLAINTEXT_ASCII, DEFAULT_PASSWORD, DEFAULT_SALT, otherIv))
    ).resolves.toBe(PLAINTEXT_ASCII);
  });

  test("accepts a plaintext longer than one AES block", async () => {
    const { decryptString, ServiceError } = defaults();
    const long = "x".repeat(100);
    await expect(decryptString(encryptLikeSpring(long, DEFAULT_PASSWORD, DEFAULT_SALT))).resolves.toBe(long);
  });

  test("rejects a vector made with a wrong password", async () => {
    const { decryptString, ServiceError } = defaults();
    await expectDecryptFailure(decryptString(encryptLikeSpring(PLAINTEXT_ASCII, "wrong-password", DEFAULT_SALT)), ServiceError);
  });

  test("rejects a vector made with a wrong salt", async () => {
    // WRONG_SALT derives a different key; with the fixed IV and plaintext the padding check
    // deterministically fails (checked when this test was written), so the outcome is the ServiceError.
    const { decryptString, ServiceError } = defaults();
    await expectDecryptFailure(decryptString(encryptLikeSpring(PLAINTEXT_ASCII, DEFAULT_PASSWORD, WRONG_SALT)), ServiceError);
  });

  test("rejects a tampered last ciphertext byte (bad padding)", async () => {
    const { decryptString, ServiceError } = defaults();
    const good = encryptLikeSpring(PLAINTEXT_ASCII, DEFAULT_PASSWORD, DEFAULT_SALT);
    const lastByte = parseInt(good.slice(-2), 16);
    const tampered = good.slice(0, -2) + ((lastByte ^ 0xff).toString(16).padStart(2, "0"));
    expect(tampered).not.toBe(good);
    await expectDecryptFailure(decryptString(tampered), ServiceError);
  });

  test("rejects a payload shorter than the 16-byte IV", async () => {
    const { decryptString, ServiceError } = defaults();
    await expectDecryptFailure(decryptString("00010203040506"), ServiceError);
  });

  test("rejects non-hex input", async () => {
    const { decryptString, ServiceError } = defaults();
    await expectDecryptFailure(decryptString("this is not hex at all"), ServiceError);
  });

  // B42: Buffer.from(x, "hex") stops at the first invalid pair, so trailing non-hex
  // characters after a valid ciphertext are silently ignored today. Asserts the correct behaviour.
  test.failing("B42: trailing non-hex characters after a valid ciphertext are rejected", async () => {
    const { decryptString, ServiceError } = defaults();
    await expectDecryptFailure(decryptString(`${encryptLikeSpring(PLAINTEXT_ASCII, DEFAULT_PASSWORD, DEFAULT_SALT)}zz`), ServiceError);
  });

  test("rejects the empty string", async () => {
    const { decryptString, ServiceError } = defaults();
    await expectDecryptFailure(decryptString(""), ServiceError);
  });
});

describe("decryptString with the secret and salt from the environment", () => {
  const custom = () => loadWithEnv({ [ENV_SECRET]: CUSTOM_PASSWORD, [ENV_SALT]: CUSTOM_SALT });

  test("decrypts a vector made with the configured secret and salt", async () => {
    const { decryptString, ServiceError } = custom();
    await expect(decryptString(encryptLikeSpring(PLAINTEXT_UNICODE, CUSTOM_PASSWORD, CUSTOM_SALT))).resolves.toBe(
      PLAINTEXT_UNICODE
    );
  });

  test("rejects a vector made with the default secret and salt", async () => {
    const { decryptString, ServiceError } = custom();
    await expectDecryptFailure(decryptString(encryptLikeSpring(PLAINTEXT_ASCII, DEFAULT_PASSWORD, DEFAULT_SALT)), ServiceError);
  });

  test("the secret and the salt are configured independently", async () => {
    const onlySecret = loadWithEnv({ [ENV_SECRET]: CUSTOM_PASSWORD, [ENV_SALT]: undefined });
    await expect(
      onlySecret.decryptString(encryptLikeSpring(PLAINTEXT_ASCII, CUSTOM_PASSWORD, DEFAULT_SALT))
    ).resolves.toBe(PLAINTEXT_ASCII);
    const onlySalt = loadWithEnv({ [ENV_SECRET]: undefined, [ENV_SALT]: CUSTOM_SALT });
    await expect(
      onlySalt.decryptString(encryptLikeSpring(PLAINTEXT_ASCII, DEFAULT_PASSWORD, CUSTOM_SALT))
    ).resolves.toBe(PLAINTEXT_ASCII);
  });
});
