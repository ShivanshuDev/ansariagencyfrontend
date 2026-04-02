<template>
  <v-dialog style="height:1200px; border:1px solid green;" persistent v-model="open" max-width="1700px">
    <v-card style="height:800px;">
      <v-card-title style="60px">
        Invoice: {{ invoice?.invoiceNumber || '-' }}
        <v-spacer />

        <!-- <v-btn color="primary" @click="show = true">Show History</v-btn> -->
        <HistoryComponent
          entity="INVOICE"
          :invoiceNumber="invoice?.invoiceNumber"
          :baseUrl="base"
        />

        <v-spacer />
        <DownloadPdf :items="selectedItemsData" :headers="invoiceDetailHeaders" />
        
        <v-spacer />
        <DownloadXlsx
          :items="selectedItemsData"
          :headers="invoiceDetailHeaders"
          filename="invoice_items"
          @downloaded="$emit('downloaded')"
        />
        <v-spacer />
        <div style="margin-right:12px;"><small>Invoice Date: {{ invoice?.invoiceDate || '-' }}</small></div>
        <v-btn icon @click="onCloseClick"><v-icon>mdi-close</v-icon></v-btn>
      </v-card-title>

      <v-divider class="my-2"></v-divider>

      <v-card-text style="height:660px;">

        <!-- Bulk action bar -->
        <div v-if="internalSelected.length > 0" class="mb-3">
          <v-sheet class="pa-3" elevation="1" rounded>
            <div class="d-flex align-center flex-wrap">
              <div class="mr-4">
                <strong>{{ internalSelected.length }}</strong> selected
              </div>

              <v-select
                dense
                outlined
                hide-details
                class="mr-3"
                style="max-width: 240px;"
                label="Set status"
                :items="statusOptions"
                v-model="bulkStatus"
                :disabled="bulkUpdating"
                clearable
              />

              <v-btn
                color="primary"
                class="mr-2"
                :loading="bulkUpdating"
                :disabled="!bulkStatus || bulkUpdating || updatableSelectedChassisNumbers.length === 0"
                @click="applyBulkStatus"
              >
                Apply
              </v-btn>

              <v-btn text :disabled="bulkUpdating" @click="clearSelection">
                Clear selection
              </v-btn>

              <v-spacer></v-spacer>

              <div v-if="bulkMessage" class="ml-auto">
                <small>{{ bulkMessage }}</small>
              </div>
            </div>
          </v-sheet>
        </div>

        <div v-if="loading" style="text-align:center; padding:18px;">
          <v-progress-circular indeterminate />
        </div>

        <div v-else-if="items && items.length">
          <v-data-table
            :headers="tableHeaders"
            :items="items"
            show-select
            v-model="internalSelected"
            @input="onSelectionChange"
            item-key="chassisNumber"
            class="elevation-0"
            :page="page"
            @update:page="page = $event"
            :items-per-page="itemsPerPageLocal"
            @update:items-per-page="itemsPerPageLocal = $event"
            :footer-props="{
              'items-per-page-options': [10, 25, 50, { text: 'All', value: -1 }],
              'items-per-page-text': 'Rows per page'
            }"
          >
            <!-- ✅ Dedicated Serial Number column -->
            <template v-slot:item.serial="{ index }">
              <span class="font-weight-medium mono">{{ serialStart + index + 1 }}</span>
            </template>

            <!-- field templates -->
            <template v-slot:item.chassisNumber="{ item }">{{ item.chassisNumber || '-' }}</template>
            <template v-slot:item.engineNumber="{ item }">{{ item.engineNumber || '-' }}</template>
            <template v-slot:item.modelName="{ item }">{{ item.modelName || '-' }}</template>
            <template v-slot:item.color="{ item }">{{ item.color || '-' }}</template>

            <!-- Added Date formatting -->
            <template v-slot:item.createdAt="{ item }">{{ formatDate(item.createdAt) }}</template>

            <template v-slot:item.status="{ item }">{{ item.status || '-' }}</template>
            <template v-slot:item.inventoryHoldDays="{ item }">
              {{ (item.inventoryHoldDays !== undefined && item.inventoryHoldDays !== null) ? item.inventoryHoldDays : '-' }}
            </template>

            <!-- Actions column: Show button -->
            <template v-slot:item.__actions="{ item }">
              <v-btn small text @click="$emit('row-click', item)">
                <v-icon left small>mdi-eye</v-icon>Show
              </v-btn>
            </template>
          </v-data-table>
        </div>

        <div v-else>No inventory records found for this invoice.</div>
      </v-card-text>

      <v-card-actions style="height:60px;">
        <v-spacer />
        <v-btn text @click="$emit('close')">Close</v-btn>
      </v-card-actions>

      <!-- Feedback snackbars -->
      <v-snackbar v-model="snack.show" :timeout="4000" :color="snack.color">
        {{ snack.text }}
        <v-btn text @click="snack.show = false">Dismiss</v-btn>
      </v-snackbar>
    </v-card>
  </v-dialog>
