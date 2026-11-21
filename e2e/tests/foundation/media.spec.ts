import { expect, test } from "@playwright/test";
import { MP4, PDF, PDF_RAW_B64, PNG_BLUE, PNG_RED, WAV, WEBM } from "../../src/media";

interface MediaCase {
  name: string;
  uri: string;
  mime: string;
  /** The first bytes of the decoded payload (file signature), as hex. */
  signatureHex: string;
  /** Offset of the signature in the payload. */
  offset?: number;
}

const CASES: MediaCase[] = [
  { name: "PNG_RED", uri: PNG_RED, mime: "image/png", signatureHex: "89504e470d0a1a0a" },
  { name: "PNG_BLUE", uri: PNG_BLUE, mime: "image/png", signatureHex: "89504e470d0a1a0a" },
  { name: "WAV", uri: WAV, mime: "audio/wav", signatureHex: "52494646" },
  { name: "WEBM", uri: WEBM, mime: "video/webm", signatureHex: "1a45dfa3" },
  { name: "MP4", uri: MP4, mime: "video/mp4", signatureHex: "66747970", offset: 4 },
  { name: "PDF", uri: PDF, mime: "application/pdf", signatureHex: "25504446" },
];

function payloadOf(uri: string, mime: string): Buffer {
  const prefix = `data:${mime};base64,`;
  expect(uri.startsWith(prefix), `a data: URI of type ${mime}`).toBe(true);
  return Buffer.from(uri.slice(prefix.length), "base64");
}

test.describe("media fixtures", () => {
  for (const mediaCase of CASES) {
    test(`${mediaCase.name} is a data: URI whose bytes carry the ${mediaCase.mime} signature`, () => {
      const bytes = payloadOf(mediaCase.uri, mediaCase.mime);
      const offset = mediaCase.offset ?? 0;
      const signature = bytes.subarray(offset, offset + mediaCase.signatureHex.length / 2).toString("hex");

      expect(signature, `bytes ${offset}.. of ${mediaCase.name}`).toBe(mediaCase.signatureHex);
    });
  }

  test("the two PNGs differ, so a test can tell them apart", () => {
    expect(PNG_RED).not.toBe(PNG_BLUE);
  });

  test("PDF_RAW_B64 is the payload of PDF without the data: prefix", () => {
    expect(`data:application/pdf;base64,${PDF_RAW_B64}`).toBe(PDF);
  });
});
