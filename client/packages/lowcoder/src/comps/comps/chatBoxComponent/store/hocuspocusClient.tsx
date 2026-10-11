import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import * as Y from "yjs";
import {
  HocuspocusProvider,
  WebSocketStatus,
} from "@hocuspocus/provider";

// ── Environment config ───────────────────────────────────────────────────────

const WS_URL = REACT_APP_HOCUSPOCUS_URL || "ws://localhost:3006";

const AUTH_TOKEN = REACT_APP_HOCUSPOCUS_SECRET || "";

type ConnectionState = "connecting" | "open" | "closed";

function mapWebSocketStatus(status?: WebSocketStatus): ConnectionState {
  switch (status) {
    case WebSocketStatus.Connected:
      return "open";
    case WebSocketStatus.Connecting:
      return "connecting";
    default:
      return "closed";
  }
}

// ── Context ────────────────────────────────────────────────────────────────────

interface HocuspocusContextValue {
  provider: HocuspocusProvider;
  doc: Y.Doc;
}

const HocuspocusContext = createContext<HocuspocusContextValue | null>(null);

function useHocuspocusContext(): HocuspocusContextValue {
  const ctx = useContext(HocuspocusContext);
  if (!ctx) {
    throw new Error(
      "Hocuspocus hooks must be used inside <HocuspocusRoomProvider>",
    );
  }
  return ctx;
}

// ── Provider component ───────────────────────────────────────────────────────

interface HocuspocusRoomProviderProps {
  /** Document/room name — all clients with the same name share state. */
  room: string;
  /** Initial presence fields to set on connect. */
  initialPresence?: Record<string, unknown>;
  /** Called when auth fails. */
  onAuthenticationFailed?: (error: unknown) => void;
  children: React.ReactNode;
}

export function HocuspocusRoomProvider({
  room,
  initialPresence,
  onAuthenticationFailed,
  children,
}: HocuspocusRoomProviderProps) {
  const initialPresenceKey = JSON.stringify(initialPresence ?? null);

  const value = useMemo(() => {
    const doc = new Y.Doc();
    const provider = new HocuspocusProvider({
      url: WS_URL,
      name: room,
      document: doc,
      token: AUTH_TOKEN || undefined,
      onAuthenticationFailed: (data: unknown) => {
        console.error("[Hocuspocus] Auth failed:", data);
        onAuthenticationFailed?.(data);
      },
    });

    return { provider, doc };
    // Only re-create when the room name changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [room]);

  useEffect(() => {
    if (initialPresenceKey !== "null") {
      value.provider.setAwarenessField("user", JSON.parse(initialPresenceKey));
    }
  }, [initialPresenceKey, value.provider]);

  useEffect(() => {
    return () => {
      value.provider.destroy();
      value.doc.destroy();
    };
  }, [value]);

  return (
    <HocuspocusContext.Provider value={value}>
      {children}
    </HocuspocusContext.Provider>
  );
}

// ── Hook: useConnection ──────────────────────────────────────────────────────

export function useConnection(): { state: ConnectionState } {
  const { provider } = useHocuspocusContext();

  const getStatus = useCallback(
    () => mapWebSocketStatus(provider.configuration.websocketProvider.status),
    [provider],
  );

  const [state, setState] = useState<ConnectionState>(getStatus);

  useEffect(() => {
    // Sync immediately when provider changes
    setState(getStatus());

    const handleStatus = ({ status }: { status: WebSocketStatus }) => {
      setState(mapWebSocketStatus(status));
    };

    provider.on("status", handleStatus);

    return () => {
      provider.off("status", handleStatus);
    };
  }, [provider, getStatus]);

  return { state };
}

// ── Hook: useMyPresence ──────────────────────────────────────────────────────

export function useMyPresence(): [
  Record<string, unknown>,
  (fields: Record<string, unknown>) => void,
] {
  const { provider } = useHocuspocusContext();

  const getPresence = useCallback(
    () => provider.awareness?.getLocalState()?.user ?? {},
    [provider],
  );

  const [presence, setPresence] = useState<Record<string, unknown>>(getPresence);

  const updatePresence = useCallback(
    (fields: Record<string, unknown>) => {
      provider.setAwarenessField("user", fields);
      setPresence(fields);
    },
    [provider],
  );

  useEffect(() => {
    const awareness = provider.awareness;
    if (!awareness) return;

    const handleChange = () => {
      setPresence(getPresence());
    };

    awareness.on("change", handleChange);

    return () => {
      awareness.off("change", handleChange);
    };
  }, [provider, getPresence]);

  return [presence, updatePresence];
}

// ── Hook: useOthers ──────────────────────────────────────────────────────────

interface OtherUser {
  clientId: number;
  presence: Record<string, unknown>;
}

export function useOthers(): OtherUser[] {
  const { provider } = useHocuspocusContext();

  const getOthers = useCallback((): OtherUser[] => {
    const awareness = provider.awareness;
    if (!awareness) return [];

    const localClientId = awareness.clientID;
    const others: OtherUser[] = [];

    awareness.getStates().forEach((state: Record<string, unknown>, clientId: number) => {
      if (clientId === localClientId) return;
      if (state?.user) {
        others.push({ clientId, presence: state.user as Record<string, unknown> });
      }
    });

    return others;
  }, [provider]);

  const [others, setOthers] = useState<OtherUser[]>(getOthers);

  useEffect(() => {
    const awareness = provider.awareness;
    if (!awareness) return;

    const handleChange = () => {
      setOthers(getOthers());
    };

    awareness.on("change", handleChange);

    return () => {
      awareness.off("change", handleChange);
    };
  }, [provider, getOthers]);

  return others;
}

// ── Hook: useStorage ─────────────────────────────────────────────────────────
// Returns [snapshot, yMap] for a named top-level Y.Map on the shared doc.
// The snapshot auto-updates on any remote or local mutation.

export function useStorage(
  mapName: string,
): [Record<string, unknown> | null, Y.Map<unknown> | null] {
  const { doc } = useHocuspocusContext();

  const yMap = useMemo(() => doc.getMap(mapName), [doc, mapName]);

  const getSnapshot = useCallback(
    () => (yMap ? Object.fromEntries(yMap.entries()) : null),
    [yMap],
  );

  const [snapshot, setSnapshot] = useState<Record<string, unknown> | null>(getSnapshot);

  useEffect(() => {
    if (!yMap) return;

    const handleChange = () => {
      setSnapshot(getSnapshot());
    };

    yMap.observe(handleChange);

    return () => {
      yMap.unobserve(handleChange);
    };
  }, [yMap, getSnapshot]);

  return [snapshot, yMap];
}
