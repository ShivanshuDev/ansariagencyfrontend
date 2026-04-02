<template>
  <div style="background-color:white; height:91vh; padding:12px; margin:12px; border-radius:5px;">
    <!-- SEARCH FIELDS -->
    <v-row class="px-4 py-2" no-gutters>
      <!-- Search by Chassis Number -->
      <v-col cols="12" md="3" class="pa-0 pr-2">
        <v-text-field
          v-model="chassisQuery"
          @input="onChassisInput"
          label="Search by Chassis Number"
          dense
          outlined
          clearable
          hide-details
          placeholder="Chassis number..."
        />
      </v-col>

      <!-- Search by Engine Number -->
      <v-col cols="12" md="3" class="pa-0 pr-2">
        <v-text-field
          v-model="engineQuery"
          @input="onEngineInput"
          label="Search by Engine Number"
          dense
          outlined
          clearable
          hide-details
          placeholder="Engine number..."
        />
      </v-col>
    </v-row>

    <!-- INLINE RESULT CARD (NO DIALOG) -->
    <v-card
      v-if="hasSearched || loadingChassis"
      class="mt-4"
      elevation="2"
    >
      <v-card-title class="d-flex align-center justify-space-between">
        <div>
          <span class="headline">
            Search results for:
            "
            {{ activeQuery }}
            "
          </span>

          <div v-if="!loadingChassis && hasSearched && !localChassisResults.length" class="subtitle-2 mt-1">
            No results found
          </div>
          <div v-if="loadingChassis" class="subtitle-2 mt-1">
            Searching...
          </div>
        </div>

        <div class="d-flex align-center" style="gap:8px;">
          <!-- Downloads operate on selectedRows -->
          <DownloadPdf
            :items="selectedRows"
            :headers="dialogHeaders"
          />
          <DownloadXlsx
            :items="selectedRows"
            :headers="dialogHeaders"
            filename="inventory_search_results"
            @downloaded="onDialogDownloaded"
            :disabled="loadingChassis || !selectedRows.length"
          />
          <v-btn
            text
            @click="clearSearch"
          >
            Clear
          </v-btn>
        </div>
      </v-card-title>

      <v-card-text>
        <v-skeleton-loader v-if="loadingChassis" type="table" />
        <div v-else>
          <v-simple-table dense>
            <thead style="background-color:#dff3f79c; color:white;">
              <tr>
                <!-- Checkbox header -->
                <th style="width:48px; text-align:center;">
                  <v-checkbox
                    :input-value="allSelected"
                    @change="toggleSelectAll"
                    hide-details
                    density="compact"
                  />
                </th>

                <!-- Dynamic headers -->
                <th v-for="h in dialogHeaders" :key="h.value">
                  {{ h.text }}
                </th>

                <!-- Actions column -->
                <th style="width:160px; text-align:center;">Actions</th>
              </tr>
            </thead>

            <tbody>
              <!-- Empty state -->
              <tr v-if="!localChassisResults.length && hasSearched">
                <td :colspan="dialogHeaders.length + 2" class="text-center">
                  No items found
                </td>
              </tr>

              <!-- Rows -->
              <tr
                v-for="(row, idx) in localChassisResults"
                :key="row.pk || row.chassisNumber || row.engineNumber || idx"
              >
                <!-- Row checkbox -->
                <td style="text-align:center;">
                  <v-checkbox
                    :input-value="isSelected(row)"
                    @change="toggleRowSelection(row)"
                    hide-details
                    density="compact"
                  />
                </td>

                <!-- Data cells -->
                <td v-for="h in dialogHeaders" :key="h.value">
                  {{ getValue(row, h.value) }}
                </td>

                <!-- Actions -->
                <td style="text-align:center; white-space:nowrap;">
                  <!-- Edit -->
                  <v-tooltip text="Edit Item" location="top">
                    <template #activator="{ props }">
                      <v-btn
                        v-bind="props"
                        color="primary"
                        size="x-small"
                        variant="tonal"
                        class="mr-1"
                        @click="openEdit(row)"
                      >
                        <v-icon size="16" start>mdi-pencil</v-icon>
                        Edit
                      </v-btn>
                    </template>
                  </v-tooltip>

                  <!-- Inventory History -->
                  <v-tooltip text="View Inventory History" location="top">
                    <template #activator="{ props }">
                      <v-btn
                        v-bind="props"
                        color="teal"
                        size="x-small"
                        variant="tonal"
                        @click="openHistory(row)"
                      >
                        <v-icon size="16" start>mdi-history</v-icon>
                        History
                      </v-btn>
                    </template>
                  </v-tooltip>
                </td>
              </tr>
            </tbody>
          </v-simple-table>
        </div>
      </v-card-text>

      <v-card-actions>
        <v-spacer />
        <div class="mr-4">
          <small v-if="selectedRows.length">
            {{ selectedRows.length }} selected
          </small>
        </div>
      </v-card-actions>
    </v-card>

    <!-- Inventory History Dialog (kept same behavior) -->
    <InventoryHistoryDialog
      v-if="true"
      v-model="historyDialogOpen"
      :invoiceNumber="historyInvoiceNumber"
      :chassisNumber="historyChassisNumber"
    />

    <!-- Edit dialog (same as before) -->
    <v-dialog v-model="editDialog" persistent max-width="920px">
      <v-card>
        <v-card-title>
          Edit Inventory Item
          <v-spacer />
          <v-btn icon @click="closeEdit">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-card-title>

        <v-card-text>
          <EditInventory
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
import DownloadPdf from '@/views/DownloadPdf.vue'; // adjust path if needed
import DownloadXlsx from '@/views/DownloadXlsx.vue';
import EditInventory from './EditInventory.vue'; // adjust path if needed
import InventoryHistoryDialog from './InventoryHistoryDialog.vue';

