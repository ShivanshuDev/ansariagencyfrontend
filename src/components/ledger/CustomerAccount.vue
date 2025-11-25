<template>
  <v-card style="margin:10px;" class="customers-card elevation-2">
    <!-- Header -->
    <v-row class="header-row" align="center" justify="space-between" no-gutters>
      <div class="header-left">
        <div class="title">Customers</div>
        <div class="subtitle">All customer accounts (server-side)</div>
      </div>

      <div class="header-controls">
        <v-select
          v-model="vendorFilter"
          :items="vendorOptions"
          dense
          hide-details
          clearable
          label="Vendor"
          class="mr-4 header-select"
          style="min-width:220px;"
        />
        <v-text-field
          v-model="clientSearch"
          dense
          hide-details
          placeholder="Search by Client ID"
          append-icon="mdi-magnify"
          @keyup.enter="onSearch"
          style="min-width:300px;"
          clearable
        />
      </div>
    </v-row>

    <v-divider class="my-4" />

    <!-- Table -->
    <v-data-table
      :headers="headers"
      :items="customers"
      :items-per-page="limit"
      class="customers-table"
      dense
      disable-sort
      hide-default-header
      :loading="loading"
    >
      <!-- custom header -->
      <template v-slot:header>
        <thead class="table-head">
          <tr>
            <th class="th-small">S.No.</th>
            <th>Client ID</th>
            <th>Name</th>
            <th>Phone</th>
            <th>Email</th>
            <th class="th-actions">Actions</th>
          </tr>
        </thead>
      </template>

      <!-- rows -->
      <template v-slot:item="{ item, index }">
        <tr class="table-row" :key="getVendorId(item)">
          <td class="td-small">{{ serialStart + index }}</td>
          <td class="mono small">{{ getVendorId(item) }}</td>
          <td>
            <div class="name-cell">{{ item.name || getNameFromItem(item) || '-' }}</div>
          </td>
          <td class="mono">{{ item.phone || getPhoneFromItem(item) || '-' }}</td>
          <td class="text-truncate email-col">{{ item.email || (item.customer && item.customer.email) || '-' }}</td>
          <td class="text-center">
            <v-btn small text @click="showDetails(item)" aria-label="View details">Details</v-btn>
          </td>
        </tr>
      </template>

      <template v-slot:no-data>
        <v-alert type="info" dense text>
          No customers found.
        </v-alert>
      </template>

      <!-- footer -->
      <template v-slot:footer.page-text>
        <div class="footer-row">
          <div class="left-footer">
            <span class="mr-3">Rows per page</span>
            <v-select v-model="limit" :items="perPageOptions" dense hide-details style="width:90px" @change="onLimitChange" />
          </div>

          <div class="right-footer">
            <div class="range">{{ rangeText }}</div>
            <v-icon small class="nav-icon" :class="{ disabled: !canPrev }" @click="goPrev">mdi-chevron-left</v-icon>
            <v-icon small class="nav-icon" :class="{ disabled: !canNext }" @click="goNext">mdi-chevron-right</v-icon>
          </div>
        </div>
      </template>
    </v-data-table>

    <!-- Details dialog -->
    <v-dialog v-model="detailsDialog" max-width="1100px" persistent>
      <v-card class="details-card">
        <v-toolbar flat dense class="dialog-toolbar">
          <div class="dialog-title">
            <div class="headline">{{ details.customer?.name || details.customer?.customerId || 'Customer' }}</div>
            <div class="caption">Customer ID: <strong class="mono">{{ details.customer?.customerId || '-' }}</strong></div>
          </div>

          <v-spacer />

          <v-btn icon @click="detailsDialog = false" aria-label="Close dialog">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-toolbar>

        <v-card-text>
          <div v-if="detailsLoading" class="loading-area">
            <v-progress-circular indeterminate size="40" />
          </div>

          <div v-else>
            <v-row dense>
              <!-- LEFT: Contact + payments -->
              <v-col cols="12" md="5">
                <v-sheet class="info-card pa-4" elevation="0">
                  <div class="section-title">Contact</div>

                  <div class="contact-block">
                    <div class="name-large">{{ details.customer?.name || '-' }}</div>
                    <div class="muted">{{ details.customer?.email || '-' }}</div>
                  </div>

                  <v-divider class="my-3" />

                  <div class="info-row"><div class="info-label">Phone</div><div class="info-value mono">{{ details.customer?.phone || '-' }}</div></div>
                  <div class="info-row"><div class="info-label">Email</div><div class="info-value">{{ details.customer?.email || '-' }}</div></div>

                  <v-divider class="my-3" />

                  <div class="info-row full">
                    <div class="info-label">Address</div>
                    <div class="info-value">
                      <div v-if="details.customer?.address">
                        <div>{{ details.customer.address.line1 || '' }}</div>
                        <div v-if="details.customer.address.line2">{{ details.customer.address.line2 }}</div>
                        <div class="muted">{{ [details.customer.address.village, details.customer.address.district, details.customer.address.state, details.customer.address.pincode].filter(Boolean).join(', ') }}</div>
                      </div>
                      <div v-else>-</div>
                    </div>
                  </div>

                  <v-divider class="my-3" />

                  <div class="info-row full">
                    <div class="info-label">ID Proof</div>
                    <div class="info-value">
                      <div v-if="details.customer?.idProof">
                        <div><strong>{{ details.customer.idProof.type || '-' }}</strong></div>
                        <div class="muted">{{ details.customer.idProof.value || '-' }}</div>
                      </div>
                      <div v-else>-</div>
                    </div>
                  </div>
                </v-sheet>

                <v-sheet class="payments-card mt-4 pa-3" elevation="0">
                  <div class="section-title">Recent Payments</div>
                  <div v-if="details.account && details.account.payments && details.account.payments.length">
                    <v-list dense>
                      <v-list-item v-for="(p, idx) in details.account.payments" :key="p.id || idx" class="payment-item">
                        <v-list-item-content>
                          <div class="payment-top">
                            <div class="payment-amount">{{ formatCurrency(p.amount) }}</div>
                            <div class="payment-mode">{{ p.mode || '-' }}</div>
                          </div>
                          <div class="muted small">{{ p.reference || '-' }} • {{ formatDate(p.date) }}</div>
                        </v-list-item-content>
                        <v-list-item-action>
                          <v-chip small outlined class="chip-mode">{{ p.mode || 'PAY' }}</v-chip>
                        </v-list-item-action>
                      </v-list-item>
                    </v-list>
                  </div>
                  <div v-else class="muted">No recent payments</div>

                  <v-divider class="my-3" />

                  <div class="section-title">Due Plan</div>
                  <div v-if="details.account && details.account.duePlan && details.account.duePlan.length">
                    <v-list dense>
                      <v-list-item v-for="(d, i) in details.account.duePlan" :key="i">
                        <v-list-item-content>
                          <div class="small">{{ d.date || '-' }} — {{ formatCurrency(d.amount || d.due || 0) }}</div>
                          <div class="muted small">{{ d.note || '' }}</div>
                        </v-list-item-content>
                      </v-list-item>
                    </v-list>
                  </div>
                  <div v-else class="muted">No due plan</div>
                </v-sheet>
              </v-col>

              <!-- RIGHT: Account summary (NO balance) -->
              <v-col cols="12" md="7">
                <v-sheet class="summary-card pa-4" elevation="0">
                  <div class="summary-head">
                    <div>
                      <div class="section-title">Account Summary</div>
                      <div class="muted">Quick financial overview</div>
                    </div>

                    <!-- prominent red due chip -->
                    <div v-if="hasDue" class="due-chip-wrap">
                      <v-chip class="due-chip" small>{{ formatCurrency(details.account?.totalDue) }}</v-chip>
                    </div>
                  </div>

                  <v-divider class="my-3" />

                  <v-row>
                    <v-col cols="12" sm="6">
                      <div class="small muted">Total Invoiced</div>
                      <div class="stat">{{ formatCurrency(details.account?.totalInvoicedAmount) }}</div>
                    </v-col>

                    <v-col cols="12" sm="6">
                      <div class="small muted">Total Paid</div>
                      <div class="stat">{{ formatCurrency(details.account?.totalPaid) }}</div>
                    </v-col>

                    <v-col cols="12" sm="6" class="mt-4">
                      <div class="small muted">Total Due</div>
                      <div class="stat">
                        {{ formatCurrency(details.account?.totalDue) }}
                        <v-chip v-if="hasDue" class="due-chip-small ml-2" small>Due</v-chip>
                      </div>
                    </v-col>

                    <v-col cols="12" sm="6" class="mt-4">
                      <div class="small muted">Invoices</div>
                      <div class="stat">{{ details.account?.totalInvoicesCount ?? 0 }}</div>
                    </v-col>
                  </v-row>

                  <v-divider class="my-3" />

                  <v-row>
                    <v-col cols="12" md="6">
                      <div class="small muted">Last Invoice</div>
                      <div class="mono">{{ details.account?.lastInvoiceRef || '-' }}</div>
                      <div class="muted small">{{ formatDate(details.account?.lastInvoiceDate) }}</div>
                    </v-col>

                    <v-col cols="12" md="6">
                      <div class="small muted">Currency</div>
                      <div>{{ details.account?.currency || 'INR' }}</div>
                    </v-col>
                  </v-row>
                  <v-divider class="my-3" />
                </v-sheet>
              </v-col>
            </v-row>
          </div>
        </v-card-text>

        <v-card-actions>
          <v-spacer />
          <v-btn text @click="detailsDialog = false">Close</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Snackbar -->
    <v-snackbar v-model="snackbar.show" :timeout="5000" color="error">
      {{ snackbar.text }}
      <v-btn text @click="snackbar.show = false">Close</v-btn>
    </v-snackbar>
  </v-card>
