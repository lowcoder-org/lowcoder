const CURSOR_PALETTE = [
  "#E53935",
  "#1E88E5",
  "#43A047",
  "#FB8C00",
  "#8E24AA",
  "#00ACC1",
  "#F4511E",
  "#3949AB",
  "#7CB342",
  "#D81B60",
  "#6D4C41",
  "#546E7A",
] as const;

function hashString(input: string): number {
  let hash = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export function getUserColor(userId: string): string {
  const normalized = userId.trim() || "anonymous";
  return CURSOR_PALETTE[hashString(normalized) % CURSOR_PALETTE.length];
}
