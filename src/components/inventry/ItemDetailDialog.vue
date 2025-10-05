<template>
  <v-dialog persistent v-model="open" max-width="920px" transition="dialog-bottom-transition">
    <v-card class="fancy-card">
      <!-- Header -->
      <div class="header-wrap">
        <div class="header-left">
          <v-avatar size="64" class="avatar" tile>
            <span class="avatar-text">{{ avatarText }}</span>
          </v-avatar>

          <div class="header-meta">
            <div class="invoice-title">
              Invoice
              <span class="invoice-number">{{ item?.invoiceNumber || '-' }}</span>
            </div>

            <div class="subtitle-row">
              <div class="model-name">{{ item?.modelName || '—' }}</div>
              <div class="dot-sep">•</div>
              <div class="small-muted">{{ item?.categoryName || 'Unknown category' }}</div>
            </div>

            <div class="header-stats">
              <v-chip class="status-chip" :color="statusColor" text-color="white" small>
                <v-icon left small>mdi-information-outline</v-icon>{{ item?.status || 'UNKNOWN' }}
              </v-chip>

              <v-tooltip top>
                <template #activator="{ on, attrs }">
                  <v-btn v-bind="attrs" v-on="on" icon small @click="copyInvoice" class="copy-btn" :title="'Copy invoice'">
                    <v-icon small>mdi-content-copy</v-icon>
                  </v-btn>
                </template>
                <span>Copy invoice number</span>
              </v-tooltip>
            </div>
          </div>
        </div>

        <div class="header-right">
          <div class="kpi-row">
            <div class="kpi">
              <div class="kpi-label">Invoice Date</div>
              <div class="kpi-value">{{ item?.invoiceDate }}</div>
            </div>

            <div class="kpi">
              <div class="kpi-label">Warehouse</div>
              <div class="kpi-value">{{ item?.warehouse || '-' }}</div>
            </div>

            <div class="kpi">
              <div class="kpi-label">Added By</div>
              <div class="kpi-value small-muted">{{ item?.addedBy || '-' }}</div>
            </div>
          </div>

          <div class="header-actions">
            <v-btn icon small @click="$emit('close')"><v-icon>mdi-close</v-icon></v-btn>
          </div>
        </div>
      </div>

      <v-divider></v-divider>

      <!-- Content -->
      <v-card-text class="content-area">
        <v-row>
          <!-- Left: Details card -->
          <v-col cols="12" md="7">
            <v-card flat class="detail-panel pa-4">
              <v-row>
                <v-col cols="12" class="mb-2">
                  <div class="field-label">Chassis Number</div>
                  <div class="field-value">{{ item?.chassisNumber || '-' }}</div>
                </v-col>

                <v-col cols="12" class="mb-2">
                  <div class="field-label">Engine Number</div>
                  <div class="field-value">{{ item?.engineNumber || '-' }}</div>
                </v-col>

                <v-col cols="12" class="mb-2">
                  <div class="two-col">
                    <div>
                      <div class="field-label">Model</div>
                      <div class="field-value">{{ item?.modelName || '-' }}</div>
                    </div>
                  </div>
                </v-col>
                <v-col cols="12" class="mb-2">
                    <div>
                      <div class="field-label">Color</div>
                      <div class="field-value">
                        <v-chip small outlined>{{ item?.color || '-' }}</v-chip>
                      </div>
                    </div>
                </v-col>

                <v-col cols="12" class="mb-2">
                  <div class="field-label">Status</div>
                  <div class="field-value">{{ item?.status || '-' }}</div>
                </v-col>

                <v-col cols="12" class="mt-1">
                    <div class="kpi-grid">
                        <!-- Added Date -->
                        <v-hover v-slot="{ hover }">
                        <div class="kpi-card" :class="{ 'kpi-hover': hover }" v-tooltip.bottom="addedDateTooltip">
                            <div class="kpi-left">
                            <div class="kpi-icon-wrap"><v-icon large>mdi-calendar-plus</v-icon></div>
                            </div>
                            <div class="kpi-right">
                            <div class="kpi-label">Added</div>
                            <div class="kpi-value">{{ formatDate(item?.createdAt) }}</div>
                            </div>
                        </div>
                        </v-hover>

                        <!-- Last Modified -->
                        <v-hover v-slot="{ hover }">
                        <div class="kpi-card" :class="{ 'kpi-hover': hover }" v-tooltip.bottom="lastModifiedTooltip">
                            <div class="kpi-left">
                            <div class="kpi-icon-wrap"><v-icon large>mdi-calendar-edit</v-icon></div>
                            </div>
                            <div class="kpi-right">
                            <div class="kpi-label">Last Modified</div>
                            <div class="kpi-value">{{ formatDate(item?.lastModified || item?.updatedAt) }}</div>
                            </div>
                        </div>
                        </v-hover>

                        <!-- Hold Days -->
                        <v-hover v-slot="{ hover }">
                        <div class="kpi-card" :class="{ 'kpi-hover': hover }" v-tooltip.bottom="'Days since added'">
                            <div class="kpi-left">
                            <div class="kpi-icon-wrap"><v-icon large>mdi-timer-sand</v-icon></div>
                            </div>
                            <div class="kpi-right">
                            <div class="kpi-label">Hold Days</div>
                            <div class="kpi-value">{{ item?.inventoryHoldDays ?? '-' }}</div>
                            </div>
                        </div>
                        </v-hover>
                    </div>
                </v-col>

              </v-row>
            </v-card>
          </v-col>

          <!-- Right: Documents & actions -->
          <v-col cols="12" md="5">
            <v-card flat class="meta-panel pa-4">
              <div class="panel-title">Documents</div>

              <div v-if="hasDocuments" class="docs-grid">
                <v-row dense>
                  <v-col cols="12" v-for="(doc, i) in item.documents" :key="i">
                    <v-hover v-slot="{ hover }">
                      <v-card :elevation="hover ? 6 : 1" class="doc-card" @click="$emit('open-document', doc)" role="button">
                        <v-row no-gutters align="center">
                          <v-col cols="auto" class="px-3">
                            <div class="thumb-wrap">
                              <v-img v-if="doc.url" :src="doc.url" class="doc-thumb" contain />
                              <div v-else class="thumb-fallback">
                                <v-icon large>mdi-file-document-outline</v-icon>
                              </div>
                            </div>
                          </v-col>

                          <v-col class="pl-3">
                            <div class="doc-title">{{ doc.name || ('Document ' + (i + 1)) }}</div>
                            <div class="doc-sub small-muted">{{ doc.type || '' }}</div>
                          </v-col>

                          <v-col cols="auto" class="pr-3">
                            <v-btn icon small @click.stop="$emit('open-document', doc)" :title="'Open ' + (doc.name || 'document')">
                              <v-icon>mdi-open-in-new</v-icon>
                            </v-btn>
                          </v-col>
                        </v-row>
                      </v-card>
                    </v-hover>
                  </v-col>
                </v-row>
              </div>

              <div v-else class="no-docs small-muted">No documents uploaded</div>

              <v-divider class="my-3"></v-divider>

              <div class="quick-actions">
                <v-btn block color="primary" @click="$emit('edit')">
                  <v-icon left small>mdi-pencil</v-icon>Edit Item
                </v-btn>

                <v-btn block outlined class="mt-2" @click="downloadSummary">
                  <v-icon left small>mdi-download</v-icon> Download Summary
                </v-btn>
              </div>
            </v-card>
          </v-col>
        </v-row>

        <!-- small timeline / notes -->
        <v-row class="mt-4">
          <v-col cols="12">
            <v-card flat class="notes-card pa-3">
              <div class="notes-title">Notes & Remarks</div>
              <div v-if="item?.notes" class="notes-body">{{ item.notes }}</div>
              <div v-else class="small-muted">No remarks available</div>
            </v-card>
          </v-col>
        </v-row>
      </v-card-text>

      <!-- Footer -->
      <v-divider></v-divider>
    </v-card>
  </v-dialog>
