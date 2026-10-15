// A deployment can be armed now while outbound work waits for the owner date.
export function automationStart(env) {
  if (!env.AGENTS_START_AT) return 0;
  const start = Date.parse(env.AGENTS_START_AT);
  if (!Number.isFinite(start)) throw new Error('invalid-agent-start-date');
  return start;
}
export function automationWaiting(env, now = Date.now()) {
  return now < automationStart(env);
}
