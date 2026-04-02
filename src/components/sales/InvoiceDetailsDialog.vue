<template>
  <v-dialog v-model="open" persistent max-width="1040px" scrollable>
    <v-card class="rounded-xl details-card">
      <!-- Header -->
      <v-toolbar flat class="details-toolbar">
        <div class="flex items-center">
          <v-avatar size="40" class="mr-3 soft-avatar">
            <v-icon>mdi-receipt-text</v-icon>
          </v-avatar>
          <div>
            <div class="text-sm text-slate-500 font-medium">Invoice</div>
            <div class="text-lg font-semibold leading-tight">
              {{ invoice.invoiceNumber || invoice.billNumber }}
              <v-chip small class="ml-2 status-chip" :class="statusClass">
                <v-icon left small>mdi-check-decagram-outline</v-icon>{{ (invoice.status || '—').toUpperCase() }}
              </v-chip>
            </div>
          </div>
        </div>

        <v-spacer/>

        <!-- Quick facts -->
        <div class="mr-3 text-right hidden-sm-and-down">
          <div class="caption text-slate-500">Invoice Date</div>
          <div class="font-medium">{{ displayDate(invoice.invoiceDateISO) }}</div>
        </div>
        <div class="mr-6 text-right hidden-sm-and-down">
          <div class="caption text-slate-500">Grand Total</div>
          <div class="font-semibold">{{ currency(invoice.grandTotal ?? invoice.totals?.totalAmount) }}</div>
        </div>

        <!-- Header actions -->
        <v-btn icon class="btn-outline mr-1" @click="$emit('download-pdf', invoice)" :title="'Download PDF'">
          <v-icon>mdi-file-pdf-box</v-icon>
        </v-btn>
        <v-btn icon class="btn-outline mr-1" @click="$emit('download-csv', invoice)" :title="'Download Excel'">
          <v-icon>mdi-file-excel-box</v-icon>
        </v-btn>
        <v-btn icon class="btn-primary" @click="$emit('send-mail', invoice)" :title="'Send Mail'">
          <v-icon>mdi-email-send-outline</v-icon>
        </v-btn>
        <v-btn icon class="ml-2" @click="close" :title="'Close'">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </v-toolbar>

      <!-- Content -->
      <v-card-text class="pt-6">
        <!-- Summary cards -->
        <div class="grid md:grid-cols-3 gap-4 mb-6">
          <div class="summary-card">
            <div class="summary-title">Customer</div>
            <div class="summary-value">
              {{ invoice.customer?.name || '—' }}
            </div>
            <div class="summary-sub">
              <v-icon x-small class="mr-1">mdi-phone</v-icon>{{ invoice.customer?.phone || invoice.phone || '—' }}
              <span v-if="invoice.customer?.email">&nbsp;•&nbsp;<v-icon x-small class="mr-1">mdi-at</v-icon>{{ invoice.customer.email }}</span>
            </div>
          </div>

          <div class="summary-card">
            <div class="summary-title">Vehicle</div>
            <div class="summary-value">
              {{ invoice.vehicle?.model || '—' }}
            </div>
            <div class="summary-sub">
              <v-chip x-small class="mr-1 soft-chip">{{ invoice.vehicle?.color || '—' }}</v-chip>
              <v-chip x-small class="mr-1 soft-chip">Chassis: {{ invoice.vehicle?.chassisNumber || invoice.chassisNumber || '—' }}</v-chip>
              <v-chip x-small class="soft-chip">Engine: {{ invoice.vehicle?.engineNumber || '—' }}</v-chip>
            </div>
          </div>

          <div class="summary-card">
            <div class="summary-title">Payment</div>
            <div class="summary-value">{{ currency(invoice.totals?.totalPaid || 0) }}</div>
            <div class="summary-sub">
              Due: <span class="font-semibold">{{ currency(invoice.totals?.due ?? (invoice.grandTotal ?? 0)) }}</span>
            </div>
          </div>
        </div>

        <!-- Two-column details -->
        <div class="grid md:grid-cols-2 gap-6">
          <!-- Customer & Address -->
          <v-card flat class="section-card">
            <div class="section-title">
              <v-icon left small>mdi-account-badge-outline</v-icon> Customer Details
            </div>
            <div class="section-grid">
              <div class="item">
                <div class="label">Name</div>
                <div class="value">{{ invoice.customer?.name || '—' }}</div>
              </div>
              <div class="item">
                <div class="label">Phone</div>
                <div class="value">{{ invoice.customer?.phone || invoice.phone || '—' }}</div>
              </div>
              <div class="item">
                <div class="label">Relation</div>
                <div class="value">{{ invoice.customer?.relationType }} <span v-if="invoice.customer?.relationName">({{ invoice.customer.relationName }})</span></div>
              </div>
              <div class="item">
                <div class="label">Type</div>
                <div class="value">{{ prettyOwnerType(invoice.ownerType) }} / {{ prettyOwnerType(invoice.customerType) }}</div>
              </div>
              <div class="item col-span-2">
                <div class="label">Address</div>
                <div class="value">
                  {{ fullAddress(invoice.customer?.address || invoice.rawForm?.customer?.address || {}) }}
                </div>
              </div>
            </div>
          </v-card>

          <!-- Vehicle -->
          <v-card flat class="section-card">
            <div class="section-title">
              <v-icon left small>mdi-motorbike</v-icon> Vehicle Details
            </div>
            <div class="section-grid">
              <div class="item"><div class="label">Model</div><div class="value">{{ invoice.vehicle?.model || '—' }}</div></div>
              <div class="item"><div class="label">Category</div><div class="value">{{ invoice.vehicle?.category || invoice.rawForm?.category || '—' }}</div></div>
              <div class="item"><div class="label">Color</div><div class="value">{{ invoice.vehicle?.color || '—' }}</div></div>
              <div class="item"><div class="label">Qty</div><div class="value">{{ invoice.vehicle?.qty || 1 }}</div></div>
              <div class="item"><div class="label">Chassis</div><div class="value mono">{{ invoice.vehicle?.chassisNumber || invoice.chassisNumber || '—' }}</div></div>
              <div class="item"><div class="label">Engine</div><div class="value mono">{{ invoice.vehicle?.engineNumber || '—' }}</div></div>
            </div>
          </v-card>

          <!-- Billing & Tax -->
          <v-card flat class="section-card">
            <div class="section-title">
              <v-icon left small>mdi-cash-multiple</v-icon> Billing & Tax
            </div>
            <div class="section-grid">
              <div class="item"><div class="label">Price Mode</div><div class="value">{{ invoice.billOptions?.billPriceMode || invoice.tax?.billPriceMode || '—' }}</div></div>
              <div class="item"><div class="label">Showroom Total</div><div class="value">{{ currency(invoice.tax?.showroomTotal) }}</div></div>
              <div class="item"><div class="label">CGST</div><div class="value">{{ invoice.tax?.cgstPercent ?? '—' }}% ({{ currency(invoice.tax?.cgstAmount) }})</div></div>
              <div class="item"><div class="label">SGST</div><div class="value">{{ invoice.tax?.sgstPercent ?? '—' }}% ({{ currency(invoice.tax?.sgstAmount) }})</div></div>
              <div class="item"><div class="label">On-Road Total</div><div class="value">{{ currency(invoice.tax?.onRoadTotal) }}</div></div>
              <div class="item"><div class="label">Grand Total</div><div class="value font-semibold">{{ currency(invoice.grandTotal ?? invoice.tax?.billGrandTotal) }}</div></div>
            </div>
          </v-card>

          <!-- Payments -->
          <v-card flat class="section-card">
            <div class="section-title">
              <v-icon left small>mdi-credit-card-outline</v-icon> Payments
            </div>
            <div v-if="(invoice.payments && invoice.payments.length) || (invoice.rawForm?.payments && invoice.rawForm.payments.length)">
              <v-simple-table dense class="payments-table">
                <thead>
                  <tr><th>Mode</th><th>Reference</th><th class="text-right">Amount</th></tr>
                </thead>
                <tbody>
                  <tr v-for="(p, idx) in paymentRows" :key="idx">
                    <td><v-chip x-small class="soft-chip">{{ p.mode || '—' }}</v-chip></td>
                    <td>{{ p.reference || '—' }}</td>
                    <td class="text-right">{{ currency(Number(p.amount || 0)) }}</td>
                  </tr>
                </tbody>
              </v-simple-table>
            </div>
            <div v-else class="text-slate-500 caption">No payments recorded.</div>
          </v-card>
        </div>

        <div>
          <v-card>
            <div class="section-title">
              Documents
            </div>
            {{invoice.docs}}
          </v-card>
        </div>

        <!-- Meta -->
        <v-alert border="left" colored-border class="mt-6 soft-alert" elevation="0">
          <div class="flex flex-wrap items-center justify-between">
            <div>
              <div class="caption text-slate-500">Reference</div>
              <div class="mono">{{ invoice.meta?.refNo || '—' }}</div>
            </div>
            <div>
              <div class="caption text-slate-500">Created At</div>
              <div>{{ isoToLocal(invoice.meta?.createdAt) }}</div>
            </div>
            <div>
              <div class="caption text-slate-500">Last Modified</div>
              <div>{{ tsToLocal(invoice.LastModifiedAt || invoice.updayedAt || invoice.createdAt) }}</div>
            </div>
          </div>
        </v-alert>
      </v-card-text>

      <!-- Footer -->
      <v-divider />
      <v-card-actions class="justify-end py-3">
        <v-btn class="btn-outline" @click="copyJSON"><v-icon left small>mdi-content-copy</v-icon> Copy JSON</v-btn>
        <v-btn class="btn-primary" @click="$emit('send-mail', invoice)"><v-icon left small>mdi-email-send-outline</v-icon> Send Mail</v-btn>
        <v-btn color="primary" text @click="close">Close</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
