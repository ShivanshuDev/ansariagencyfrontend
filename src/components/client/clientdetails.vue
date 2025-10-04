<template>
  <div class="client-detail">
    <v-card class="pa-4 elevation-3">
      <!-- Header -->
      <v-row align="center" no-gutters>
        <v-col cols="auto">
          <v-avatar size="72" class="elevation-2" color="primary">
            <span class="avatar-initial">{{ avatarInitial }}</span>
          </v-avatar>
        </v-col>

        <v-col>
          <div class="title-row">
            <div>
              <div class="client-name">{{ client?.name || '—' }}</div>
              <div class="client-meta">
                <span class="muted">{{ client?.clientId ? `Client ID: ${client.clientId}` : '' }}</span>
                <v-chip v-if="client?.status" small class="ml-2" :color="statusColor(client.status)" text-color="white">
                  {{ client.status }}
                </v-chip>
              </div>
            </div>
          </div>
        </v-col>

        <v-col cols="auto" class="actions-col">
          <v-btn icon @click="refresh" :title="'Refresh'">
            <v-icon>mdi-refresh</v-icon>
          </v-btn>
          <v-btn icon @click="onEdit" :title="'Edit client'">
            <v-icon>mdi-pencil</v-icon>
          </v-btn>
          <!-- <v-btn icon @click="downloadJSON" :title="'Export JSON'">
            <v-icon>mdi-download</v-icon>
          </v-btn> -->
        </v-col>
      </v-row>

      <v-divider class="my-4"></v-divider>

      <v-row>
        <!-- Left summary -->
        <v-col cols="12" md="4">
          <v-sheet class="summary-sheet pa-4">
            <div v-if="loading">
              <v-skeleton-loader type="list-item-avatar-two-line"></v-skeleton-loader>
              <v-skeleton-loader type="paragraph"></v-skeleton-loader>
            </div>

            <div v-else-if="error">
              <v-alert dense type="error" border="left" colored-border>
                <div><strong>Failed to load client</strong></div>
                <div class="muted" v-if="errorMessage">{{ errorMessage }}</div>
                <v-btn small text color="white" class="mt-2" @click="refresh">Retry</v-btn>
              </v-alert>
            </div>

            <div v-else>
              <v-list dense two-line>
                <v-list-item>
                  <v-list-item-content>
                    <v-list-item-title class="field-label">Email</v-list-item-title>
                    <v-list-item-subtitle class="field-value">{{ client?.email || '—' }}</v-list-item-subtitle>
                  </v-list-item-content>
                  <v-list-item-action>
                    <v-btn icon @click="copyToClipboard(client?.email, 'Email copied')"><v-icon small>mdi-content-copy</v-icon></v-btn>
                  </v-list-item-action>
                </v-list-item>

                <v-list-item>
                  <v-list-item-content>
                    <v-list-item-title class="field-label">Phone</v-list-item-title>
                    <v-list-item-subtitle class="field-value">{{ client?.phone || '—' }}</v-list-item-subtitle>
                  </v-list-item-content>
                  <v-list-item-action>
                    <v-btn icon @click="copyToClipboard(client?.phone, 'Phone copied')"><v-icon small>mdi-content-copy</v-icon></v-btn>
                  </v-list-item-action>
                </v-list-item>

                <v-list-item>
                  <v-list-item-content>
                    <v-list-item-title class="field-label">GSTIN</v-list-item-title>
                    <v-list-item-subtitle class="field-value">{{ client?.gstin || '—' }}</v-list-item-subtitle>
                  </v-list-item-content>
                </v-list-item>

                <v-list-item>
                  <v-list-item-content>
                    <v-list-item-title class="field-label">Created</v-list-item-title>
                    <v-list-item-subtitle class="field-value">{{ formatTs(client?.createdAt) }}</v-list-item-subtitle>
                  </v-list-item-content>
                </v-list-item>

                <v-list-item>
                  <v-list-item-content>
                    <v-list-item-title class="field-label">Updated</v-list-item-title>
                    <v-list-item-subtitle class="field-value">{{ formatTs(client?.updatedAt) }}</v-list-item-subtitle>
                  </v-list-item-content>
                </v-list-item>
              </v-list>
            </div>
          </v-sheet>
        </v-col>

        <!-- Right details: tabs -->
        <v-col cols="12" md="8">
          <v-sheet class="details-sheet pa-4">
            <v-tabs v-model="tab" background-color="transparent" grow>
              <v-tab key="addresses">Addresses</v-tab>
              <v-tab key="bank">Bank</v-tab>
            </v-tabs>

            <v-divider class="my-3"></v-divider>

            <v-tabs-items v-model="tab">
              <v-tab-item key="addresses">
                <v-row>
                  <v-col cols="12" md="6">
                    <div class="section-title">Billing</div>
                    <v-card flat class="pa-3">
                      <div class="line"><span class="label">Name:</span> <span class="value">{{ client?.billing?.name || '-' }}</span></div>
                      <div class="line"><span class="label">Address:</span> <span class="value">{{ fullAddress(client?.billing) || '-' }}</span></div>
                      <div class="line"><span class="label">Tahsil:</span> <span class="value">{{ client?.billing?.tahsil || '-' }}</span></div>
                      <div class="line"><span class="label">City / State / PIN:</span> <span class="value">{{ client?.billing?.city || '-' }} / {{ client?.billing?.state || '-' }} / {{ client?.billing?.pincode || '-' }}</span></div>
                      <v-btn small text @click="copyAddress(client?.billing)">Copy</v-btn>
                    </v-card>
                  </v-col>

                  <v-col cols="12" md="6">
                    <div class="section-title">Shipping</div>
                    <v-card flat class="pa-3">
                      <div class="line"><span class="label">Name:</span> <span class="value">{{ client?.shipping?.name || '-' }}</span></div>
                      <div class="line"><span class="label">Address:</span> <span class="value">{{ fullAddress(client?.shipping) || '-' }}</span></div>
                      <div class="line"><span class="label">Tahsil:</span> <span class="value">{{ client?.shipping?.tahsil || '-' }}</span></div>
                      <div class="line"><span class="label">City / State / PIN:</span> <span class="value">{{ client?.shipping?.city || '-' }} / {{ client?.shipping?.state || '-' }} / {{ client?.shipping?.pincode || '-' }}</span></div>
                      <v-btn small text @click="copyAddress(client?.shipping)">Copy</v-btn>
                    </v-card>
                  </v-col>
                </v-row>
              </v-tab-item>

              <v-tab-item key="bank">
                <div class="section-title">Banking Details</div>
                <v-card flat class="pa-3">
                  <v-row>
                    <v-col cols="12" sm="6"><strong>Account Holder:</strong> {{ client?.bank?.accountHolder || '-' }}</v-col>
                    <v-col cols="12" sm="6"><strong>Bank:</strong> {{ client?.bank?.bankName || '-' }}</v-col>
                    <v-col cols="12" sm="6"><strong>Account Number:</strong> {{ maskedAccount(client?.bank?.accountNumber) }}</v-col>
                    <v-col cols="12" sm="6"><strong>IFSC:</strong> {{ client?.bank?.ifsc || '-' }}</v-col>
                    <v-col cols="12" sm="6"><strong>Branch:</strong> {{ client?.bank?.branch || '-' }}</v-col>
                  </v-row>
                  <div class="mt-3">
                    <v-btn small text @click="copyToClipboard(client?.bank?.accountNumber, 'Account number copied')">Copy Account</v-btn>
                    <pre v-if="showRawBank" class="raw-pre">{{ client?.bank ? JSON.stringify(client.bank, null, 2) : '{}' }}</pre>
                  </div>
                </v-card>
              </v-tab-item>

              <v-tab-item key="raw">
                <div class="section-title">Raw JSON</div>
                <v-card flat class="pa-3">
                  <pre class="raw-pre">{{ prettyClient }}</pre>
                </v-card>
              </v-tab-item>
            </v-tabs-items>
          </v-sheet>
        </v-col>
      </v-row>
    </v-card>

    <!-- Snackbar -->
    <v-snackbar v-model="snackbar.visible" top right :timeout="snackbar.timeout" :color="snackbar.color">
      <v-icon left small>{{ snackbar.icon }}</v-icon>
      <span>{{ snackbar.message }}</span>
      <template v-slot:action>
        <v-btn text @click="snackbar.visible = false">Close</v-btn>
      </template>
    </v-snackbar>
  </div>