</template>

<script>
export default {
  name: 'ItemDetailDialog',
  props: {
    open: { type: Boolean, default: false },
    item: { type: Object, default: null }
  },
  computed: {
    avatarText() {
      const name = this.item?.modelName || this.item?.categoryName || this.item?.chassisNumber || '';
      return name ? String(name).trim().charAt(0).toUpperCase() : 'I';
    },
    statusColor() {
      const s = (this.item?.status || '').toString().toUpperCase();
      if (s === 'ACTIVE') return 'green darken-1';
      if (s === 'DRAFT') return 'orange darken-1';
      if (s === 'SOLD') return 'red darken-1';
      return 'grey darken-1';
    },
    hasDocuments() {
      return Array.isArray(this.item?.documents) && this.item.documents.length > 0;
    }
  },
  methods: {
    // convert seconds or ms to ms
    _toMs(v) {
      if (v == null) return null;
      const n = Number(v);
      if (Number.isNaN(n)) return null;
      return n < 1e12 ? n * 1000 : n;
    },
    // dd/mm/yyyy
    formatDate(v) {
      if (!v) return '-';
      const ms = this._toMs(v);
      if (ms == null) return '-';
      const d = new Date(ms);
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();
      return `${day}/${month}/${year}`;
    },
    copyInvoice() {
      const val = this.item?.invoiceNumber || '';
      if (!val) return;
      try {
        navigator.clipboard.writeText(val);
        this.$root?.$emit?.('show-snackbar', { text: 'Invoice copied', color: 'success' });
      } catch {
        // fallback
        const ta = document.createElement('textarea');
        ta.value = val;
        document.body.appendChild(ta);
        ta.select();
        try { document.execCommand('copy'); } catch (_) {}
        document.body.removeChild(ta);
        this.$root?.$emit?.('show-snackbar', { text: 'Invoice copied', color: 'success' });
      }
    },
    downloadSummary() {
      // simple client-side CSV summary download (demo)
      const row = this.item || {};
      const cols = [
        ['Invoice Number', row.invoiceNumber || ''],
        ['Chassis Number', row.chassisNumber || ''],
        ['Engine Number', row.engineNumber || ''],
        ['Model', row.modelName || ''],
        ['Color', row.color || ''],
        ['Warehouse', row.warehouse || ''],
        ['Status', row.status || '']
      ];
      const csv = cols.map(c => `"${c[0]}","${(c[1] || '').toString().replace(/"/g, '""')}"`).join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${row.invoiceNumber || 'item'}_summary.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    }
  }
};
</script>

