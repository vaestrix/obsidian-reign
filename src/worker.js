import { receiveWebhook } from './savannah.js';
export { SavannahInbox } from './savannah.js';
export default {
  async fetch(request, env) {
    if (new URL(request.url).pathname === '/webhooks/hostinger') return receiveWebhook(request, env);
    return env.ASSETS.fetch(request);
  }
};