</template>

<script>
import axios from "axios";

export default {
  name: "ClientDetail",
  props: { pk: { type: String, required: false } },
  data() {
    return {
      client: null,
      loading: false,
      error: null,
      tab: null,
      showRawBank: false,
      snackbar: { visible: false, message: "", color: "success", icon: "mdi-check", timeout: 3000 }
    };
  },
  computed: {
    prettyClient() {
      try {
        return JSON.stringify(this.client, null, 2);
      } catch (e) {
        return String(this.client);
      }
    },
    errorMessage() {
      if (!this.error) return null;
      if (this.error.response && this.error.response.data) {
        return this.error.response.data.message || JSON.stringify(this.error.response.data);
      }
      return this.error.message || String(this.error);
    },
    avatarInitial() {
      const name = (this.client && this.client.name) || (this.client && this.client.clientId) || "";
      return (name && name[0]?.toUpperCase()) || "?";
    }
  },
  methods: {
    statusColor(status) {
      if (!status) return "grey";
      const s = status.toString().toLowerCase();
      if (s.includes("active") || s.includes("available")) return "green";
      if (s.includes("inactive") || s.includes("disabled") || s.includes("blocked")) return "grey";
      if (s.includes("pending")) return "orange";
      if (s.includes("suspended") || s.includes("hold")) return "red";
      return "blue";
    },

    formatTs(ts) {
      if (!ts) return "-";
      const n = Number(ts);
      if (!Number.isFinite(n)) return String(ts);
      try {
        const d = new Date(n);
        return d.toLocaleString();
      } catch (e) {
        return String(ts);
      }
    },

    fullAddress(obj) {
      if (!obj) return "";
      const parts = [obj.line1, obj.line2].filter(Boolean);
      return parts.join(", ");
    },

    maskedAccount(acc) {
      if (!acc) return "-";
      const s = String(acc);
      if (s.length <= 4) return s;
      return "••••••" + s.slice(-4);
    },

    async loadClient(pk) {
      if (!pk) return;
      this.loading = true;
      this.error = null;
      this.client = null;
      try {
        const decodedPk = decodeURIComponent(pk);
        // your backend may expect only id after '#', or full pk. adapt as needed:
        const pkToUse = decodedPk.includes("#") ? decodedPk.split("#")[1] : decodedPk;
        const url = (process.env.VUE_APP_AGENCY_BACKEND_URL || "") + `getClientByPk/${encodeURIComponent(pkToUse)}`;
        const res = await axios.get(url, { timeout: 10000 });
        const item = res?.data?.item ?? res?.data ?? null;
        this.client = item;
        this.tab = "addresses";
        this.snackbar.visible = false;
      } catch (err) {
        console.error("Failed to fetch client details:", err);
        this.client = null;
        this.error = err;
        this.showSnack(err?.response?.data?.message || "Failed to load client", "error", "mdi-alert");
      } finally {
        this.loading = false;
      }
    },

    refresh() {
      if (this.pk) this.loadClient(this.pk);
      else this.showSnack("No client selected", "error", "mdi-alert");
    },

    onEdit() {
      // emit event to parent to open edit screen/dialog
      this.$emit("edit", this.client);
    },

    copyToClipboard(value, successMessage = "Copied") {
      if (!value) {
        this.showSnack("Nothing to copy", "error", "mdi-alert");
        return;
      }
      try {
        navigator.clipboard?.writeText(String(value));
        this.showSnack(successMessage, "success", "mdi-check");
      } catch (e) {
        // fallback: create temporary input
        const ta = document.createElement("textarea");
        ta.value = String(value);
        document.body.appendChild(ta);
        ta.select();
        try {
          document.execCommand("copy");
          this.showSnack(successMessage, "success", "mdi-check");
        } catch {
          this.showSnack("Copy failed", "error", "mdi-alert");
        } finally {
          document.body.removeChild(ta);
        }
      }
    },

    copyAddress(addr) {
      if (!addr) { this.showSnack("No address to copy", "error", "mdi-alert"); return; }
      const text = [
        addr.name,
        addr.line1,
        addr.line2,
        addr.tahsil,
        addr.city,
        addr.state,
        addr.pincode,
        addr.country
      ].filter(Boolean).join(", ");
      this.copyToClipboard(text, "Address copied");
    },

    downloadJSON() {
      if (!this.client) { this.showSnack("No client data", "error", "mdi-alert"); return; }
      const blob = new Blob([JSON.stringify(this.client, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${(this.client.clientId || this.client.name || "client")}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      this.showSnack("Exported JSON", "success", "mdi-download");
    },

    showSnack(message, color = "success", icon = "mdi-check") {
      this.snackbar.message = message;
      this.snackbar.color = color === "error" ? "red darken-2" : color;
      this.snackbar.icon = icon;
      this.snackbar.visible = true;
    }
  },
  mounted() {
    this.loadClient(this.pk);
  },
  watch: {
    pk(newPk, oldPk) {
      if (newPk && newPk !== oldPk) this.loadClient(newPk);
    }
  }
};
</script>

<style scoped>
.client-detail { margin: 18px; }

/* Header */
.title-row { display:flex; align-items:center; gap:12px; }
.avatar-initial { font-weight:700; color:white; font-size:22px; }
.client-name { font-size:20px; font-weight:700; }
.client-meta { font-size:13px; color:var(--v-theme-on-surface, #666); margin-top:4px; }
.actions-col { display:flex; gap:6px; align-items:center; }

/* Summary and details */
.summary-sheet { background: linear-gradient(180deg,#ffffff,#fbfbfd); border-radius:8px; min-height:220px; }
.details-sheet { background: #fff; border-radius:8px; min-height:220px; }

.field-label { font-weight:600; font-size:13px; color:#333; }
.field-value { font-weight:500; color:#444; margin-top:4px; display:block; }

.section-title { font-weight:700; margin-bottom:8px; font-size:16px; }
.line { margin-bottom:8px; }
.line .label { color:#666; font-weight:600; margin-right:6px; width:140px; display:inline-block; }
.line .value { color:#222; display:inline-block; }

.raw-pre { background:#0f1724; color:#e6eef8; padding:12px; border-radius:6px; overflow:auto; max-height:300px; }

/* responsive */
@media (max-width: 960px) {
  .actions-col { margin-top:8px; }
  .client-name { font-size:18px; }
}
</style>