export default {
  name: 'InvoiceDetailsDialog',
  props: {
    value: { type: Boolean, default: false },     // v-model dialog
    invoice: { type: Object, required: true }
  },
  computed: {
    open: {
      get () { return this.value },
      set (v) { this.$emit('input', v) }
    },
    paymentRows () {
      // Prefer normalized payments; fallback to rawForm.payments
      const p = this.invoice.payments && this.invoice.payments.length
        ? this.invoice.payments
        : (this.invoice.rawForm?.payments || []);
      return Array.isArray(p) ? p : [];
    },
    statusClass () {
      const s = String(this.invoice.status || '').toLowerCase();
      return {
        'status-created': s === 'created',
        'status-paid': s === 'paid',
        'status-pending': s === 'pending',
        'status-delivered': s === 'delivered',
        'status-cancelled': s === 'cancelled'
      }
    }
  },
  methods: {
    close () { this.$emit('input', false) },
    displayDate (iso) {
      if (!iso) return '—';
      const [y,m,d] = String(iso).split('-');
      return `${d}/${m}/${y}`;
    },
    currency (n) {
      const v = Number(n || 0);
      // Indian grouping with INR symbol
      return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(v);
    },
    isoToLocal (iso) {
      if (!iso) return '—';
      try { return new Date(iso).toLocaleString() } catch { return '—' }
    },
    tsToLocal (ts) {
      if (!ts) return '—';
      try { return new Date(Number(ts)).toLocaleString() } catch { return '—' }
    },
    prettyOwnerType (v) {
      const t = String(v || '').toUpperCase();
      return t === 'FIRM' ? 'Firm' : t === 'INDIVIDUAL' ? 'Individual' : '—';
    },
    fullAddress (addr) {
      const a = addr || {};
      const parts = [a.line1, a.line2, a.village, a.block, a.district, a.tahsil, a.state, a.pincode, a.postOffice]
        .filter(Boolean);
      return parts.length ? parts.join(', ') : '—';
    },
    copyJSON () {
      const blob = new Blob([JSON.stringify(this.invoice, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `invoice_${this.invoice.invoiceNumber || this.invoice.billNumber || 'details'}.json`;
      a.click(); URL.revokeObjectURL(url);
      this.$emit('copied');
    }
  }
}
</script>

<style scoped>
/* Card & toolbar styling */
.details-card {
  border: 1px solid #eef1f5;
  box-shadow: 0 12px 28px rgba(16,24,40,.08);
  background: linear-gradient(180deg, #ffffff, #fafbff);
}
.details-toolbar {
  background: rgba(255,255,255,0.7) !important;
  backdrop-filter: blur(6px);
  border-bottom: 1px solid #eef1f5;
}
.soft-avatar {
  background: #eef4ff !important;
  color: #324155 !important;
  border-radius: 12px;
}
.section-card {
  border: 1px solid #eef1f5;
  border-radius: 16px;
  padding: 14px 16px;
  background: #fff;
}
.section-title {
  font-weight: 700; letter-spacing: .02em; font-size: 13px;
  color: #475569; display: flex; align-items: center; margin-bottom: 10px;
}
.section-grid {
  display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); grid-gap: 10px 16px;
}
.section-grid .item .label { font-size: 11px; color: #64748b; }
.section-grid .item .value { font-size: 13px; color: #0f172a; }
.section-grid .item.col-span-2 { grid-column: span 2 / span 2; }

.summary-card {
  border: 1px dashed #e5e7eb; border-radius: 14px; padding: 12px 14px; background: #fff;
}
.summary-title { font-size: 11px; color: #64748b; letter-spacing: .02em; }
.summary-value { font-size: 16px; font-weight: 700; margin-top: 2px; }
.summary-sub { font-size: 12px; color: #475569; margin-top: 4px; }

.payments-table thead th {
  font-size: 11px; color: #64748b; background: #f8f9fc;
}
.payments-table tbody td { font-size: 12px; }

.soft-chip { background: #eef4ff !important; color: #334155 !important; }
.soft-alert { background: #f8fafc !important; border-color: #c7d2fe !important; }
.mono { font-family: ui-monospace, Menlo, Monaco, Consolas, "Liberation Mono", monospace; }

/* Action button styles to match your table buttons */
.btn-primary { background:#2563eb !important; color:#fff !important; }
.btn-outline { background:transparent; border:1px solid #e2e8f0; }

/* Status colors */
.status-chip { font-weight: 600; }
.status-created   { background:#fff7ed !important; color:#9a3412 !important; }
.status-paid      { background:#ecfdf5 !important; color:#065f46 !important; }
.status-pending   { background:#fef9c3 !important; color:#92400e !important; }
.status-delivered { background:#eef2ff !important; color:#3730a3 !important; }
.status-cancelled { background:#fee2e2 !important; color:#991b1b !important; }

/* Tailwind-like utility (used via class attr) — safe with Vuetify */
.grid { display: grid; }
.gap-4 { grid-gap: 1rem; }
.gap-6 { grid-gap: 1.5rem; }
.md\:grid-cols-2 { grid-template-columns: 1fr; }
.md\:grid-cols-3 { grid-template-columns: 1fr; }
@media (min-width: 960px) {
  .md\:grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .md\:grid-cols-3 { grid-template-columns: repeat(3, minmax(0, 1fr)); }
}
.items-center { align-items:center; }
.flex { display:flex; }
.mr-1 { margin-right: .25rem; }
.mr-3 { margin-right: .75rem; }
.mr-6 { margin-right: 1.5rem; }
.ml-2 { margin-left: .5rem; }
.hidden-sm-and-down { display:none; }
@media (min-width: 600px){ .hidden-sm-and-down{ display:block; } }
.text-right { text-align:right; }
.text-sm { font-size: .875rem; }
.text-lg { font-size: 1.125rem; }
.text-slate-500 { color:#64748b; }
.font-medium { font-weight:500; }
.font-semibold { font-weight:600; }
.font-bold { font-weight:700; }
.leading-tight { line-height:1.2; }
.rounded-xl { border-radius: 20px; }
</style>
