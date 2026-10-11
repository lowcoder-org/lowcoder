// Yjs client check of a hocuspocus server, run by runtime-test.sh in a node container.
//
// Usage: node hocuspocus-sync.mjs <mode> <websocket url> <token> <document name>
//   sync    two clients with the token connect like the ChatBox client (hocuspocusClient.tsx),
//           one writes a value into the shared document, the other must receive it
//   reject  one client with the token must be refused (onAuthenticationFailed)
//
// Exit status: 0 the expectation held, 1 it did not (or timed out), 2 wrong usage.
import { HocuspocusProvider } from "@hocuspocus/provider";
import * as Y from "yjs";
import WebSocket from "ws";

const MODE_SYNC = "sync";
const MODE_REJECT = "reject";
const EXIT_OK = 0;
const EXIT_FAILED = 1;
const EXIT_USAGE = 2;
const TIMEOUT_MS = 20000;
const SHARED_MAP = "runtime-test";
const SHARED_KEY = "value";

const [mode, url, token, documentName] = process.argv.slice(2);
if (![MODE_SYNC, MODE_REJECT].includes(mode) || !url || !documentName) {
  console.error("usage: hocuspocus-sync.mjs sync|reject <websocket url> <token> <document name>");
  process.exit(EXIT_USAGE);
}

const providers = [];

function finish(status, message) {
  console.log(`[hocuspocus-sync] ${message}`);
  for (const provider of providers) {
    provider.destroy();
  }
  process.exit(status);
}

setTimeout(() => finish(EXIT_FAILED, `timed out after ${TIMEOUT_MS} ms`), TIMEOUT_MS);

// Resolves when the provider has synced the document; rejects when authentication fails
function connect(label) {
  const document = new Y.Doc();
  return new Promise((resolve, reject) => {
    const provider = new HocuspocusProvider({
      url,
      name: documentName,
      document,
      token: token || undefined,
      WebSocketPolyfill: WebSocket,
      onSynced: () => {
        console.log(`[hocuspocus-sync] ${label}: synced ${documentName} via ${url}`);
        resolve({ provider, document });
      },
      onAuthenticationFailed: ({ reason }) => {
        reject(new Error(`${label}: authentication failed (${reason})`));
      },
    });
    providers.push(provider);
  });
}

async function checkSync() {
  const [writer, reader] = await Promise.all([connect("client A"), connect("client B")]);
  const expected = `written-${process.pid}-${Date.now()}`;
  const received = new Promise((resolve) => {
    const map = reader.document.getMap(SHARED_MAP);
    map.observe(() => {
      if (map.get(SHARED_KEY) === expected) resolve();
    });
  });
  writer.document.getMap(SHARED_MAP).set(SHARED_KEY, expected);
  console.log(`[hocuspocus-sync] client A: wrote ${SHARED_KEY}=${expected}`);
  await received;
  finish(EXIT_OK, `client B: received ${SHARED_KEY}=${expected}`);
}

async function checkReject() {
  try {
    await connect("client");
    finish(EXIT_FAILED, "client: synced, expected the server to refuse the token");
  } catch (error) {
    finish(EXIT_OK, error.message);
  }
}

const check = mode === MODE_SYNC ? checkSync() : checkReject();
check.catch((error) => finish(EXIT_FAILED, error.message));
