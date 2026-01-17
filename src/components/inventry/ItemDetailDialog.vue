<template>
  <v-dialog persistent v-model="open" max-width="920px" transition="dialog-bottom-transition">
    <v-card class="fancy-card">

      <!-- ================= HEADER ================= -->
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
                <v-icon left small>mdi-information-outline</v-icon>
                {{ item?.status || 'UNKNOWN' }}
              </v-chip>

              <v-tooltip top>
                <template #activator="{ on, attrs }">
                  <v-btn
                    v-bind="attrs"
                    v-on="on"
                    icon
                    small
                    @click="copyInvoice"
                    class="copy-btn"
                  >
                    <v-icon small>mdi-content-copy</v-icon>
                  </v-btn>
                </template>
                <span>Copy invoice number</span>
              </v-tooltip>
            </div>
          </div>
        </div>

        <div class="header-right">
          <InventoryHistoryDialog
            :invoiceNumber="item?.invoiceNumber"
            :chassisNumber="item?.chassisNumber"
            :baseUrl="base"
          />

          <div class="kpi-row">
            <div class="kpi">
              <div class="kpi-label">Invoice Date</div>
              <div class="kpi-value">{{ item?.invoiceDate || '-' }}</div>
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
            <v-btn icon small @click="$emit('close')">
              <v-icon>mdi-close</v-icon>
            </v-btn>
          </div>
        </div>
      </div>

      <v-divider />

      <!-- ================= CONTENT ================= -->
      <v-card-text class="content-area">
        <v-row>
          <!-- LEFT -->
          <v-col cols="12" md="7">
            <v-card flat class="detail-panel pa-4">
              <div class="panel-title mb-2">Details</div>

              <v-row dense class="detail-grid">
                <v-col cols="12" sm="6">
                  <div class="field-label">Chassis Number</div>
                  <div class="field-value">{{ item?.chassisNumber || '-' }}</div>
                </v-col>

                <v-col cols="12" sm="6">
                  <div class="field-label">Engine Number</div>
                  <div class="field-value">{{ item?.engineNumber || '-' }}</div>
                </v-col>

                <v-col cols="12" sm="6">
                  <div class="field-label">Model</div>
                  <div class="field-value">{{ item?.modelName || '-' }}</div>
                </v-col>

                <v-col cols="12" sm="6">
                  <div class="field-label">Color</div>
                  <v-chip small outlined>{{ item?.color || '-' }}</v-chip>
                </v-col>

                <v-col cols="12" sm="6">
                  <div class="field-label">Status</div>
                  <div class="field-value">{{ item?.status || '-' }}</div>
                </v-col>

                <v-col cols="12" sm="6">
                  <div class="field-label">Hold Days</div>
                  <div class="field-value">{{ item?.inventoryHoldDays ?? '-' }}</div>
                </v-col>

                <v-col cols="12" sm="6">
                  <div class="field-label">Added</div>
                  <div class="field-value">{{ formatDate(item?.createdAt) }}</div>
                </v-col>

                <v-col cols="12" sm="6">
                  <div class="field-label">Last Modified</div>
                  <div class="field-value">{{ formatDate(item?.lastModified || item?.updatedAt) }}</div>
                </v-col>
              </v-row>
            </v-card>
          </v-col>

          <!-- RIGHT -->
          <v-col cols="12" md="5">
            <v-card flat class="meta-panel pa-4">
              <div class="panel-title">Documents</div>
              <div v-if="hasDocuments" class="docs-grid">
                <v-row dense>
                  <v-col cols="12" v-for="(doc, i) in item.documents" :key="i">
                    <v-card class="doc-card" @click="$emit('open-document', doc)">
                      <v-row no-gutters align="center">
                        <v-col cols="auto" class="px-3">
                          <v-img v-if="doc.url" :src="doc.url" class="doc-thumb" contain />
                          <v-icon v-else large>mdi-file-document-outline</v-icon>
                        </v-col>
                        <v-col class="pl-3">
                          <div class="doc-title">{{ doc.name || `Document ${i + 1}` }}</div>
                        </v-col>
                      </v-row>
                    </v-card>
                  </v-col>
                </v-row>
              </div>
              <div v-else class="small-muted">No documents uploaded</div>
            </v-card>
          </v-col>
        </v-row>
      </v-card-text>

      <!-- ================= FOOTER ================= -->
      <v-divider />
      <v-card-actions class="dialog-footer">
        <v-spacer />

        <!-- 🔴 DELETE BUTTON -->
        <v-btn
          class="mr-2"
          color="red darken-1"
          outlined
          @click="onDelete"
        >
          <v-icon left small>mdi-delete</v-icon>
          Delete
        </v-btn>

        <v-btn class="mr-2" outlined @click="$emit('close')">
          Close
        </v-btn>

        <v-btn color="primary" @click="$emit('edit')">
          <v-icon left small>mdi-pencil</v-icon>
          Edit Inventory
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
import axios from 'axios'
import InventoryHistoryDialog from './InventoryHistoryDialog.vue'

