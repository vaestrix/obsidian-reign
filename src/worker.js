import { receiveWebhook } from './savannah.js';
import legacyWorker from './legacy-worker.js';
export { CommandStore } from './legacy-worker.js';
export { SavannahInbox } from './savannah.js';
export default {
  async fetch(request, env) {
    if (new URL(request.url).pathname === '/webhooks/hostinger') return receiveWebhook(request, env);
    return legacyWorker.fetch(request, env);
  }
};
