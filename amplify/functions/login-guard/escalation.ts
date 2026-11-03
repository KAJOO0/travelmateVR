// Pure logic, no AWS SDK imports — kept separate from handler.ts so the escalation math is
// easy to read/verify/test in isolation. Mirrors the demo-mode loginGuard's intent
// (src/services/account.ts) but enforced server-side and escalating across stages.
//
// Design principle, worth stating given a bug here could lock a real user out: every
// ambiguous case (decay math, a lost increment under a read-then-write race in handler.ts) is
// written to fail *toward under-locking* — an attacker gets one extra guess, never does a real
// user get an extra, incorrect lock. The one function that must be exactly right is
// isLocked() on an already-locked record; kept trivial on purpose.

/** No failures recorded in this long without a resolution (success or a finished lock) —
 *  treat history as fresh. Proposed default; easy to retune, this is the one place it lives. */
export const DECAY_MS = 48 * 60 * 60 * 1000;

/** Minutes locked per stage: 15min -> 30min -> 24h. A 4th+ cycle stays at 24h (saturates). */
export const STAGE_MINUTES = [15, 30, 24 * 60] as const;

/** Failures allowed before the current stage's lock kicks in. */
export const MAX_PER_STAGE = 3;

export interface LoginAttemptRecord {
  failures: number;
  stage: number;
  lockedUntil: string | null;
  lastFailureAt: string | null;
}

const FRESH: LoginAttemptRecord = { failures: 0, stage: 0, lockedUntil: null, lastFailureAt: null };

/** Applies decay lazily — no scheduled job needed: history older than DECAY_MS reads back as fresh. */
export function effective(record: LoginAttemptRecord | null | undefined, now: number): LoginAttemptRecord {
  if (!record) return FRESH;
  if (record.lastFailureAt && now - Date.parse(record.lastFailureAt) > DECAY_MS) return FRESH;
  return record;
}

export function isLocked(eff: LoginAttemptRecord, now: number): string | undefined {
  return eff.lockedUntil && Date.parse(eff.lockedUntil) > now ? eff.lockedUntil : undefined;
}

export type FailureResult =
  | { next: LoginAttemptRecord; locked: string }
  | { next: LoginAttemptRecord; attemptsLeft: number };

/** Called only after a real, server-verified wrong password (handler.ts calls AdminInitiateAuth
 *  first) — never called speculatively, so there's no freely-callable "record a failure"
 *  surface for an attacker to abuse directly. */
export function recordFailure(eff: LoginAttemptRecord, now: number): FailureResult {
  const failures = eff.failures + 1;
  const nowIso = new Date(now).toISOString();
  if (failures >= MAX_PER_STAGE) {
    const stageIdx = Math.min(eff.stage, STAGE_MINUTES.length - 1);
    const lockedUntil = new Date(now + STAGE_MINUTES[stageIdx] * 60_000).toISOString();
    const nextStage = Math.min(eff.stage + 1, STAGE_MINUTES.length - 1); // saturates, never un-escalates on its own
    return { next: { failures: 0, stage: nextStage, lockedUntil, lastFailureAt: nowIso }, locked: lockedUntil };
  }
  return { next: { failures, stage: eff.stage, lockedUntil: null, lastFailureAt: nowIso }, attemptsLeft: MAX_PER_STAGE - failures };
}