export default {
  name: 'ChassisSearch',
  components: {
    DownloadPdf,
    DownloadXlsx,
    EditInventory,
    InventoryHistoryDialog
  },
  props: {
    // to keep same columns as invoice table (minus inventoryHoldDays)
    invoiceDetailHeaders: {
      type: Array,
      default: () => []
    }
  },
  emits: ['inventory-saved', 'downloaded'],
  data() {
    return {
      // history dialog state
      historyDialogOpen: false,
      historyInvoiceNumber: '',
      historyChassisNumber: '',

      // search local state
      chassisQuery: '',
      engineQuery: '',        // NEW: engine search query
      _chassisTimer: null,
      _engineTimer: null,     // NEW: engine debounce timer
      engineDebounceMs: 420,
      loadingChassis: false,
      chassisResults: [],
      dialogOpen: false,      // kept for compatibility, no longer used
      hasSearched: false,     // NEW: to show "no results" / card

      // selection state
      selectedRowKeys: [],
      selectedRows: [],

      // edit dialog
      editDialog: false,
      editItem: null
    };
  },
  computed: {
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
        return JSON.parse(JSON.stringify(this.invoiceDetailHeaders))
          .filter(h => h && h.value !== 'inventoryHoldDays');
      }

      return fallback;
    },

    localChassisResults() {
      return this.chassisResults || [];
    },

    allSelected() {
      if (!this.localChassisResults.length) return false;
      return this.localChassisResults.every(r =>
        this.selectedRowKeys.includes(this._rowKey(r))
      );
    },

    // NEW: which query text to show in title
    activeQuery() {
      return this.chassisQuery || this.engineQuery || '';
    }
  },
  methods: {
    openHistory(row) {
      if (!row) return;
      this.historyInvoiceNumber = row.invoiceNumber || row.invoice_no || '';
      this.historyChassisNumber = row.chassisNumber || row.chassis || '';
      this.historyDialogOpen = true;
    },

    // debounce handler for chassis search
    onChassisInput() {
      // when user types in chassis box, clear engine search
      if (this.engineQuery) {
        this.engineQuery = '';
      }
      if (this._engineTimer) {
        clearTimeout(this._engineTimer);
        this._engineTimer = null;
      }

      if (this._chassisTimer) {
        clearTimeout(this._chassisTimer);
        this._chassisTimer = null;
      }

      const v = this.chassisQuery == null ? '' : String(this.chassisQuery).trim();

      if (!v) {
        this.chassisResults = [];
        this.loadingChassis = false;
        this.hasSearched = false;
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

    // NEW: debounce handler for engine search
    onEngineInput() {
      // when user types in engine box, clear chassis search
      if (this.chassisQuery) {
        this.chassisQuery = '';
      }
      if (this._chassisTimer) {
        clearTimeout(this._chassisTimer);
        this._chassisTimer = null;
      }

      if (this._engineTimer) {
        clearTimeout(this._engineTimer);
        this._engineTimer = null;
      }

      const v = this.engineQuery == null ? '' : String(this.engineQuery).trim();

      if (!v) {
        this.chassisResults = [];
        this.loadingChassis = false;
        this.hasSearched = false;
        this.clearSelection();
        return;
      }

      const isCandidate = /[A-Za-z0-9]{3,}/.test(v);
      if (!isCandidate) return;

      this._engineTimer = setTimeout(() => {
        this._engineTimer = null;
        this._searchEngineApi(v);
      }, this.engineDebounceMs);
    },

    async _searchChassisApi(q) {
      this.loadingChassis = true;
      this.hasSearched = false;
      try {
        const resSearch = await axios.get(
          `${process.env.VUE_APP_AGENCY_BACKEND_URL}searchInventoryByChassis`,
          { params: { query: q } }
        );

        this._handleSearchResponse(resSearch);
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('searchInventoryByChassis failed', err);
        this.chassisResults = [];
        this.clearSelection();
      } finally {
        this.loadingChassis = false;
        this.hasSearched = true;
      }
    },

    // NEW: search by engineNumber
    async _searchEngineApi(q) {
      this.loadingChassis = true;
      this.hasSearched = false;
      try {
        const resSearch = await axios.get(
          `${process.env.VUE_APP_AGENCY_BACKEND_URL}searchInventoryByengineNumber`,
          { params: { query: q } }
        );

        this._handleSearchResponse(resSearch);
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('searchInventoryByengineNumber failed', err);
        this.chassisResults = [];
        this.clearSelection();
      } finally {
        this.loadingChassis = false;
        this.hasSearched = true;
      }
    },

    // shared normalization code
    _handleSearchResponse(resSearch) {
      const items = (resSearch && resSearch.data && Array.isArray(resSearch.data.items))
        ? resSearch.data.items
        : [];

      const now = Date.now();
      const normalized = items.map(it => {
        const out = { ...(it || {}) };

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
        out.inventoryHoldDays = (createdMs != null)
          ? Math.floor(Math.max(0, now - createdMs) / (1000 * 60 * 60 * 24))
          : '';

        return out;
      });

      normalized.sort((a, b) => {
        const aCt = Number(a.createdAt || a.created_at || a.created_date) || 0;
        const bCt = Number(b.createdAt || b.created_at || b.created_date) || 0;
        const aMs = aCt < 1e12 ? aCt * 1000 : aCt;
        const bMs = bCt < 1e12 ? bCt * 1000 : bCt;
        return bMs - aMs;
      });

      this.chassisResults = normalized;
      this.clearSelection();
    },

    _rowKey(row) {
      if (!row) return null;
      if (row.pk) return String(row.pk);
      return `${row.chassisNumber || ''}::${row.engineNumber || ''}::${row.invoiceNumber || ''}`;
    },

    isSelected(row) {
      const k = this._rowKey(row);
      return !!k && this.selectedRowKeys.includes(k);
    },

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

    toggleSelectAll() {
      if (!this.localChassisResults.length) return;
      if (this.allSelected) {
        this.clearSelection();
      } else {
        this.selectedRowKeys = this.localChassisResults
          .map(r => this._rowKey(r))
          .filter(Boolean);
        this.selectedRows = this.localChassisResults.slice();
      }
    },

    clearSelection() {
      this.selectedRowKeys = [];
      this.selectedRows = [];
    },

    // Clear both queries and results
    clearSearch() {
      this.chassisQuery = '';
      this.engineQuery = '';
      this.chassisResults = [];
      this.hasSearched = false;
      this.loadingChassis = false;
      this.clearSelection();
    },

    getValue(row, key) {
      if (!row) return '';
      const v = row[key];
      if (v === null || typeof v === 'undefined') return '';
      if (key === 'createdAt') {
        const n = Number(v);
        if (Number.isNaN(n)) return v;
        const ms = n < 1e12 ? n * 1000 : n;
        const d = new Date(ms);
        const day = String(d.getDate()).padStart(2, '0');
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const year = d.getFullYear();
        return `${day}/${month}/${year}`;
      }
      return v;
    },

    openEdit(row) {
      if (!row) return;
      this.editItem = JSON.parse(JSON.stringify(row));
      this.editDialog = true;
    },

    closeEdit() {
      this.editDialog = false;
      this.editItem = null;
    },

    onEditSaved(payload) {
      let updated = null;
      if (!payload) {
        this.closeEdit();
        return;
      }
      if (payload.item) updated = payload.item;
      else if (payload.updated) updated = payload.updated;
      else if (payload.data) updated = payload.data;
      else if (payload && typeof payload === 'object') updated = payload;

      if (updated) {
        const keyFor = r =>
          (r.pk
            ? String(r.pk)
            : `${r.chassisNumber || ''}::${r.engineNumber || ''}::${r.invoiceNumber || ''}`);
        const updatedKey = keyFor(updated);
        const idx = this.chassisResults.findIndex(r => keyFor(r) === updatedKey);

        if (idx !== -1) {
          this.$set(this.chassisResults, idx, {
            ...this.chassisResults[idx],
            ...updated
          });
        } else {
          this.chassisResults.unshift(updated);
        }

        const selIdx = this.selectedRows.findIndex(r => keyFor(r) === updatedKey);
        if (selIdx !== -1) {
          this.$set(this.selectedRows, selIdx, {
            ...this.selectedRows[selIdx],
            ...updated
          });
        }

        this.$emit('inventory-saved', { item: updated });
      }

      this.closeEdit();
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
