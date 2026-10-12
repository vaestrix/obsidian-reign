// Aggregate-only operational view. No contact identities or message contents leave storage.
export async function inboxStatus(storage, env) {
  const count = async prefix => {
    const states = {}; let startAfter;
    for (;;) {
      const page = await storage.list({ prefix, limit: 1000, ...(startAfter ? { startAfter } : {}) });
      for (const value of page.values()) {
        const state = typeof value.state === 'string' ? value.state : 'unknown';
        states[state] = (states[state] ?? 0) + 1;
      }
      if (page.size < 1000) break;
      startAfter = [...page.keys()].at(-1);
    }
    return states;
  };
  return {
    generatedAt: new Date().toISOString(), scope: 'current durable states; not daily activity totals',
    switches: { anna: env.ANNA_AUTO_SEND === 'true', savannah: env.SAVANNAH_AUTO_SEND === 'true' },
    outreach: await count('anna:outbox:'), inboxJobs: await count('job:')
  };
}
