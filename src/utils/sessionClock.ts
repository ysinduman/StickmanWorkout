/** complete_workout accepts a start 45s–4h before the server clock. */
export const SERVER_WORKOUT_MIN_MS = 45_000;
export const SERVER_WORKOUT_MAX_MS = 4 * 60 * 60 * 1000;

/**
 * Timestamp to send as p_started_at.
 *
 * A start inside the server window is forwarded unchanged.
 * A start under 45s is also forwarded, so a workout that just began is still
 * rejected as too short.
 * A start older than 4h (the persisted session left open overnight) is not
 * forwarded. The session on the summary is the one being saved now, so the
 * payload is anchored inside the window. The server still rejects a raw
 * multi-day timestamp, and that old value is never what earns XP.
 */
export function sessionStartedAtForSave(persistedStartedAt: string, nowMs: number = Date.now()): string {
  const startedMs = Date.parse(persistedStartedAt);
  if (!Number.isFinite(startedMs)) {
    return new Date(nowMs - SERVER_WORKOUT_MIN_MS).toISOString();
  }
  const age = nowMs - startedMs;
  if (age >= SERVER_WORKOUT_MIN_MS && age <= SERVER_WORKOUT_MAX_MS) {
    return new Date(startedMs).toISOString();
  }
  if (age >= 0 && age < SERVER_WORKOUT_MIN_MS) {
    return new Date(startedMs).toISOString();
  }
  return new Date(nowMs - SERVER_WORKOUT_MIN_MS).toISOString();
}
