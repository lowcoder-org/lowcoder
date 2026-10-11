/** Stable DOM id for a participant's screen-share <video> (one id per uid, never global "share-screen"). */
export function meetingShareElementId(uid: string | number): string {
  return `agora-share-${String(uid)}`;
}

export type MeetingParticipantView = {
  user: string;
  userName: string;
  streamingSharing: boolean;
  streamingVideo?: boolean;
  audiostatus?: boolean;
};

/** Lowcoder booleans may arrive as true, "true", 1, etc. */
export function meetingTruthyFlag(value: unknown): boolean {
  return value === true || value === "true" || value === 1 || value === "1";
}

export function parseMeetingParticipant(
  raw: unknown
): MeetingParticipantView | null {
  if (raw == null || raw === "") return null;

  let d: Record<string, unknown>;

  if (typeof raw === "string") {
    const trimmed = raw.trim();
    if (!trimmed || trimmed === "[object Object]") {
      return null;
    }
    try {
      d = JSON.parse(trimmed) as Record<string, unknown>;
    } catch {
      // Plain uid string (no JSON wrapper)
      return {
        user: trimmed,
        userName: "",
        streamingSharing: false,
      };
    }
  } else if (typeof raw === "object") {
    d = raw as Record<string, unknown>;
  } else {
    return null;
  }

  if (d == null || d.user == null) {
    return null;
  }

  return {
    user: String(d.user),
    userName: String(d.userName ?? ""),
    streamingSharing: meetingTruthyFlag(d.streamingSharing),
    streamingVideo: d.streamingVideo as boolean | undefined,
    audiostatus: d.audiostatus as boolean | undefined,
  };
}

export function meetingStreamTargetUid(raw: unknown): string {
  return parseMeetingParticipant(raw)?.user ?? "";
}
