import { LLM_BOT_AUTHOR_ID } from "./store/types";

/** Serialized mention format: `@[Display Name](u:userId)` — parse & render with MentionSpan. */
export const MENTION_TOKEN_RE = /@\[([^\]]*)\]\(u:([^)]+)\)/g;

export interface MentionCandidate {
  id: string;
  label: string;
  kind: "user" | "llm";
}

export function formatMentionToken(label: string, userId: string): string {
  const safeLabel = String(label).replace(/\]/g, "").trim() || userId;
  return `@[${safeLabel}](u:${userId})`;
}

/** Text inserted by Mentions after `@` (no leading `@`; rc-mentions keeps a single `@` prefix). */
export function mentionInsertValue(label: string, fallbackId?: string): string {
  const s = String(label).replace(/^@/, "").replace(/\s+/g, " ").trim();
  if (s) return s;
  return String(fallbackId ?? "").trim();
}

function plainAtMentionOfName(raw: string, name: string): boolean {
  const n = name.trim();
  if (!n) return false;
  const esc = n.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`@${esc}(?![\\w])`, "i").test(raw);
}

/** Cursor-based @mention: returns start index of `@` and filter query after it (single-line token). */
export function getActiveMentionQuery(
  value: string,
  cursorPos: number,
): { start: number; query: string } | null {
  const before = value.slice(0, cursorPos);
  const at = before.lastIndexOf("@");
  if (at === -1) return null;
  const afterAt = before.slice(at + 1);
  if (afterAt.startsWith("[")) return null;
  if (afterAt.includes("\n")) return null;
  if (afterAt.includes(" ")) return null;
  return { start: at, query: afterAt };
}

export function filterMentionCandidates(
  candidates: MentionCandidate[],
  query: string,
  limit = 12,
): MentionCandidate[] {
  const q = query.trim().toLowerCase();
  if (!q) return candidates.slice(0, limit);
  return candidates
    .filter(
      (c) =>
        c.id.toLowerCase().includes(q) ||
        c.label.toLowerCase().includes(q),
    )
    .slice(0, limit);
}

export type MessagePart =
  | { type: "text"; text: string }
  | { type: "mention"; label: string; id: string };

/** Split plain text into alternating segments and serialized mentions. */
export function parseMessageIntoParts(raw: string): MessagePart[] {
  const parts: MessagePart[] = [];
  const re = new RegExp(MENTION_TOKEN_RE.source, "g");
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(raw)) !== null) {
    if (m.index > last) {
      parts.push({ type: "text", text: raw.slice(last, m.index) });
    }
    parts.push({ type: "mention", label: m[1], id: m[2] });
    last = m.index + m[0].length;
  }
  if (last < raw.length) {
    parts.push({ type: "text", text: raw.slice(last) });
  }
  if (parts.length === 0) {
    parts.push({ type: "text", text: raw });
  }
  return parts;
}

/**
 * True if the message tags the AI: legacy `@[…](u:__llm_bot__)` or plain `@` + display label
 * (e.g. `@AI` matching `llmDisplayLabel` from the mention picker).
 */
export function messageContainsLlmMention(
  raw: string,
  llmUserId: string = LLM_BOT_AUTHOR_ID,
  llmDisplayLabel?: string,
): boolean {
  for (const part of parseMessageIntoParts(raw)) {
    if (part.type === "mention" && part.id === llmUserId) {
      return true;
    }
  }
  const label = llmDisplayLabel?.replace(/^@/, "").trim();
  if (label && plainAtMentionOfName(raw, label)) {
    return true;
  }
  return false;
}
