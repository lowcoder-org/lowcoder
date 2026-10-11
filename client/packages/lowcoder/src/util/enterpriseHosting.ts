/** This restriction belongs only to Lowcoder's public reference installation. */
export function isPublicLowcoderCloud(hostname = window.location.hostname): boolean {
  return hostname.toLowerCase().replace(/\.$/, "") === "app.lowcoder.cloud";
}
