import { spawn, type ChildProcess } from "node:child_process";
import { connect, createServer, type Socket } from "node:net";
import { join } from "node:path";
import { expect, test } from "@playwright/test";
import { ECHO_PATHS, MAIL_SUBJECTS } from "../../src/constants";
import { MailTimeoutError, mailboxAt } from "../../src/lifecycle/mail";

/**
 * Stack-free unit tests of the mail sink in scripts/echo-server.js (the SMTP listener on MAIL_PORT), started here as a child
 * process on loopback ports and driven by a raw `net` SMTP client. No Docker, no page, so `test` comes from `@playwright/test`.
 */

const ECHO_SCRIPT = join(__dirname, "..", "..", "scripts", "echo-server.js");
const STARTUP_TIMEOUT_MS = 10_000;
const STARTUP_POLL_MS = 100;
const REPLY_TIMEOUT_MS = 5_000;
const MAX_BODY_BYTES = 65_536;
const MAX_COMMAND_LINE_BYTES = 512;
const CRLF = "\r\n";
const END_OF_DATA = `${CRLF}.${CRLF}`;
const RECIPIENT = "Reset.Me@Example.test";

interface Mail {
  from: string;
  to: string[];
  data: string;
}

let child: ChildProcess;
let httpPort: number;
let mailPort: number;

async function freePort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const server = createServer();
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      const port = typeof address === "object" && address ? address.port : 0;
      server.close(() => resolve(port));
    });
  });
}

async function waitUntilHealthy(): Promise<void> {
  const deadline = Date.now() + STARTUP_TIMEOUT_MS;
  while (Date.now() < deadline) {
    try {
      if ((await fetch(`http://127.0.0.1:${httpPort}${ECHO_PATHS.HEALTH}`)).ok) {
        return;
      }
    } catch {
      // not listening yet
    }
    await new Promise((resolve) => setTimeout(resolve, STARTUP_POLL_MS));
  }
  throw new Error(`the echo server did not answer ${ECHO_PATHS.HEALTH} within ${STARTUP_TIMEOUT_MS} ms`);
}

async function mailsFor(address: string): Promise<Mail[]> {
  const response = await fetch(`http://127.0.0.1:${httpPort}${ECHO_PATHS.MAILS}?to=${encodeURIComponent(address)}`);
  return (await response.json()) as Mail[];
}

/** A raw SMTP client: `send` writes bytes, `reply` waits for the next reply line that starts with a 3-digit code. */
class SmtpClient {
  private received = "";
  private closed = false;
  private constructor(private readonly socket: Socket) {
    socket.setEncoding("latin1");
    socket.on("data", (chunk: string) => {
      this.received += chunk;
    });
    socket.on("close", () => {
      this.closed = true;
    });
    socket.on("error", () => undefined);
  }

  static async open(): Promise<SmtpClient> {
    const socket = connect(mailPort, "127.0.0.1");
    await new Promise<void>((resolve, reject) => {
      socket.once("connect", resolve);
      socket.once("error", reject);
    });
    const client = new SmtpClient(socket);
    expect(await client.reply(), "the greeting").toMatch(/^220 /);
    return client;
  }

  send(bytes: string): void {
    this.socket.write(bytes, "latin1");
  }

  /** Writes `bytes` one byte per TCP write, so no chunk boundary can be relied on. */
  async sendByteByByte(bytes: string): Promise<void> {
    for (const byte of bytes) {
      this.socket.write(byte, "latin1");
      await new Promise((resolve) => setImmediate(resolve));
    }
  }

  async reply(): Promise<string> {
    const deadline = Date.now() + REPLY_TIMEOUT_MS;
    for (;;) {
      const end = this.received.indexOf(CRLF);
      if (end >= 0) {
        const line = this.received.slice(0, end);
        this.received = this.received.slice(end + CRLF.length);
        return line;
      }
      if (this.closed || Date.now() > deadline) {
        throw new Error(`no reply line (closed=${this.closed}, pending=${JSON.stringify(this.received)})`);
      }
      await new Promise((resolve) => setTimeout(resolve, 10));
    }
  }

  async command(line: string, expected: RegExp): Promise<void> {
    this.send(`${line}${CRLF}`);
    expect(await this.reply(), `the reply to ${line.slice(0, 40)}`).toMatch(expected);
  }

  async waitClosed(): Promise<void> {
    const deadline = Date.now() + REPLY_TIMEOUT_MS;
    while (!this.closed && Date.now() < deadline) {
      await new Promise((resolve) => setTimeout(resolve, 10));
    }
    expect(this.closed, "the server closed the connection").toBe(true);
  }

  end(): void {
    this.socket.destroy();
  }
}