<style scoped>
.fancy-card {
  border-radius: 12px;
  overflow: hidden;
  background: linear-gradient(180deg, #ffffff 0%, #fbfcff 100%);
  box-shadow: 0 10px 30px rgba(14, 38, 63, 0.08);
}

/* Header */
.header-wrap {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 10px 20px;
}
.header-left {
  display: flex;
  gap: 14px;
  align-items: center;
  flex: 1 1 0;
}
.avatar {
  background: linear-gradient(135deg, #040891, #4fc3f7);
  color: white;
  border-radius: 10px;
  box-shadow: 0 6px 18px rgba(25, 118, 210, 0.16);
}
.avatar-text {
  font-weight: 700;
  font-size: 20px;
}
.header-meta { min-width: 260px; }
.invoice-title {
  font-size: 16px;
  color: #0f1724;
  font-weight: 600;
}
.invoice-number {
  color: #040891;
  margin-left: 8px;
  font-weight: 700;
}
.subtitle-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 6px;
}
.model-name { font-weight: 600; color: #374151; }
.small-muted { color: #6b7280; font-size: 13px; }

/* Header right KPIs */
.header-right { display:flex; flex-direction:column; align-items:flex-end; gap:8px; min-width: 320px; }
.kpi-row { display:flex; gap:10px; align-items:center; }
.kpi { text-align:right; min-width:100px; }
.kpi-label { font-size: 11px; color: #6b7280; }
.kpi-value { font-weight:700; color:#111827; }

/* chips & actions */
.status-chip { font-weight:600; }
.header-actions { display:flex; gap:6px; align-items:center; margin-top:6px; }
.copy-btn { color: #6b7280; }

/* Content area */
.content-area { padding-top: 8px; }
.detail-panel {
  border-radius: 10px;
  background: linear-gradient(180deg, #fff, #fbfbff);
  box-shadow: 0 4px 14px rgba(15, 23, 42, 0.04);
}
.meta-panel {
  border-radius: 10px;
  background: #fff;
  box-shadow: 0 4px 14px rgba(15, 23, 42, 0.04);
}
.field-label { font-size:12px; color:#6b7280; margin-bottom:4px; }
.field-value { font-weight:700; color:#0f1724; font-size:15px; }

/* two-col layout inside details */
.two-col { display:flex; gap:12px; justify-content:space-between; align-items:center; }

/* meta / docs */
.panel-title { font-weight:700; margin-bottom:8px; color:#111827; }
.docs-grid { max-height:320px; overflow:auto; padding-right:4px; }
.doc-card { border-radius:8px; cursor:pointer; transition:transform .15s ease; display:flex; align-items:center; }
.doc-card:hover { transform: translateY(-4px); }
.thumb-wrap { width:56px; height:56px; display:inline-flex; align-items:center; justify-content:center; border-radius:6px; background:#f7fafc; }
.doc-thumb { width:56px; height:56px; object-fit:cover; border-radius:6px; }
.thumb-fallback { width:56px; height:56px; display:flex; align-items:center; justify-content:center; color:#6b7280; }

/* doc text */
.doc-title { font-weight:600; color:#111827; }
.doc-sub { font-size:12px; color:#6b7280; }

/* quick actions */
.quick-actions { margin-top:12px; }

/* notes card */
.notes-card { border-radius:8px; background:#fff; box-shadow: 0 4px 10px rgba(2,6,23,0.03); }
.notes-title { font-weight:700; margin-bottom:8px; }
.notes-body { color:#374151; }

/* footer */
.footer-row { padding:12px 20px; }

/* responsive tweaks */
@media (max-width: 960px) {
  .header-right { min-width: unset; align-items:flex-start; }
  .header-wrap { flex-direction:column; align-items:flex-start; gap:12px; }
  .kpi-row { flex-wrap:wrap; }
  .kpi { text-align:left; }
  .avatar { margin-bottom:4px; }
  .header-left { width:100%; }
}
</style>
