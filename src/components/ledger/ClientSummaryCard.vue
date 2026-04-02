<template>
  <v-card flat class="client-summary-card pa-3">
    <v-row no-gutters class="align-center">
      <!-- Left: vendor basic info -->
      <v-col cols="12" sm="6" md="5">
        <div class="d-flex align-center">
          <div>
            <div class="vendor-name">{{ vendorName }}</div>
            <div class="text-caption">ID: {{ vendorId || '—' }}</div>
            <div class="text-caption mt-1" v-if="periodText">
              <small>Period: {{ periodText }}</small>
            </div>
          </div>
          <v-spacer />
          <v-avatar size="44" class="ml-3" v-if="statusBadge">
            <v-icon small>{{ statusIcon }}</v-icon>
          </v-avatar>
        </div>
      </v-col>

      <!-- Middle: Key numbers -->
      <v-col cols="12" sm="6" md="4">
        <v-row no-gutters>
          <v-col cols="4" class="pa-1">
            <div class="stat-label">Closing</div>
            <div class="stat-value">₹ {{ formatNumber(closingBalance) }}</div>
          </v-col>

          <v-col cols="4" class="pa-1">
            <div class="stat-label">Debit</div>
            <div class="stat-value red--text">₹ {{ formatNumber(totalDebit) }}</div>
          </v-col>

          <v-col cols="4" class="pa-1">
            <div class="stat-label">Credit</div>
            <div class="stat-value green--text">₹ {{ formatNumber(totalCredit) }}</div>
          </v-col>
        </v-row>

        <div class="mt-2 text-caption">
          Txns: <strong>{{ txnCount }}</strong>
          <span v-if="lastTransaction"> • Last: {{ lastTransaction }}</span>
        </div>
      </v-col>

      <!-- Right: Actions -->
      <v-col cols="12" sm="12" md="3" class="d-flex justify-end">
        <div class="actions">
          <v-btn small outlined class="mb-2" @click="$emit('download-pdf')">
            <v-icon left small>mdi-file-pdf-box</v-icon>Export PDF
          </v-btn>
          <v-btn small outlined class="mb-2 ml-2" @click="$emit('download-excel')">
            <v-icon left small>mdi-file-excel-box</v-icon>Export XLSX
          </v-btn>

          <div class="d-flex mt-2">
            <v-btn small color="primary" class="mr-2" @click="$emit('deposit')">
              <v-icon left small>mdi-bank-transfer</v-icon>Deposit
            </v-btn>
            <v-btn small color="secondary" @click="$emit('open-account')">
              <v-icon left small>mdi-account-plus</v-icon>Open Account
            </v-btn>
          </div>

          <v-btn text small class="mt-1" @click="$emit('view-details')">
            View full details
          </v-btn>
        </div>
      </v-col>
    </v-row>

    <!-- Optional small expandable details -->
    <v-expand-transition>
      <div v-if="showDetails" class="mt-3">
        <v-row dense>
          <v-col cols="12" sm="4">
            <div class="detail-label">Phone</div>
            <div class="detail-value">{{ vendorPhone || '—' }}</div>
          </v-col>
          <v-col cols="12" sm="4">
            <div class="detail-label">Email</div>
            <div class="detail-value">{{ vendorEmail || '—' }}</div>
          </v-col>
          <v-col cols="12" sm="4">
            <div class="detail-label">Account Balance</div>
            <div class="detail-value">₹ {{ formatNumber(accountBalanceFallback) }}</div>
          </v-col>
        </v-row>
      </div>
    </v-expand-transition>
  </v-card>
</template>

<script>
export default {
  name: "ClientSummary",
  props: {
    vendor: { type: Object, default: () => ({}) },
    account: { type: Object, default: () => ({}) },
    ledgerRows: { type: Array, default: () => [] },
    dateFrom: { type: String, default: "" },
    dateTo: { type: String, default: "" },
    // small toggle if you want the extra details visible by default
    showDetails: { type: Boolean, default: false }
  },
  computed: {
    vendorName() {
      return this.vendor?.name || this.vendor?.clientName || "—";
    },
    vendorId() {
      return this.vendor?.vendorId || (this.vendor?.pk ? String(this.vendor.pk).split("#")[1] : "") || "";
    },
    vendorPhone() {
      return this.vendor?.phone || this.vendor?.altphone || "";
    },
    vendorEmail() {
      return this.vendor?.email || "";
    },
    accountBalanceFallback() {
      // prefer account.balance if ledger empty
      if (this.ledgerRows && this.ledgerRows.length) {
        return this.closingBalance;
      }
      return this.account?.balance != null ? this.account.balance : 0;
    },
    closingBalance() {
      const rows = this.ledgerRows || [];
      if (!rows.length) return this.account?.balance != null ? this.account.balance : 0;
      return rows[rows.length - 1].runningBalance || 0;
    },
    totalDebit() {
      return (this.ledgerRows || []).reduce((s, r) => s + (r.debit || 0), 0);
    },
    totalCredit() {
      return (this.ledgerRows || []).reduce((s, r) => s + (r.credit || 0), 0);
    },
    txnCount() {
      return (this.ledgerRows || []).length;
    },
    lastTransaction() {
      if (!(this.ledgerRows || []).length) return null;
      const r = this.ledgerRows[this.ledgerRows.length - 1];
      return `${r.date || ""} ${r.time || ""}`.trim();
    },
    statusBadge() {
      // example simple status: active / closed / frozen (customise)
      return this.vendor?.status || null;
    },
    statusIcon() {
      if (this.statusBadge === "frozen") return "mdi-lock";
      if (this.statusBadge === "closed") return "mdi-account-off";
      return "mdi-account-circle";
    },
    periodText() {
      if (this.dateFrom || this.dateTo) {
        return `${this.dateFrom || "-"} → ${this.dateTo || "-"}`;
      }
      return "";
    }
  },
  methods: {
    formatNumber(val) {
      const n = Number(val || 0);
      return new Intl.NumberFormat("en-IN").format(Math.round((n + Number.EPSILON) * 100) / 100);
    }
  }
};
</script>

<style scoped>
.client-summary-card {
  border-radius: 8px;
  background: linear-gradient(90deg, rgba(255,255,255,1), rgba(250,250,250,1));
  box-shadow: none;
  border: 1px solid rgba(0,0,0,0.04);
}

.vendor-name {
  font-weight: 600;
  font-size: 1.05rem;
}

.stat-label {
  font-size: 0.75rem;
  color: rgba(0,0,0,0.6);
}

.stat-value {
  font-size: 1rem;
  font-weight: 600;
}

.detail-label {
  font-size: 0.75rem;
  color: rgba(0,0,0,0.6);
}
.detail-value {
  font-weight: 500;
}
.actions .v-btn {
  min-width: 120px;
}
</style>