/** One full transaction up to DATA: `to` recipients are given, the 354 is awaited. */
async function beginData(client: SmtpClient, to: string[], from = "app@lowcoder.test"): Promise<void> {
  await client.command("EHLO runner", /^250 /);
  await client.command(`MAIL FROM:<${from}>`, /^250 /);
  for (const recipient of to) {
    await client.command(`RCPT TO:<${recipient}>`, /^250 /);
  }
  await client.command("DATA", /^354 /);
}

test.describe.configure({ mode: "serial" });

test.beforeAll(async () => {
  httpPort = await freePort();
  mailPort = await freePort();
  child = spawn(process.execPath, [ECHO_SCRIPT], {
    env: { ...process.env, ECHO_PORT: String(httpPort), MAIL_PORT: String(mailPort) },
    stdio: "ignore",
  });
  await waitUntilHealthy();
  // the SMTP listener starts together with the HTTP one; wait until it accepts
  (await SmtpClient.open()).end();
});

test.afterAll(() => {
  child.kill();
});

test.describe("mail sink", () => {
  test("a full conversation is recorded with sender, recipients and data, and found by recipient case-insensitively", async () => {
    const client = await SmtpClient.open();
    await beginData(client, [RECIPIENT, "second@example.test"]);
    client.send(`Subject: Hello${CRLF}${CRLF}body line${END_OF_DATA}`);
    expect(await client.reply(), "the reply to the data").toMatch(/^250 /);
    await client.command("QUIT", /^221 /);
    await client.waitClosed();

    for (const spelling of [RECIPIENT, RECIPIENT.toLowerCase(), RECIPIENT.toUpperCase()]) {
      const mails = await mailsFor(spelling);
      expect(mails, `mails for ${spelling}`).toHaveLength(1);
      expect(mails[0]!.from).toBe("app@lowcoder.test");
      expect(mails[0]!.to).toEqual([RECIPIENT, "second@example.test"]);
      expect(mails[0]!.data).toBe(`Subject: Hello${CRLF}${CRLF}body line`);
    }
    expect(await mailsFor("second@example.test"), "found by the second recipient").toHaveLength(1);
    expect(await mailsFor("nobody@example.test"), "an unknown recipient").toEqual([]);
  });

  test("dot-stuffing is undone and an unknown command is answered 502", async () => {
    const recipient = "dots@example.test";
    const client = await SmtpClient.open();
    await client.command("VRFY someone", /^502 /);
    await beginData(client, [recipient]);
    client.send(`line1${CRLF}..dotted${CRLF}...two${CRLF}plain${END_OF_DATA}`);
    expect(await client.reply()).toMatch(/^250 /);
    client.end();

    expect((await mailsFor(recipient))[0]!.data).toBe(`line1${CRLF}.dotted${CRLF}..two${CRLF}plain`);
  });

  test("commands and data sent one byte per write are parsed the same", async () => {
    const recipient = "bytes@example.test";
    const client = await SmtpClient.open();
    await client.sendByteByByte(`EHLO runner${CRLF}`);
    expect(await client.reply()).toMatch(/^250 /);
    await client.sendByteByByte(`MAIL FROM:<a@b.test>${CRLF}RCPT TO:<${recipient}>${CRLF}DATA${CRLF}`);
    for (let index = 0; index < 3; index += 1) {
      expect(await client.reply(), `reply ${index}`).toMatch(index < 2 ? /^250 / : /^354 /);
    }
    await client.sendByteByByte(`Subject: S${CRLF}${CRLF}x${END_OF_DATA}`);
    expect(await client.reply()).toMatch(/^250 /);
    client.end();

    expect((await mailsFor(recipient))[0]!.data).toBe(`Subject: S${CRLF}${CRLF}x`);
  });

  test("pipelined commands, and the end of data together with QUIT in one write, are answered in order", async () => {
    const recipient = "pipe@example.test";
    const client = await SmtpClient.open();
    client.send([`EHLO r`, `MAIL FROM:<a@b.test>`, `RCPT TO:<${recipient}>`, `DATA`].map((line) => line + CRLF).join(""));
    for (const expected of [/^250 /, /^250 /, /^250 /, /^354 /]) {
      expect(await client.reply()).toMatch(expected);
    }
    client.send(`body${END_OF_DATA}QUIT${CRLF}`);
    expect(await client.reply(), "the data").toMatch(/^250 /);
    expect(await client.reply(), "QUIT").toMatch(/^221 /);
    await client.waitClosed();

    expect((await mailsFor(recipient))[0]!.data).toBe("body");
  });

  test("a terminator split across writes is found, and a body with a bare dot line is not cut", async () => {
    const recipient = "split@example.test";
    const client = await SmtpClient.open();
    await beginData(client, [recipient]);
    client.send(`a${CRLF}.`);
    await new Promise((resolve) => setTimeout(resolve, 50));
    client.send(`x${CRLF}b${CRLF}`);
    await new Promise((resolve) => setTimeout(resolve, 50));
    client.send(`.\r`);
    await new Promise((resolve) => setTimeout(resolve, 50));
    client.send(`\n`);
    expect(await client.reply()).toMatch(/^250 /);
    client.end();

    expect((await mailsFor(recipient))[0]!.data, "a '.x' line is data; only the lone dot ends it").toBe(`a${CRLF}.x${CRLF}b`);
  });

  test("DATA without a recipient is refused with 503", async () => {
    const client = await SmtpClient.open();
    await client.command("EHLO r", /^250 /);
    await client.command("MAIL FROM:<a@b.test>", /^250 /);
    await client.command("DATA", /^503 /);
    client.end();
  });

  test("RSET drops the envelope: a message after it has only its own recipients", async () => {
    const recipient = "rset@example.test";
    const client = await SmtpClient.open();
    await client.command("EHLO r", /^250 /);
    await client.command("MAIL FROM:<a@b.test>", /^250 /);
    await client.command("RCPT TO:<dropped@example.test>", /^250 /);
    await client.command("RSET", /^250 /);
    await client.command("MAIL FROM:<a@b.test>", /^250 /);
    await client.command(`RCPT TO:<${recipient}>`, /^250 /);
    await client.command("DATA", /^354 /);
    client.send(`m${END_OF_DATA}`);
    expect(await client.reply()).toMatch(/^250 /);
    client.end();

    expect((await mailsFor(recipient))[0]!.to).toEqual([recipient]);
    expect(await mailsFor("dropped@example.test")).toEqual([]);
  });

  test("an over-long command line is answered 500 and the connection is closed", async () => {
    const client = await SmtpClient.open();
    client.send(`NOOP ${"x".repeat(MAX_COMMAND_LINE_BYTES)}${CRLF}`);
    expect(await client.reply()).toMatch(/^500 /);
    await client.waitClosed();
  });

  test("a body past the cap is drained, answered 250 and stored cut; the next message on the connection still works", async () => {
    const recipient = "big@example.test";
    const client = await SmtpClient.open();
    await beginData(client, [recipient]);
    client.send(`${"y".repeat(MAX_BODY_BYTES * 2)}${END_OF_DATA}`);
    expect(await client.reply(), "the oversized message is accepted").toMatch(/^250 /);
    await client.command("MAIL FROM:<a@b.test>", /^250 /);
    await client.command(`RCPT TO:<${recipient}>`, /^250 /);
    await client.command("DATA", /^354 /);
    client.send(`small${END_OF_DATA}`);
    expect(await client.reply()).toMatch(/^250 /);
    client.end();

    const mails = await mailsFor(recipient);
    expect(mails).toHaveLength(2);
    expect(mails[0]!.data.length, "the first message is cut at the cap").toBe(MAX_BODY_BYTES);
    expect(mails[1]!.data, "the second is whole").toBe("small");
  });

  test("a body cut across several writes, with the terminator split right after the cap, is still ended and the connection stays usable", async () => {
    const recipient = "cut@example.test";
    const client = await SmtpClient.open();
    await beginData(client, [recipient]);
    for (const piece of ["z".repeat(MAX_BODY_BYTES - 1), `zzzzz${CRLF}.`, CRLF]) {
      client.send(piece);
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
    expect(await client.reply(), "the message is ended although its end arrived after the cap").toMatch(/^250 /);
    await client.command("NOOP", /^250 /);
    client.end();

    const mails = await mailsFor(recipient);
    expect(mails).toHaveLength(1);
    expect(mails[0]!.data, "cut at the cap, nothing of the terminator in it").toBe("z".repeat(MAX_BODY_BYTES));
  });

  test("mailboxAt parses the mails, waits for a later one and times out with MailTimeoutError", async () => {
    const recipient = "box@example.test";
    const mailbox = mailboxAt(`http://127.0.0.1:${httpPort}`);
    expect(await mailbox.mailsTo(recipient), "nothing yet").toEqual([]);

    const sendLater = (async () => {
      await new Promise((resolve) => setTimeout(resolve, 400));
      const client = await SmtpClient.open();
      await beginData(client, [recipient]);
      client.send(`Subject: ${MAIL_SUBJECTS.PASSWORD_RESET}${CRLF}${CRLF}hello${END_OF_DATA}`);
      expect(await client.reply()).toMatch(/^250 /);
      client.end();
    })();
    const found = await mailbox.waitForMail(recipient.toUpperCase(), MAIL_SUBJECTS.PASSWORD_RESET);
    await sendLater;

    expect(found).toHaveLength(1);
    expect(found[0]!.subject).toBe(MAIL_SUBJECTS.PASSWORD_RESET);
    expect(found[0]!.parts[0]!.text).toBe("hello");
    await expect(mailbox.waitForMail(recipient, MAIL_SUBJECTS.INVITATION, 1)).rejects.toThrow(MailTimeoutError);
  });
});