</template>

<script>
import DownloadPdf from '@/views/DownloadPdf.vue';
import DownloadXlsx from '@/views/DownloadXlsx.vue';
import DownloadPdfInventory from '@/views/DownloadInvoiveInventory.vue';
import HistoryComponent from './InvoiceHistoryTimeline.vue'

export default {
  name: 'InvoiceDetailDialog',
  components: { DownloadPdf, DownloadXlsx, DownloadPdfInventory, HistoryComponent },
  props: {
    open: { type: Boolean, default: false },
    invoice: { type: Object, default: null },
    items: { type: Array, default: () => [] },
    invoiceDetailHeaders: { type: Array, default: () => [] },
    selectedItemsData: { type: Array, default: () => [] },
    loading: { type: Boolean, default: false },
    invoiceItemsPerPage: { type: Number, default: 10 },
    value: { type: Array, default: () => [] }
  },
  data() {
    return {
      show: false,
      statusOptions: ['ACTIVE', 'INACTIVE', 'REVIEW'],
      bulkStatus: null,
      bulkUpdating: false,
      bulkMessage: '',
      snack: { show: false, text: '', color: 'success' },
      base: '',
      internalSelected: [],

      // pagination for serial number continuity across pages
      page: 1,
      itemsPerPageLocal: this.invoiceItemsPerPage
    };
  },
  watch: {
    open(newVal) {
      if (!newVal) this.clearSelection();
    },
    value: {
      immediate: true,
      handler(v) {
        const incoming = Array.isArray(v) ? v : [];
        if (this._differentArrays(this.internalSelected, incoming)) {
          this.internalSelected = incoming.slice();
        }
      }
    },
    invoiceItemsPerPage(nv) {
      if (typeof nv === 'number' && nv > 0) this.itemsPerPageLocal = nv;
    }
  },
  computed: {
    tableHeaders() {
      // clone & filter existing headers
      const base = Array.isArray(this.invoiceDetailHeaders)
        ? JSON.parse(JSON.stringify(this.invoiceDetailHeaders))
        : [];

      // insert a dedicated Serial column right after the selection checkbox (i.e., as the first data column)
      const serialHeader = { text: 'S.No', value: 'serial', sortable: false, width: 72, align: 'start' };

      // If you want it as the VERY first visible column (after checkbox), put it at the front:
      const filtered = base.filter(h => h && h.value !== 'inventoryHoldDays');
      const withSerial = [serialHeader, ...filtered];

      // keep Actions at the end
      withSerial.push({ text: 'Actions', value: '__actions', sortable: false });
      return withSerial;
    },
    selectedChassisNumbers() {
      if (!Array.isArray(this.internalSelected)) return [];
      return this.internalSelected
        .map(r => r && (r.chassisNumber || r.chassis))
        .filter(Boolean)
        .map(String);
    },
    // ✅ NEW: Only chassis numbers whose status is NOT SOLD
    updatableSelectedChassisNumbers() {
      if (!Array.isArray(this.internalSelected)) return [];
      return this.internalSelected
        .filter(r => (r?.status || '').toUpperCase() !== 'SOLD')
        .map(r => r && (r.chassisNumber || r.chassis))
        .filter(Boolean)
        .map(String);
    },
    serialStart() {
      const p = Number(this.page) || 1;
      const ipp = Number(this.itemsPerPageLocal) || 0;
      if (ipp <= 0) return 0; // "All" case
      return (p - 1) * ipp;
    }
  },
  methods: {
    onCloseClick() {
      this.clearSelection();
      this.$emit('close');
    },
    _differentArrays(a, b) {
      if (a === b) return false;
      if (!Array.isArray(a) || !Array.isArray(b)) return true;
      if (a.length !== b.length) return true;
      for (let i = 0; i < a.length; i++) {
        const ax = a[i]?.chassisNumber || a[i]?.chassis || JSON.stringify(a[i]);
        const bx = b[i]?.chassisNumber || b[i]?.chassis || JSON.stringify(b[i]);
        if (ax !== bx) return true;
      }
      return false;
    },
    _epochToMs(v) {
      if (v == null) return null;
      const n = Number(v);
      if (Number.isNaN(n)) return null;
      return n < 1e12 ? n * 1000 : n;
    },
    formatDate(v) {
      const ms = this._epochToMs(v);
      if (ms == null) return '-';
      try {
        return new Date(ms).toLocaleDateString('en-GB');
      } catch (e) {
        return new Date(ms).toLocaleDateString();
      }
    },
    onSelectionChange(val) {
      this.internalSelected = Array.isArray(val) ? val : [];
      this.$emit('update:selected', this.internalSelected);
      this.$emit('update:value', this.internalSelected);
      this.$emit('input', this.internalSelected);
    },
    clearSelection() {
      this.internalSelected = [];
      this.bulkStatus = null;
      this.bulkMessage = '';
      this.$emit('update:selected', []);
      this.$emit('update:value', []);
      this.$emit('input', []);
    },
    async applyBulkStatus() {
      const chassisNumbersToUpdate = this.updatableSelectedChassisNumbers;

      // nothing to update (either nothing selected or all SOLD)
      if (!this.bulkStatus || chassisNumbersToUpdate.length === 0) {
        if (this.internalSelected.length > 0) {
          this.snack = {
            show: true,
            text: 'Selected items are already SOLD. Nothing to update.',
            color: 'warning'
          };
        }
        return;
      }

      this.bulkUpdating = true;
      this.bulkMessage = '';
      try {
        const res = await fetch(process.env.VUE_APP_AGENCY_BACKEND_URL + 'updateInventoryItem', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chassisNumbers: chassisNumbersToUpdate,
            item: { status: this.bulkStatus }
          })
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data?.message || 'Bulk update failed');

        const okCount = Array.isArray(data?.results) ? data.results.filter(r => r.ok).length : 0;
        const failCount = Array.isArray(data?.results) ? data.results.length - okCount : 0;
        const skippedCount = this.internalSelected.length - chassisNumbersToUpdate.length;

        let msg = `Updated ${okCount} item(s).`;
        if (skippedCount > 0) msg += ` Skipped ${skippedCount} SOLD item(s).`;
        if (failCount > 0) msg += ` ${failCount} failed.`;
        if (failCount === 0) msg += ' All good!';

        this.snack = {
          show: true,
          text: msg,
          color: failCount ? 'warning' : 'success'
        };

        this.bulkMessage = data?.message || '';
        this.$emit('bulk-updated', data);
        this.bulkStatus = null;
        this.$emit('close');
      } catch (err) {
        this.snack = { show: true, text: String(err?.message || err), color: 'error' };
      } finally {
        this.bulkUpdating = false;
      }
    }
  }
};
</script>

<style scoped>
/* Header color you already set */
::v-deep .v-data-table-header {
  background-color: #dff3f79c;
  color: black;
}
::v-deep(.v-data-table thead th) {
  background-color: #dff3f79c !important;
  color: black !important;
}

/* Force row + header height to ~50px */
::v-deep .v-data-table__wrapper thead tr > th,
::v-deep .v-data-table__wrapper tbody tr > td {
  height: 50px !important;
  padding-top: 8px !important;
  padding-bottom: 8px !important;
  vertical-align: middle !important;
}

/* Optional: narrow S.No column */
::v-deep .v-data-table__wrapper td[data-label="S.No"],
::v-deep .v-data-table__wrapper th[aria-label="S.No"] {
  width: 72px;
  max-width: 72px;
  white-space: nowrap;
}

/* Serial number font */
.mono {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
}
</style>
