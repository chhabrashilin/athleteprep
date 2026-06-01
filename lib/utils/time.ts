/**
 * Formats a number of seconds as a human-readable timestamp string.
 * Under 1 hour: "MM:SS". One hour or more: "H:MM:SS".
 */
export function formatSecondsAsTimestamp(seconds: number): string {
  const total = Math.floor(Math.max(0, seconds));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;

  if (h > 0) {
    return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

/**
 * Parses a timestamp string into seconds.
 * Accepts: "83", "1:23", "01:23", "1:02:15".
 * Returns null if the input is invalid or represents a negative time.
 */
export function parseTimestampToSeconds(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;

  // Plain number — e.g. "83" or "83.5"
  if (/^\d+(\.\d+)?$/.test(trimmed)) {
    const n = parseFloat(trimmed);
    return isNaN(n) || n < 0 ? null : n;
  }

  const parts = trimmed.split(":");

  // MM:SS
  if (parts.length === 2) {
    const m = parseInt(parts[0], 10);
    const s = parseInt(parts[1], 10);
    if (isNaN(m) || isNaN(s) || m < 0 || s < 0 || s >= 60) return null;
    return m * 60 + s;
  }

  // H:MM:SS
  if (parts.length === 3) {
    const h = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10);
    const s = parseInt(parts[2], 10);
    if (
      isNaN(h) || isNaN(m) || isNaN(s) ||
      h < 0 || m < 0 || s < 0 || m >= 60 || s >= 60
    ) return null;
    return h * 3600 + m * 60 + s;
  }

  return null;
}

/**
 * Clamps a timestamp to [0, durationSeconds].
 * If durationSeconds is null/undefined/not-finite, only clamps to >= 0.
 */
export function clampTimestamp(seconds: number, durationSeconds?: number | null): number {
  const clamped = Math.max(0, seconds);
  if (durationSeconds != null && isFinite(durationSeconds) && durationSeconds > 0) {
    return Math.min(clamped, durationSeconds);
  }
  return clamped;
}
