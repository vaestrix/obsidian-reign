import { receiveWebhook } from './savannah.js';
import legacyWorker from './legacy-worker.js';
import { portal } from './portal.js';
export { ProjectHub } from './portal.js';
export { CommandStore } from './legacy-worker.js';
export { SavannahInbox } from './savannah.js';
export default {
  async fetch(request, env) {
    const response = await portal(request, env);
    if (response) return response;
    if (new URL(request.url).pathname === '/webhooks/hostinger') return receiveWebhook(request, env);
    return legacyWorker.fetch(request, env);
  }
};
