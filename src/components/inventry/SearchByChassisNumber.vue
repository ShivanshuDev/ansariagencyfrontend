<template>
  <div class="chassis-search-wrapper">
    <!-- ===== PAGE HEADER ===== -->
    <div class="page-header d-flex align-center justify-space-between">
      <div>
        <div class="page-title">
          Inventory Search
        </div>
        <div class="page-subtitle">
          Search results by <strong>Chassis</strong> &amp; <strong>Engine</strong> number
        </div>
      </div>

      <div class="d-flex align-center header-chips">
        <v-chip
          v-if="activeQuery"
          class="mr-2"
          size="small"
          label
          color="primary"
          variant="tonal"
        >
          {{ searchModeLabel }}: {{ activeQuery }}
        </v-chip>

        <v-chip
          v-if="hasSearched"
          size="small"
          label
          variant="outlined"
        >
          {{ localChassisResults.length }} result{{ localChassisResults.length === 1 ? '' : 's' }}
        </v-chip>
      </div>
    </div>

    <!-- ===== SEARCH SECTION ===== -->
    <v-card class="search-card" elevation="2">
      <v-card-title class="search-card-title">
        <div class="d-flex align-center">
          <v-icon class="mr-2">mdi-magnify</v-icon>
          <span>Search Inventory</span>
        </div>
        <div class="text-caption grey--text">
          Type at least 3 characters in Chassis or Engine number to search
        </div>
      </v-card-title>

      <v-divider />

      <v-card-text class="py-3">
        <v-row dense>
          <!-- Search by Chassis Number -->
          <v-col cols="12" md="3" class="pr-md-4 pr-0">
            <v-text-field
              v-model="chassisQuery"
              @input="onChassisInput"
              label="Search by Chassis Number"
              dense
              outlined
              clearable
              hide-details
              placeholder="Enter chassis number..."
              prepend-inner-icon="mdi-car-info"
            />
          </v-col>

          <!-- Search by Engine Number -->
          <v-col cols="12" md="3" class="pr-md-4 pr-0 mt-3 mt-md-0">
            <v-text-field
              v-model="engineQuery"
              @input="onEngineInput"
              label="Search by Engine Number"
              dense
              outlined
              clearable
              hide-details
              placeholder="Enter engine number..."
              prepend-inner-icon="mdi-engine"
            />
          </v-col>

          <!-- Spacer -->
          <v-col cols="12" md="3" class="mt-3 mt-md-0 d-flex align-center">
            <div class="text-caption grey--text">
              Only one field is active at a time. Typing in one clears the other automatically.
            </div>
          </v-col>

          <!-- Clear button -->
          <v-col cols="12" md="3" class="mt-3 mt-md-0 d-flex justify-end align-center">
            <v-btn
              text
              small
              @click="clearSearch"
              :disabled="!chassisQuery && !engineQuery && !hasSearched"
            >
              <v-icon left size="18">mdi-broom</v-icon>
              Clear Search
            </v-btn>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <!-- ===== INLINE RESULT CARD ===== -->
    <v-card
      v-if="hasSearched || loadingChassis"
      class="results-card mt-4"
      elevation="2"
    >
      <v-card-title class="results-card-title d-flex align-center justify-space-between">
        <div>
          <div class="results-title">
            Search results
            <span v-if="activeQuery">
              for "<strong>{{ activeQuery }}</strong>"
            </span>
          </div>

          <div v-if="!loadingChassis && hasSearched && !localChassisResults.length" class="subtitle-2 mt-1 grey--text">
            No results found
          </div>
          <div v-if="loadingChassis" class="subtitle-2 mt-1">
            Searching...
          </div>
        </div>

        <div class="d-flex align-center results-actions">
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
          <v-divider vertical class="mx-3" />
          <div class="text-caption mr-3 grey--text">
            <span v-if="selectedRows.length">
              {{ selectedRows.length }} row{{ selectedRows.length === 1 ? '' : 's' }} selected
            </span>
            <span v-else>
              No row selected
            </span>
          </div>
        </div>
      </v-card-title>

      <v-divider />

      <v-card-text class="pa-0">
        <v-skeleton-loader v-if="loadingChassis" type="table" />

        <div v-else class="results-table-wrapper">
          <v-simple-table dense class="results-table">
            <thead>
              <tr>
                <!-- Checkbox header -->
                <th class="checkbox-header">
                  <v-checkbox
                    :input-value="allSelected"
                    @change="toggleSelectAll"
                    hide-details
                    density="compact"
                  />
                </th>

                <!-- Dynamic headers -->
                <th
                  v-for="h in dialogHeaders"
                  :key="h.value"
                  class="text-left"
                >
                  {{ h.text }}
                </th>

                <!-- Actions column -->
                <th class="text-center actions-header">Actions</th>
              </tr>
            </thead>

            <tbody>
              <!-- Empty state -->
              <tr v-if="!localChassisResults.length && hasSearched">
                <td :colspan="dialogHeaders.length + 2" class="text-center py-6 grey--text">
                  No items found for the current search.
                </td>
              </tr>

              <!-- Rows -->
              <tr
                v-for="(row, idx) in localChassisResults"
                :key="row.pk || row.chassisNumber || row.engineNumber || idx"
                class="result-row"
              >
                <!-- Row checkbox -->
                <td class="checkbox-cell">
                  <v-checkbox
                    :input-value="isSelected(row)"
                    @change="toggleRowSelection(row)"
                    hide-details
                    density="compact"
                  />
                </td>

                <!-- Data cells -->
                <td
                  v-for="h in dialogHeaders"
                  :key="h.value"
                  class="cell-text"
                >
                  {{ getValue(row, h.value) }}
                </td>

                <!-- Actions -->
                <td class="text-center actions-cell">
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

                  <!-- Inventory History (directly opens history component) -->
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

      <v-card-actions class="results-footer">
        <v-spacer />
        <div class="mr-4 text-caption grey--text" v-if="selectedRows.length">
          {{ selectedRows.length }} row{{ selectedRows.length === 1 ? '' : 's' }} selected
        </div>
      </v-card-actions>
    </v-card>

    <!-- Inventory History Dialog (opens directly on History click) -->
    <InventoryHistoryDialog
      v-if="true"
      v-model="historyDialogOpen"
      :invoiceNumber="historyInvoiceNumber"
      :chassisNumber="historyChassisNumber"
    />

    <!-- Edit dialog -->
    <v-dialog v-model="editDialog" persistent max-width="920px">
      <v-card>
        <v-card-title>
          Edit Inventory Item
          <v-spacer />
          <v-btn icon @click="closeEdit">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-card-title>

        <v-divider />

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
      engineQuery: '',        // engine search query
      _chassisTimer: null,
      _engineTimer: null,     // engine debounce timer
      engineDebounceMs: 420,
      loadingChassis: false,
      chassisResults: [],
      dialogOpen: false,      // kept for compatibility, no longer used
      hasSearched: false,     // to show "no results" / card

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

    // which query text to show in title
    activeQuery() {
      return this.chassisQuery || this.engineQuery || '';
    },

    // label showing whether user searched by chassis or engine
    searchModeLabel() {
      if (this.chassisQuery) return 'Chassis Number';
      if (this.engineQuery) return 'Engine Number';
      return 'Search';
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

    // debounce handler for engine search
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

    // search by engineNumber
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
.chassis-search-wrapper {
  background-color: #ffffff;
  height: 91vh;
  padding: 16px 20px;
  margin: 12px;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* ===== Page Header ===== */
.page-header {
  margin-bottom: 16px;
}

.page-title {
  font-size: 22px;
  font-weight: 700;
}

.page-subtitle {
  font-size: 13px;
  margin-top: 4px;
  color: #6b6b6b;
}

.header-chips {
  gap: 8px;
}

/* ===== Search Card ===== */
.search-card {
  border-radius: 12px;
}

.search-card-title {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  padding-bottom: 4px !important;
  font-weight: 600;
}

/* ===== Results Card / Table ===== */
.results-card {
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  max-height: calc(91vh - 160px);
}

.results-card-title {
  padding-top: 10px !important;
  padding-bottom: 10px !important;
}

.results-title {
  font-weight: 600;
  font-size: 16px;
}

.results-actions {
  gap: 8px;
}

.results-table-wrapper {
  max-height: calc(91vh - 260px);
  overflow: auto;
}

.results-table thead {
  background-color: #e3f2fd;
}

.results-table thead th {
  font-size: 12px;
  font-weight: 600;
  padding: 8px 12px;
  white-space: nowrap;
}

.checkbox-header,
.checkbox-cell {
  width: 48px;
  text-align: center;
}

.actions-header,
.actions-cell {
  width: 180px;
  white-space: nowrap;
}

.result-row:hover {
  background-color: #f5f7fb;
}

.cell-text {
  font-size: 13px;
  padding: 6px 12px;
}

/* Footer */
.results-footer {
  padding-top: 4px !important;
  padding-bottom: 8px !important;
}

/* Small screens */
@media (max-width: 960px) {
  .chassis-search-wrapper {
    padding: 12px;
    margin: 8px;
    height: auto;
  }

  .results-card {
    max-height: none;
  }

  .results-table-wrapper {
    max-height: none;
  }

  .page-header {
    flex-direction: column;
    align-items: flex-start !important;
    gap: 8px;
  }
}
</style>