export default {
  name: 'ItemDetailDialog',
  components: { InventoryHistoryDialog },

  props: {
    open: Boolean,
    item: Object
  },

  computed: {
    avatarText() {
      const v = this.item?.modelName || this.item?.categoryName || this.item?.chassisNumber || ''
      return v ? v[0].toUpperCase() : 'I'
    },
    statusColor() {
      const s = (this.item?.status || '').toUpperCase()
      if (s === 'ACTIVE') return 'green'
      if (s === 'SOLD') return 'red'
      if (s === 'DRAFT') return 'orange'
      return 'grey'
    },
    hasDocuments() {
      return Array.isArray(this.item?.documents) && this.item.documents.length
    }
  },

  methods: {
    formatDate(v) {
      if (!v) return '-'
      const d = new Date(Number(v))
      return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`
    },

    copyInvoice() {
      if (!this.item?.invoiceNumber) return
      navigator.clipboard.writeText(this.item.invoiceNumber)
      this.$root.$emit('show-snackbar', { text: 'Invoice copied', color: 'success' })
    },

    async onDelete() {
      if (!this.item) return

      const ok = confirm(
        `Delete this inventory item?\n\nInvoice: ${this.item.invoiceNumber}\nChassis: ${this.item.chassisNumber}`
      )
      if (!ok) return

      try {
        await axios.post(
          process.env.VUE_APP_AGENCY_BACKEND_URL + 'deleteInventoryItem',
          {
            pk: this.item.pk,
            sk: this.item.sk,
            chassisNumber: this.item.chassisNumber,
            actor: this.item.addedBy || null
          },
          { timeout: 15000 }
        )

        this.$root.$emit('show-snackbar', {
          text: 'Inventory item deleted',
          color: 'success'
        })

        this.$emit('deleted', this.item)
        this.$emit('close')

      } catch (err) {
        const msg = err?.response?.data?.message || err.message || 'Delete failed'
        this.$root.$emit('show-snackbar', { text: msg, color: 'error' })
      }
    }
  }
}
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
  background: linear-gradient(135deg, #001f3f, #4fc3f7);
  color: white;
  border-radius: 10px;
  box-shadow: 0 6px 18px rgba(25, 118, 210, 0.16);
}
.avatar-text { font-weight: 700; font-size: 20px; }
.header-meta { min-width: 260px; }
.invoice-title { font-size: 16px; color: #0f1724; font-weight: 600; }
.invoice-number { color: #001f3f; margin-left: 8px; font-weight: 700; }
.subtitle-row { display: flex; align-items: center; gap: 8px; margin-top: 6px; }
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

/* Detail grid: two per row */
.detail-grid .v-col { display: flex; flex-direction: column; }
.field-label { font-size:12px; color:#6b7280; margin-bottom:4px; }
.field-value { font-weight:700; color:#0f1724; font-size:15px; }

/* meta / docs */
.panel-title { font-weight:700; margin-bottom:8px; color:#111827; }
.docs-grid { max-height:320px; overflow:auto; padding-right:4px; }
.doc-card { border-radius:8px; cursor:pointer; transition:transform .15s ease; display:flex; align-items:center; }
.doc-card:hover { transform: translateY(-4px); }
.thumb-wrap { width:56px; height:56px; display:inline-flex; align-items:center; justify-content:center; border-radius:6px; background:#f7fafc; }
.doc-thumb { width:56px; height:56px; object-fit:cover; border-radius:6px; }
.thumb-fallback { width:56px; height:56px; display:flex; align-items:center; justify-content:center; color:#6b7280; }
.doc-title { font-weight:600; color:#111827; }
.doc-sub { font-size:12px; color:#6b7280; }

/* notes card */
.notes-card { border-radius:8px; background:#fff; box-shadow: 0 4px 10px rgba(2,6,23,0.03); }
.notes-title { font-weight:700; margin-bottom:8px; }
.notes-body { color:#374151; }

/* Footer */
.dialog-footer {
  position: sticky;      /* stays visible when content scrolls */
  bottom: 0;
  background: #fff;
  z-index: 1;
  padding: 10px 16px;
}
.footer-left, .footer-right { display:flex; align-items:center; }

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
