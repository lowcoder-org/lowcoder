import { readFileSync } from "node:fs";
import { join } from "node:path";
import { expect, test } from "@playwright/test";
import { MAIL_SUBJECTS } from "../../src/constants";
import {
  MalformedMailError,
  UnsupportedMailEncodingError,
  inviteCodeOf,
  isInvitation,
  isPasswordReset,
  parseMail,
  resetTokenOf,
  textOf,
  type SinkMail,
} from "../../src/lifecycle/mail";

/**
 * Stack-free unit tests of src/lifecycle/mail.ts. The two marker fixtures are the real mails the 3.0.0 image sent to the
 * sink (recorded with the run's own SMTP settings), with the address, the token and the code replaced by placeholders.
 */

const FIXTURE_DIR = join(__dirname, "..", "..", "fixtures", "mail");
const CRLF = "\r\n";

function fixture(name: string): SinkMail {
  return { from: "info@localhost", to: ["user@example.test"], data: readFileSync(join(FIXTURE_DIR, name), "latin1") };
}

/** A single-part message with the given extra headers and body. */
function simple(headers: string[], body: string): SinkMail {
  return { from: "a@b.test", to: ["c@d.test"], data: [...headers, "", body].join(CRLF) };
}

test.describe("mail parser", () => {
  test("the recorded reset mail: subject, nested multipart, token percent-decoded, double slash in the link tolerated", () => {
    const mail = parseMail(fixture("password-reset.eml"));

    expect(mail.subject).toBe(MAIL_SUBJECTS.PASSWORD_RESET);
    expect(isPasswordReset(mail)).toBe(true);
    expect(isInvitation(mail)).toBe(false);
    expect(mail.parts).toHaveLength(1);
    expect(textOf(mail)).toContain("//user/auth/lost-password?token=");
    expect(resetTokenOf(mail), "TOKEN%3CPLACEHOLDER%24 decoded").toBe("TOKEN<PLACEHOLDER$");
  });

  test("the recorded invitation mail: subject and code", () => {
    const mail = parseMail(fixture("invitation.eml"));

    expect(mail.subject).toBe(MAIL_SUBJECTS.INVITATION);
    expect(isInvitation(mail)).toBe(true);
    expect(inviteCodeOf(mail)).toBe("INVITECODEPLACEHOLDER000");
    expect(() => resetTokenOf(mail), "an invitation holds no reset link").toThrow(MalformedMailError);
  });

  test("7bit, 8bit and binary bodies are read as the charset says", () => {
    const utf8 = Buffer.from("žluťoučký", "utf-8").toString("latin1");
    for (const encoding of ["7bit", "8bit", "binary"]) {
      const mail = parseMail(simple(["Subject: s", "Content-Type: text/plain; charset=UTF-8", `Content-Transfer-Encoding: ${encoding}`], utf8));
      expect(mail.parts[0]!.text, encoding).toBe("žluťoučký");
    }
  });

  test("quoted-printable (soft break, escaped bytes) and base64 bodies are decoded", () => {
    const qp = parseMail(simple(["Content-Type: text/plain; charset=utf-8", "Content-Transfer-Encoding: quoted-printable"], "a=3Db =C5=BE=\r\nc"));
    const b64 = parseMail(
      simple(["Content-Type: text/plain; charset=utf-8", "Content-Transfer-Encoding: base64"], Buffer.from("žlutý\nkůň").toString("base64").replace(/(.{8})/g, `$1${CRLF}`)),
    );

    expect(qp.parts[0]!.text).toBe("a=b žc");
    expect(b64.parts[0]!.text).toBe("žlutý\nkůň");
  });

  test("a latin-1 charset is honoured", () => {
    const mail = parseMail(simple(["Content-Type: text/plain; charset=iso-8859-1"], "caf\xe9"));

    expect(mail.parts[0]!.text).toBe("café");
  });

  test("an encoded-word subject (B and Q) is decoded", () => {
    const b = parseMail(simple([`Subject: =?utf-8?B?${Buffer.from("Zdravím").toString("base64")}?=`], "x"));
    const q = parseMail(simple(["Subject: =?utf-8?Q?Hello_=C5=BE?="], "x"));

    expect(b.subject).toBe("Zdravím");
    expect(q.subject).toBe("Hello ž");
  });

  test("multipart/alternative yields every text leaf in order and skips non-text leaves", () => {
    const body = [
      "--B1",
      "Content-Type: text/plain; charset=utf-8",
      "",
      "plain",
      "--B1",
      "Content-Type: image/png",
      "Content-Transfer-Encoding: base64",
      "",
      "AAAA",
      "--B1",
      "Content-Type: text/html; charset=utf-8",
      "",
      "<b>html</b>",
      "--B1--",
      "",
    ].join(CRLF);
    const mail = parseMail(simple(["Content-Type: multipart/alternative; boundary=\"B1\""], body));

    expect(mail.parts.map((part) => [part.contentType, part.text])).toEqual([
      ["text/plain", "plain"],
      ["text/html", "<b>html</b>"],
    ]);
  });

  test("an unknown transfer encoding throws UnsupportedMailEncodingError naming it", () => {
    const mail = simple(["Content-Type: text/plain", "Content-Transfer-Encoding: x-uuencode"], "begin 644");

    expect(() => parseMail(mail)).toThrow(UnsupportedMailEncodingError);
    expect(() => parseMail(mail)).toThrow(/x-uuencode/);
  });

  test("malformed input throws MalformedMailError: no header separator, multipart without boundary, unknown charset, too deep", () => {
    expect(() => parseMail({ from: "", to: [], data: "Subject: only headers" })).toThrow(MalformedMailError);
    expect(() => parseMail(simple(["Content-Type: multipart/mixed"], "x"))).toThrow(/without a boundary/);
    expect(() => parseMail(simple(["Content-Type: text/plain; charset=no-such-charset"], "x"))).toThrow(/unknown charset/);
    let nested = "leaf";
    for (let level = 9; level >= 0; level -= 1) {
      nested = [`--B${level}`, `Content-Type: multipart/mixed; boundary="B${level + 1}"`, "", nested, `--B${level}--`, ""].join(CRLF);
    }
    expect(() => parseMail(simple(['Content-Type: multipart/mixed; boundary="B0"'], nested))).toThrow(/levels of multipart/);
  });

  test("a boundary text inside a part is content; only a line that starts with it is a delimiter", () => {
    const body = ["--B1", "Content-Type: text/plain", "", "see --B1 inside and x--B1 too", "--B1--", ""].join(CRLF);
    const mail = parseMail(simple(['Content-Type: multipart/mixed; boundary="B1"'], body));

    expect(mail.parts.map((part) => part.text)).toEqual(["see --B1 inside and x--B1 too"]);
  });

  test("a mail with no reset link, or a token that is not percent-encoding, is refused without echoing the text", () => {
    const none = parseMail(simple(["Content-Type: text/plain"], "nothing here"));
    const bad = parseMail(simple(["Content-Type: text/plain"], "http://h//user/auth/lost-password?token=%E0%A4%A"));

    expect(() => resetTokenOf(none)).toThrow(MalformedMailError);
    expect(() => resetTokenOf(bad)).toThrow(/not valid percent-encoding/);
    expect(() => inviteCodeOf(none)).toThrow(MalformedMailError);
  });
});