</template>

<script>
import axios from 'axios';

export default {
  name: 'CustomerAccounts',
  data() {
    return {
      customers: [],
      headers: [
        { text: 'S.No.', value: 'serial', width: '70px' },
        { text: 'Client ID', value: 'vendorId' },
        { text: 'Name', value: 'name' },
        { text: 'Phone', value: 'phone' },
        { text: 'Email', value: 'email' },
        { text: 'Actions', value: 'actions', sortable: false, align: 'center' }
      ],
      loading: false,
      limit: 5,
      perPageOptions: [5, 10, 20, 50],
      pageStack: [],
      lastKey: null,
      serialStart: 1,
      vendorFilter: null,
      vendorOptions: [],
      clientSearch: '',
      detailsDialog: false,
      details: { vendor: null, customer: null, account: null },
      detailsLoading: false,
      snackbar: { show: false, text: '' },
      // kept path (unused visually, kept for future if you want avatar)
      designImage: '/mnt/data/e9f35eff-ad15-49f3-98a9-09b630cc141b.png',
      totalCount: null
    };
  },
  computed: {
    canNext() { return !!this.lastKey; },
    canPrev() { return this.pageStack.length > 0; },
    prettyDetails() {
      try { return JSON.stringify(this.details, null, 2); } catch (e) { return String(this.details); }
    },
    sanitizedPrettyDetails() {
      try {
        const s = this._sanitizeForDisplay(this.details);
        return JSON.stringify(s, null, 2);
      } catch (e) {
        return String(this.details);
      }
    },
    rangeText() {
      const totalShown = this.customers.length;
      const start = this.serialStart;
      const end = this.serialStart + totalShown - 1;
      return `${start}-${end} of ${this.totalCount ?? totalShown}`;
    },
    hasDue() {
      const due = this.details?.account?.totalDue;
      return (due != null) && Number(due) > 0;
    }
  },
  mounted() {
    this.fetchCustomers(true);
  },
  methods: {
    API_CUSTOMERS() { return `${process.env.VUE_APP_AGENCY_BACKEND_URL}getAllAccountCustomers`; },
    API_ACCOUNT_BY_ID() { return `${process.env.VUE_APP_AGENCY_BACKEND_URL}getAccountByClientId`; },

    async fetchCustomers(reset = false) {
      try {
        if (reset) { this.pageStack = []; this.lastKey = null; this.serialStart = 1; }
        this.loading = true;
        const params = { limit: Number(this.limit || 5), vendor: this.vendorFilter || undefined, clientId: this.clientSearch || undefined };
        if (this.lastKey) params.lastKey = JSON.stringify(this.lastKey);
        const resp = await axios.get(this.API_CUSTOMERS(), { params });
        const data = resp.data || {};
        this.customers = data.items || [];
        this.lastKey = data.lastEvaluatedKey || null;
        this.vendorOptions = data.vendorOptions || this.vendorOptions;
        this.totalCount = data.count || null;
        this.serialStart = (this.pageStack.length * Number(this.limit || 5)) + 1;
      } catch (err) {
        console.error('fetchCustomers err', err);
        this.snackbar.text = (err.response && err.response.data && err.response.data.message) || err.message || 'Failed to fetch customers';
        this.snackbar.show = true;
      } finally { this.loading = false; }
    },

    onLimitChange() { this.lastKey = null; this.pageStack = []; this.fetchCustomers(true); },
    goNext() { if (!this.lastKey) return; this.pageStack.push(this.lastKey); this.fetchCustomers(false); },
    goPrev() { if (!this.canPrev) return; const prevLastKey = this.pageStack.pop(); this.lastKey = prevLastKey || null; this.serialStart = (this.pageStack.length * Number(this.limit || 5)) + 1; this.fetchCustomers(false); },
    onSearch() { this.lastKey = null; this.pageStack = []; this.fetchCustomers(true); },

    // helpers
    getNameFromItem(it) { if (!it) return null; if (it.name) return it.name; if (it.customer && it.customer.name) return it.customer.name; return it.nameLower || null; },
    getPhoneFromItem(it) { if (!it) return null; if (it.phone) return it.phone; if (it.customer && it.customer.phone) return it.customer.phone; return null; },
    getVendorId(it) { if (!it) return '-'; if (it.vendorId) return it.vendorId; if (it.customerId) return it.customerId; if (it.pk && String(it.pk).includes('#')) return String(it.pk).split('#')[1]; return it.accountId || '-'; },

    showStatusChip(entity) {
      if (!entity || !entity.status) return false;
      const s = String(entity.status).toUpperCase();
      return s !== 'ACTIVE';
    },

    // show details (unchanged API usage)
    async showDetails(item) {
      let clientId = null;
      if (item.accountId) clientId = item.accountId.replace(/^ACCOUNT#/, '');
      else if (item.customerId) clientId = item.customerId;
      else if (item.customer && item.customer.customerId) clientId = item.customer.customerId;
      else if (item.pk && String(item.pk).includes('#')) clientId = String(item.pk).split('#')[1];
      else if (item.gsi1pk && String(item.gsi1pk).startsWith('account#')) clientId = String(item.gsi1pk).split('#')[1];

      if (!clientId) { this.snackbar.text = 'Unable to determine clientId for details'; this.snackbar.show = true; return; }

      try {
        this.detailsDialog = true;
        this.detailsLoading = true;
        this.details = { vendor: null, customer: null, account: null };
        const resp = await axios.get(this.API_ACCOUNT_BY_ID(), { params: { clientId } });
        const data = resp.data || {};
        this.details = { vendor: data.vendor || null, customer: data.customer || null, account: data.account || null };
      } catch (err) {
        console.error('showDetails err', err);
        this.snackbar.text = (err.response && err.response.data && err.response.data.message) || err.message || 'Failed to fetch details';
        this.snackbar.show = true;
        this.detailsDialog = false;
      } finally { this.detailsLoading = false; }
    },

    // formatting
    formatCurrency(val) {
      if (val == null) return '-';
      const num = Number(val);
      if (Number.isNaN(num)) return '-';
      try { return new Intl.NumberFormat('en-IN', { style: 'currency', currency: (this.details.account && this.details.account.currency) || 'INR' }).format(num); }
      catch (e) { return num.toString(); }
    },

    formatDate(d) {
      if (!d) return '-';
      if (typeof d === 'number') { const dt = new Date(d * 1000); return dt.toLocaleString(); }
      const parsed = new Date(d);
      if (!Number.isNaN(parsed.getTime())) return parsed.toLocaleString();
      return d;
    },

    // copy & download (sanitized — no balance)
    copyAccountSummary() {
      const summary = { customer: this.details.customer || {}, account: { totalInvoicedAmount: this.details.account?.totalInvoicedAmount, totalPaid: this.details.account?.totalPaid, totalDue: this.details.account?.totalDue, lastInvoiceRef: this.details.account?.lastInvoiceRef } };
      const text = JSON.stringify(summary, null, 2);
      if (navigator && navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(() => { this.snackbar.text = 'Account summary copied'; this.snackbar.show = true; }).catch(() => { this.snackbar.text = 'Copy failed'; this.snackbar.show = true; });
      } else { const w = window.open(); w.document.write(`<pre>${text.replace(/</g,'&lt;')}</pre>`); }
    },

    downloadAccountJson() {
      const payload = this._sanitizeForDownload(this.details);
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = `account_${this.details.customer?.customerId || 'unknown'}.json`; a.click(); URL.revokeObjectURL(url);
    },

    // sanitizers - remove any field with "balance" in the key (case-insensitive)
    _sanitizeForDisplay(obj) {
      if (!obj) return obj;
      try {
        const cloned = JSON.parse(JSON.stringify(obj));
        if (cloned.account && 'balance' in cloned.account) delete cloned.account.balance;
        const rec = (o) => { if (!o || typeof o !== 'object') return; for (const k of Object.keys(o)) { if (k.toLowerCase().includes('balance')) { delete o[k]; } else if (typeof o[k] === 'object') rec(o[k]); } };
        rec(cloned);
        return cloned;
      } catch (e) { return obj; }
    },

    _sanitizeForDownload(obj) { return this._sanitizeForDisplay(obj); }
  }
};
</script>

<style scoped>
/* --- Fonts & base --- */
.customers-card {
  border-radius: 10px;
  overflow: hidden;
  padding: 18px;
  background: linear-gradient(180deg, #ffffff 0%, #fbfdff 100%);
  box-shadow: 0 6px 22px rgba(16,24,40,0.06);
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial;
  color: #111827;
}

/* header */
.header-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}
.header-left .title {
  font-size: 20px;
  font-weight: 700;
  letter-spacing: -0.2px;
}
.header-left .subtitle {
  font-size: 13px;
  color: #6b7280;
  margin-top: 4px;
}

/* header controls */
.header-controls {
  display: flex;
  align-items: center;
}

/* table */
.customers-table {
  border-radius: 8px;
  overflow: hidden;
}
.table-head th {
  background: linear-gradient(90deg,#f3f6fb,#ffffff);
  border-bottom: 0;
  padding: 14px 12px;
  text-align: left;
  font-weight: 700;
  color: #0f172a;
  font-size: 13px;
  letter-spacing: 0.1px;
}
.table-row td {
  padding: 12px;
  border-bottom: 1px solid rgba(15,23,42,0.04);
}
.td-small { width: 56px; font-weight: 600; color: #374151; }
.name-cell { font-weight: 600; color: #0b1320; }
.email-col { max-width: 260px; color: #374151; }
.mono { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, "Roboto Mono", monospace; color: #0b1320; }

/* footer */
.footer-row {
  display:flex;
  align-items:center;
  justify-content:space-between;
  padding: 10px 6px;
  background: transparent;
}
.left-footer { display:flex; align-items:center; gap:10px; }
.right-footer { display:flex; align-items:center; gap:8px; }
.range { color: #374151; font-weight:500; }
.nav-icon { cursor:pointer; color: #374151; }
.nav-icon.disabled { color: rgba(15,23,42,0.15); pointer-events: none; }

/* details dialog */
.details-card { border-radius:10px; overflow:hidden; }
.dialog-toolbar { padding: 16px; display:flex; align-items:center; gap:12px; border-bottom:1px solid rgba(15,23,42,0.04); }
.dialog-title .headline { font-size:18px; font-weight:700; }
.dialog-title .caption { font-size:13px; color:#6b7280; }
.loading-area { display:flex; align-items:center; justify-content:center; padding:40px 0; }

/* info & summary */
.info-card {
  background: linear-gradient(180deg, #ffffff, #fbfdff);
  border-radius:8px;
  box-shadow: 0 2px 8px rgba(16,24,40,0.03);
}
.section-title { font-weight:700; color:#0f172a; margin-bottom:8px; }
.contact-block .name-large { font-size:16px; font-weight:700; }
.muted { color:#6b7280; font-size:13px; margin-top:4px; }
.info-row { display:flex; justify-content:space-between; margin:8px 0; }
.info-label { color:#6b7280; font-size:13px; }
.info-value { font-weight:600; color:#0b1320; }
.payments-card { background: #fff; border-radius:8px; box-shadow: 0 1px 6px rgba(16,24,40,0.03); }
.payment-item { padding-top:8px; padding-bottom:8px; }
.payment-top { display:flex; gap:12px; align-items:center; }
.payment-amount { font-weight:700; color:#0b1320; }
.payment-mode { color:#6b7280; font-size:13px; }

/* chips */
.chip-mode { border-color: #e6eefb; color: #0b69ff; }
.due-chip {
  background-color: #d32f2f !important;
  color: #fff !important;
  font-weight:700;
  border-radius:8px !important;
  padding: 6px 12px;
  text-transform: none;
}
.due-chip-small {
  background-color: #d32f2f !important;
  color: #fff !important;
  font-weight:600;
  border-radius:6px !important;
  padding: 2px 6px;
}

/* summary card */
.summary-card {
  background: linear-gradient(180deg,#ffffff,#fbfdff);
  border-radius:8px;
  box-shadow: 0 2px 10px rgba(16,24,40,0.03);
}
.summary-head { display:flex; align-items:center; justify-content:space-between; }
.stat { font-size:18px; font-weight:700; color:#0b1320; margin-top:6px; }

/* json box */
.json-box {
  background: #0b1320;
  color: #e6eefb;
  padding: 12px;
  border-radius: 8px;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, "Roboto Mono", monospace;
  font-size: 12px;
  max-height: 320px;
  overflow:auto;
}

/* actions */
.actions-row { display:flex; gap:12px; align-items:center; }

/* responsive tweaks */
@media (max-width: 960px) {
  .header-controls { margin-top: 8px; }
  .table-head th { font-size: 12px; }
  .summary-card { margin-top: 12px; }
}
</style>
