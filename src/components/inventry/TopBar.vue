<template>
  <div>
    <v-row
      style="width:100%; display:flex; flex-direction:row; justify-content:space-between;"
      class="px-4 py-2"
      align="center"
      no-gutters
    >
      <!-- Search Invoice Number (keeps existing emit behavior) -->
      <v-col cols="12" md="3" class="pa-0 pr-2">
        <v-text-field
          :value="invoiceSearch"
          @input="$emit('search-invoice', $event)"
          label="Search by Invoice Number"
          dense
          outlined
          clearable
          hide-details
          placeholder="Invoice number..."
        />
      </v-col>

      <!-- Search Chassis Number (independent; opens dialog & calls API) -->
      <v-col cols="12" md="3" class="pa-0 pr-2">
        <v-text-field
          v-model="chassisQuery"
          @input="onChassisInput"
          label="Search by chassis Number"
          dense
          outlined
          clearable
          hide-details
          placeholder="Chassis or Engine number..."
        />
      </v-col>

      <!-- Buttons (these operate on parent's selectedItemsData as before) -->
      <v-col cols="auto" class="pl-2" style="display:flex; align-items:center; gap:8px;">
        <v-btn outlined color="primary" @click="$emit('open-filter')">Filter</v-btn>

        <DownloadPdfInventory :items="selectedItemsData" :headers="invoiceDetailHeaders" />

        <DownloadInvoiceXlsx
          :items="selectedItemsData"
          filename="Inventory_ALL"
        />

        <v-progress-circular v-if="loadingSelectedInvoices" indeterminate size="24" />
      </v-col>
    </v-row>

    <!-- Dialog shown only by this component when chassis search returns (or while loading) -->
    <v-dialog v-model="dialogOpen" max-width="1800px" persistent>
      <v-card>
        <v-card-title class="d-flex align-center justify-space-between">
          <div>
            <span class="headline">Search results for: "{{ chassisQuery }}"</span>
            <div v-if="!loadingChassis && !localChassisResults.length" class="subtitle-2">No results found</div>
            <div v-if="loadingChassis" class="subtitle-2">Searching...</div>
          </div>

          <div class="d-flex align-center" style="gap:8px;">
            <!-- Downloads operate on selectedRows inside the dialog -->
            <DownloadPdf :items="selectedRows" :headers="dialogHeaders" />
            <DownloadXlsx
              :items="selectedRows"
              :headers="dialogHeaders"
              filename="chassis_search_results"
              @downloaded="onDialogDownloaded"
              :disabled="loadingChassis || !selectedRows.length"
            />
            <v-btn icon @click="closeDialog"><v-icon>mdi-close</v-icon></v-btn>
          </div>
        </v-card-title>

        <v-card-text>
          <v-skeleton-loader v-if="loadingChassis" type="table" />
          <div v-else>
            <v-simple-table dense>
              <thead style="background-color:#dff3f79c; color:white;">
                <tr style="color:white;">
                  <!-- checkbox header -->
                  <th style="width:48px; text-align:center;">
                    <v-checkbox
                      :input-value="allSelected"
                      @change="toggleSelectAll"
                      hide-details
                      dense
                    />
                  </th>

                  <!-- other headers (inventoryHoldDays filtered out) -->
                  <th  v-for="h in dialogHeaders" :key="h.value">{{ h.text }}</th>

                  <!-- Actions column -->
                  <th style="width:110px; text-align:center;">Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="!localChassisResults.length">
                  <td :colspan="dialogHeaders.length + 2" class="text-center">No items found</td>
                </tr>

                <tr
                  v-for="(row, idx) in localChassisResults"
                  :key="row.pk || row.chassisNumber || row.engineNumber || idx"
                >
                  <!-- row checkbox -->
                  <td style="text-align:center;">
                    <v-checkbox
                      :input-value="isSelected(row)"
                      @change="toggleRowSelection(row)"
                      hide-details
                      dense
                    />
                  </td>

                  <td v-for="h in dialogHeaders" :key="h.value">
                    {{ getValue(row, h.value) }}
                  </td>

                  <!-- Edit action -->
                  <td style="text-align:center;">
                    <v-btn small text @click="openEdit(row)">
                      <v-icon left small>mdi-pencil</v-icon>Edit
                    </v-btn>
                  </td>
                </tr>
              </tbody>
            </v-simple-table>
          </div>
        </v-card-text>

        <v-card-actions>
          <v-spacer />
          <div class="mr-4">
            <small v-if="selectedRows.length">{{ selectedRows.length }} selected</small>
          </div>
          <v-btn text @click="closeDialog">Close</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Edit dialog (internal) -->
    <v-dialog v-model="editDialog" persistent max-width="920px">
      <v-card>
        <v-card-title>
          Edit Inventory Item
          <v-spacer />
          <v-btn icon @click="closeEdit"><v-icon>mdi-close</v-icon></v-btn>
        </v-card-title>

        <v-card-text>
          <edit-inventory
            v-if="editItem"
            :item="editItem"
            @saved="onEditSaved"
            @cancel="closeEdit"
          />
        </v-card-text>
      </v-card>
    </v-dialog>
  </div>
</template>

<script>
import axios from 'axios';
import DownloadPdfInventory from '@/views/DownloadInvoiveInventory.vue';
import DownloadXlsx from '@/views/DownloadXlsx.vue';
import DownloadInvoiceXlsx from '@/views/DownloadInvoiceXlsx.vue';
import EditInventory from './EditInventory.vue'; // adjust path if needed

export default {
  name: 'TopBar',
  components: { DownloadPdfInventory, DownloadXlsx, EditInventory, DownloadInvoiceXlsx },
  props: {
    invoiceSearch: String, // unchanged
    selectedItemsData: { type: Array, default: () => [] },
    invoiceDetailHeaders: { type: Array, default: () => [] },
    loadingSelectedInvoices: { type: Boolean, default: false }
  },
  data() {
    return {
      // chassis search local state
      chassisQuery: '',
      _chassisTimer: null,
      engineDebounceMs: 420,
      loadingChassis: false,
      chassisResults: [], // raw results from API
      dialogOpen: false,

      // selection state for the dialog table
      selectedRowKeys: [], // array of unique row keys (pk or generated)
      selectedRows: [], // full objects

      // edit dialog
      editDialog: false,
      editItem: null
    };
  },
  computed: {
    // headers used inside the dialog (can be adjusted if you want different columns)
    // IMPORTANT: filter out 'inventoryHoldDays' so "Holds By Day" doesn't show
    dialogHeaders() {
      const fallback = [
        { text: 'Chassis Number', value: 'chassisNumber' },
        { text: 'Engine Number', value: 'engineNumber' },
        { text: 'Model Name', value: 'modelName' },
        { text: 'Color', value: 'color' },
        { text: 'Invoice Number', value: 'invoiceNumber' },
        { text: 'Added By', value: 'addedBy' },
        { text: 'Status', value: 'status' }
      ];

      if (Array.isArray(this.invoiceDetailHeaders) && this.invoiceDetailHeaders.length) {
        // clone and remove inventoryHoldDays if it exists
        return JSON.parse(JSON.stringify(this.invoiceDetailHeaders)).filter(h => h && h.value !== 'inventoryHoldDays');
      }

      return fallback;
    },

    localChassisResults() {
      return this.chassisResults || [];
    },

    // whether all visible rows are selected
    allSelected() {
      if (!this.localChassisResults.length) return false;
      // every visible row has its key in selectedRowKeys
      return this.localChassisResults.every(r => this.selectedRowKeys.includes(this._rowKey(r)));
    }
  },
  methods: {
    // debounce handler
    onChassisInput() {
      if (this._chassisTimer) {
        clearTimeout(this._chassisTimer);
        this._chassisTimer = null;
      }

      const v = this.chassisQuery == null ? '' : String(this.chassisQuery).trim();

      if (!v) {
        this.chassisResults = [];
        this.dialogOpen = false;
        this.loadingChassis = false;
        this.clearSelection();
        return;
      }

      const isCandidate = /[A-Za-z0-9]{3,}/.test(v);
      if (!isCandidate) return;

      this._chassisTimer = setTimeout(() => {
        this._chassisTimer = null;
        this._searchChassisApi(v);
      }, this.engineDebounceMs);
    },

    // *** simplified: read resSearch.data.items directly (your provided format) ***
    async _searchChassisApi(q) {
      this.loadingChassis = true;
      try {
        const resSearch = await axios.get(
          `${process.env.VUE_APP_AGENCY_BACKEND_URL}searchInventoryByChassis`,
          { params: { query: q } } // backend expects `query`
        );

        // direct extraction per your API shape { message, items: [...], count }
        const items = (resSearch && resSearch.data && Array.isArray(resSearch.data.items))
          ? resSearch.data.items
          : [];

        // minimal normalization + compute inventoryHoldDays + sort latest-first
        const now = Date.now();
        const normalized = items.map(it => {
          const out = { ...(it || {}) };
          // ensure keys used in template exist
          if (!out.chassisNumber && out.chassis) out.chassisNumber = out.chassis;
          if (!out.engineNumber && out.engine) out.engineNumber = out.engine;
          if (!out.modelName && out.model) out.modelName = out.model;
          if (!out.addedBy && out.added_by) out.addedBy = out.added_by;
          if (!out.invoiceNumber && out.invoice_no) out.invoiceNumber = out.invoice_no;

          const created = out.createdAt || out.created_at || out.created_date;
          let createdMs = null;
          if (created != null && !Number.isNaN(Number(created))) {
            const n = Number(created);
            createdMs = n < 1e12 ? n * 1000 : n;
          }
          out.inventoryHoldDays = (createdMs != null) ? Math.floor(Math.max(0, now - createdMs) / (1000 * 60 * 60 * 24)) : '';

          return out;
        });

        // sort newest first
        normalized.sort((a, b) => {
          const aCt = Number(a.createdAt || a.created_at || a.created_date) || 0;
          const bCt = Number(b.createdAt || b.created_at || b.created_date) || 0;
          const aMs = aCt < 1e12 ? aCt * 1000 : aCt;
          const bMs = bCt < 1e12 ? bCt * 1000 : bCt;
          return bMs - aMs;
        });

        // set results and clear previous selection
        this.chassisResults = normalized;
        this.clearSelection();
        this.dialogOpen = true;
      } catch (err) {
        // on error show dialog with no results
        // eslint-disable-next-line no-console
        console.error('searchInventoryByChassis failed', err);
        this.chassisResults = [];
        this.clearSelection();
        this.dialogOpen = true;
      } finally {
        this.loadingChassis = false;
      }
    },

    // compute unique key for a row (prefer pk, else combination)
    _rowKey(row) {
      if (!row) return null;
      if (row.pk) return String(row.pk);
      // fallback key: chassisNumber|engineNumber|invoiceNumber or index-safe key
      return `${row.chassisNumber || ''}::${row.engineNumber || ''}::${row.invoiceNumber || ''}`;
    },

    // returns boolean if row selected
    isSelected(row) {
      const k = this._rowKey(row);
      return !!k && this.selectedRowKeys.includes(k);
    },

    // toggle a single row selection
    toggleRowSelection(row) {
      const k = this._rowKey(row);
      if (!k) return;
      const idx = this.selectedRowKeys.indexOf(k);
      if (idx === -1) {
        this.selectedRowKeys.push(k);
        this.selectedRows.push(row);
      } else {
        this.selectedRowKeys.splice(idx, 1);
        const idx2 = this.selectedRows.findIndex(r => this._rowKey(r) === k);
        if (idx2 !== -1) this.selectedRows.splice(idx2, 1);
      }
    },

    // toggle all visible rows
    toggleSelectAll() {
      if (!this.localChassisResults.length) return;
      if (this.allSelected) {
        // clear
        this.clearSelection();
      } else {
        // select all visible
        this.selectedRowKeys = this.localChassisResults.map(r => this._rowKey(r)).filter(Boolean);
        this.selectedRows = this.localChassisResults.slice();
      }
    },

    clearSelection() {
      this.selectedRowKeys = [];
      this.selectedRows = [];
    },

    // getValue (formats createdAt to dd/mm/yyyy)
    getValue(row, key) {
      if (!row) return '';
      const v = row[key];
      if (v === null || typeof v === 'undefined') return '';
      if (key === 'createdAt') {
        const n = Number(v);
        if (Number.isNaN(n)) return v;
        const ms = n < 1e12 ? n * 1000 : n; // handle seconds vs ms
        const d = new Date(ms);
        const day = String(d.getDate()).padStart(2, '0');
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const year = d.getFullYear();
        return `${day}/${month}/${year}`;
      }

      return v;
    },

    // ---- Edit actions ----
    openEdit(row) {
      if (!row) return;
      // open internal edit dialog with a deep copy to avoid accidental mutation
      this.editItem = JSON.parse(JSON.stringify(row));
      this.editDialog = true;
    },

    closeEdit() {
      this.editDialog = false;
      this.editItem = null;
    },

    onEditSaved(payload) {
      // payload expected to contain saved item (try to infer)
      let updated = null;
      if (!payload) {
        // nothing — close
        this.closeEdit();
        return;
      }
      if (payload.item) updated = payload.item;
      else if (payload.updated) updated = payload.updated;
      else if (payload.data) updated = payload.data;
      else if (payload && typeof payload === 'object') updated = payload;

      if (updated) {
        // merge/replace into chassisResults (match by pk or sk or fallback key)
        const keyFor = r => (r.pk ? String(r.pk) : `${r.chassisNumber||''}::${r.engineNumber||''}::${r.invoiceNumber||''}`);
        const updatedKey = keyFor(updated);
        const idx = this.chassisResults.findIndex(r => keyFor(r) === updatedKey);
        if (idx !== -1) {
          // keep original object's references for selection if possible
          this.$set(this.chassisResults, idx, { ...this.chassisResults[idx], ...updated });
        } else {
          // if not found, prepend to results
          this.chassisResults.unshift(updated);
        }

        // also update selectedRows if that row is selected
        const selIdx = this.selectedRows.findIndex(r => keyFor(r) === updatedKey);
        if (selIdx !== -1) this.$set(this.selectedRows, selIdx, { ...this.selectedRows[selIdx], ...updated });

        // emit to parent so it can refresh or handle saved item
        this.$emit('inventory-saved', { item: updated });
      }

      this.closeEdit();
    },

    closeDialog() {
      this.dialogOpen = false;
    },

    onDialogDownloaded() {
      this.$emit('downloaded');
    }
  }
};
</script>

<style scoped>
.headline {
  font-weight: 600;
}
</style>
