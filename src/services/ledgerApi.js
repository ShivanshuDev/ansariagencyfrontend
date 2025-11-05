// Adjust the base URL if needed. You can also pass it from env via process.env.VUE_APP_AGENCY_BACKEND_URL
const BASE = (process.env.VUE_APP_AGENCY_BACKEND_URL || '').replace(/\/$/, '');

async function http(method, url, body) {
  const res = await fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || json?.ok === false) {
    const msg = json?.message || `HTTP ${res.status}`;
    throw new Error(msg);
  }
  return json;
}

export const ledgerApi = {
  addEntry(payload) {
    return http('POST', `${BASE}/ledger/add`, payload);
  },
  addClientDeposit(payload) {
    return http('POST', `${BASE}/addClientDeposit`, payload);
  },
  getClientEntries({ clientId, from, to, limit, nextKey }) {
    const qs = new URLSearchParams({ clientId });
    if (from) qs.set('from', from);
    if (to) qs.set('to', to);
    if (limit) qs.set('limit', String(limit));
    if (nextKey) qs.set('nextKey', nextKey);
    return http('GET', `${BASE}/ledger/client?${qs.toString()}`);
  },
  getClientSummary({ clientId, period }) {
    const qs = new URLSearchParams({ clientId, period: period || 'daily' });
    return http('GET', `${BASE}/ledger/summary?${qs.toString()}`);
  },
  getClientEntriesByType({ clientId, type, from, to }) {
    const qs = new URLSearchParams({ clientId, type });
    if (from) qs.set('from', from);
    if (to) qs.set('to', to);
    return http('GET', `${BASE}/ledger/client/type?${qs.toString()}`);
  },
  getAllEntries({ from, to, type }) {
    const qs = new URLSearchParams();
    if (from) qs.set('from', from);
    if (to) qs.set('to', to);
    if (type) qs.set('type', type);
    return http('GET', `${BASE}/all?${qs.toString()}`);
  },
  getAllSummary({ period }) {
    const qs = new URLSearchParams({ period: period || 'daily' });
    return http('GET', `${BASE}/ledger/summary/all?${qs.toString()}`);
  },
  getSeries({ granularity, from, to, clientId }) {
    const qs = new URLSearchParams({ granularity: granularity || 'daily' });
    if (from) qs.set('from', from);
    if (to) qs.set('to', to);
    if (clientId) qs.set('clientId', clientId);
    return http('GET', `${BASE}/ledger/series?${qs.toString()}`);
  }
};
