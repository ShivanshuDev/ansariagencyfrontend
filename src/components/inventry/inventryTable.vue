<template>
  <div class="tableData">
    <v-card>
      <v-card-title>
        Inventory - Invoices
        <v-spacer />
      </v-card-title>

      <TopBar
        :invoice-search="searchInvoice"
        :engine-search="searchEngine"
        :general-search="searchGeneral"
        :selected-items-data="selectedItemsData"
        :invoice-detail-headers="invoiceDetailHeaders"
        :loading-selected-invoices="loadingSelectedInvoices"
        @search-invoice="searchInvoice = $event"
        @search-engine="searchEngine = $event"
        @search-general="searchGeneral = $event"
        @open-filter="filterDialog = true"
      />

      <invoice-table
        :headers="invoiceListHeaders"
        :rows="filteredInvoiceRows"
        v-model="selectedInvoices"
        :loading="loadingInvoices"
        @show-invoice="onShowInvoice"
      />

      <v-divider class="my-4"></v-divider>
    </v-card>

    <!-- Filter dialog -->
    <filter-dialog
      :open="filterDialog"
      :filters="filters"
      :unique-invoice-dates="uniqueInvoiceDates"
      :unique-added-by="uniqueAddedBy"
      :unique-model-names="uniqueModelNames"
      :unique-status="uniqueStatus"
      :unique-colors="uniqueColors"
      @apply="onFilterApply"
      @reset="onFilterReset"
      @close="filterDialog = false"
    />

    <!-- Invoice detail -->
    <invoice-detail-dialog
      :open="invoiceDetailDialog"
      :invoice="selectedInvoice"
      :items="selectedInvoiceItems"
      :invoice-detail-headers="headers"
      :selected-items-data="selectedItemsData"
      :loading="loadingInvoiceItems"
      :invoice-items-per-page="invoiceItemsPerPage"
      @close="invoiceDetailDialog = false"
      @row-click="onRowClick"
      @downloaded="onDownloaded"
      @update:selected="val => selectedItemsData = val"
    />

    <!-- item detail -->
    <item-detail-dialog
      :open="detailDialog"
      :item="selectedItem"
      @close="closeDetail"
      @edit="openEdit"
      @open-document="openDocument"
    />

    <!-- edit dialog uses your existing EditInventory component -->
    <v-dialog v-model="editDialog" max-width="920px">
      <v-card>
        <v-card-title>
          Edit Inventory Item
          <v-spacer />
          <v-btn icon @click="closeEdit">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-card-title>
        <v-card-text>
          <edit-inventory
            v-if="selectedItem"
            :item="selectedItem"
            @saved="onInventorySaved"
            @cancel="closeEdit"
          />
        </v-card-text>
      </v-card>
    </v-dialog>
  </div>
</template>

<script>
import axios from 'axios';
import EditInventory from './EditInventory.vue';
import TopBar from './TopBar.vue';
import InvoiceTable from './InvoiceTable.vue';
import FilterDialog from './FilterDialog.vue';
import InvoiceDetailDialog from './InvoiceDetailDialog.vue';
import ItemDetailDialog from './ItemDetailDialog.vue';

export default {
  name: 'InventoryTabs',
  components: { EditInventory, TopBar, InvoiceTable, FilterDialog, InvoiceDetailDialog, ItemDetailDialog },

  data() {
    return {
      invoiceItemsPerPage: 10,
      selectedItemsData: [],
      inventoryItems: [],
      invoiceRows: [],
      search: '',
      selectedStatus: 'ALL',
      searchInvoice: '',
      searchEngine: '',
      searchGeneral: '',

      invoiceListHeaders: [
        { text: 'Invoice Number', value: 'invoiceNumber' },
        { text: 'Invoice Date', value: 'invoiceDate' },
        { text: 'Actions', value: 'actions', sortable: false },
      ],

      invoiceDetailHeaders: [
        { text: 'Chassis Number', value: 'chassisNumber' },
        { text: 'Engine Number', value: 'engineNumber' },
        { text: 'Category Name', value: 'categoryName' },
        { text: 'Model Name', value: 'modelName' },
        { text: 'Color', value: 'color' },
        { text: 'Hold By Days', value: 'inventoryHoldDays' },
        { text: 'Added Date', value: 'createdAt' },
        { text: 'Status', value: 'status' },
      ],

      headers: [
        { text: 'Invoice Number', value: 'invoiceNumber' },
        { text: 'Invoice Date', value: 'invoiceDate' },
        { text: 'Model Name', value: 'modelName' },
        { text: 'Color', value: 'color' },
        { text: 'Chassis Number', value: 'chassisNumber' },
        { text: 'Engine Number', value: 'engineNumber' },
        { text: 'Warehouse', value: 'warehouse' },
        { text: 'Added By', value: 'addedBy' },
        { text: 'Status', value: 'status' },
      ],

      tabs: [
        { text: 'All', value: 'ALL' },
        { text: 'Draft', value: 'DRAFT' },
        { text: 'Active', value: 'ACTIVE' },
        { text: 'Inactive', value: 'INACTIVE' },
        { text: 'Under Review', value: 'REVIEW' },
        { text: 'Sold', value: 'SOLD' },
      ],

      invoiceDetailDialog: false,
      selectedInvoice: null,
      selectedInvoiceItems: [],

      detailDialog: false,
      selectedItem: null,
      editDialog: false,

      loadingInvoices: false,
      loadingInvoiceItems: false,
      loadingSelectedInvoices: false,

      selectedInvoices: [],

      filterDialog: false,
      filters: {
        invoiceDate: [],
        addedBy: [],
        modelName: [],
        status: [],
        color: [],
        createdAtFromDate: '',
        createdAtToDate: '',
      },

      appliedFilters: {
        invoiceDate: [],
        addedBy: [],
        modelName: [],
        status: [],
        color: [],
        createdAtFrom: null,
        createdAtTo: null,
      },

      // For internal use (selectedInvoicesItems)
      selectedInvoicesItems: [],
    };
  },

  computed: {
    uniqueInvoiceDates() {
      const dates = this.inventoryItems.map(i => i.invoiceDate).filter(Boolean);
      return [...new Set(dates)].sort();
    },
    uniqueAddedBy() {
      const vals = this.inventoryItems.map(i => i.addedBy).filter(Boolean);
      return [...new Set(vals)].sort();
    },
    uniqueModelNames() {
      const vals = this.inventoryItems.map(i => i.modelName).filter(Boolean);
      return [...new Set(vals)].sort();
    },
    uniqueStatus() {
      const vals = this.inventoryItems.map(i => (i.status || '').toUpperCase()).filter(s => s);
      return [...new Set(vals)].sort();
    },
    uniqueColors() {
      const vals = this.inventoryItems.map(i => i.color).filter(Boolean);
      return [...new Set(vals)].sort();
    },

    filteredRows() {
      // (existing filteredRows kept intact for other UI parts that rely on inventoryItems)
      const searchLower = this.search ? String(this.search).toLowerCase() : '';

      let selectedRaw = 'ALL';
      if (this.selectedStatus != null) {
        if (Array.isArray(this.tabs) && Number.isInteger(this.selectedStatus) && this.tabs[this.selectedStatus]) {
          selectedRaw = this.tabs[this.selectedStatus].value || 'ALL';
        } else {
          selectedRaw = this.selectedStatus;
        }
      }
      const selected = String(selectedRaw || 'ALL').toUpperCase().trim();

      const filters = this.appliedFilters || {};

      const toArray = v => {
        if (v == null) return [];
        if (Array.isArray(v)) return v.map(x => (x == null ? '' : String(x).toLowerCase()));
        return [String(v).toLowerCase()];
      };

      const invoiceDateFilter = toArray(filters.invoiceDate);
      const addedByFilter = toArray(filters.addedBy);
      const modelNameFilter = toArray(filters.modelName);
      const statusFilter = toArray(filters.status).map(s => (s || '').toUpperCase().trim());
      const colorFilter = toArray(filters.color);
      const warehouseFilter = toArray(filters.warehouse);

      const createdAtFrom = filters.createdAtFrom != null ? Number(filters.createdAtFrom) : null;
      const createdAtTo = filters.createdAtTo != null ? Number(filters.createdAtTo) : null;

      return (this.inventoryItems || []).filter(item => {
        const itemStatusRaw = item.status || '';
        const itemStatus = String(itemStatusRaw).toUpperCase().trim();
        const itemInvoiceDate = item.invoiceDate == null ? '' : String(item.invoiceDate);
        const itemAddedBy = item.addedBy == null ? '' : String(item.addedBy);
        const itemModelName = item.modelName == null ? '' : String(item.modelName);
        const itemColor = item.color == null ? '' : String(item.color);
        const itemWarehouse = item.warehouse == null ? '' : String(item.warehouse);

        if (selected !== 'ALL' && itemStatus !== selected) return false;

        if (invoiceDateFilter.length && !invoiceDateFilter.includes(itemInvoiceDate.toLowerCase())) return false;
        if (addedByFilter.length && !addedByFilter.includes(itemAddedBy.toLowerCase())) return false;
        if (modelNameFilter.length && !modelNameFilter.includes(itemModelName.toLowerCase())) return false;

        if (statusFilter.length) {
          if (!statusFilter.includes(itemStatus)) return false;
        }

        if (colorFilter.length && !colorFilter.includes(itemColor.toLowerCase())) return false;
        if (warehouseFilter.length && !warehouseFilter.includes(itemWarehouse.toLowerCase())) return false;

        const itemCreatedRaw = item.createdAt == null ? null : Number(item.createdAt);
        const itemCreatedMs = this._normalizeEpochToMs(itemCreatedRaw);

        if ((createdAtFrom != null || createdAtTo != null) && itemCreatedMs == null) return false;
        if (createdAtFrom != null && itemCreatedMs != null && itemCreatedMs < createdAtFrom) return false;
        if (createdAtTo != null && itemCreatedMs != null && itemCreatedMs > createdAtTo) return false;

        if (searchLower) {
          const fields = [
            item.invoiceNumber,
            item.invoiceDate,
            item.chassisNumber,
            item.engineNumber,
            item.modelName,
            item.color,
            item.addedBy,
            item.status,
            item.pk,
            item.sk
          ];
          const found = fields.some(f => f != null && String(f).toLowerCase().includes(searchLower));
          if (!found) return false;
        }

        return true;
      });
    },

    /**
     * Filter invoiceRows (the table's top-level invoices) by invoice / engine / general search.
     * Priority: searchInvoice -> searchEngine -> searchGeneral
     * Also attempts to match nested `items` arrays for chassis/engine numbers.
     */
    filteredInvoiceRows() {
      const rawInvoiceQuery = (this.searchInvoice || '').toString().trim();
      const rawEngineQuery = (this.searchEngine || '').toString().trim();
      const rawGeneralQuery = (this.searchGeneral || '').toString().trim();

      // choose the highest-priority non-empty query
      let query = '';
      if (rawInvoiceQuery) query = rawInvoiceQuery;
      else if (rawEngineQuery) query = rawEngineQuery;
      else if (rawGeneralQuery) query = rawGeneralQuery;

      const q = query ? query.toLowerCase() : '';

      // no query -> return original rows (fast path)
      if (!q) return this.invoiceRows || [];

      // fields to search at invoice level
      const invoiceLevelFields = ['invoiceNumber', 'invoiceNo', 'number', 'invoiceDate', 'addedBy', 'modelName', 'color', 'pk', 'sk', 'status'];

      // iterate once per invoice row
      const rows = this.invoiceRows || [];
      const out = [];

      for (let i = 0; i < rows.length; i++) {
        const inv = rows[i];
        let matched = false;

        // check invoice-level fields
        for (let j = 0; j < invoiceLevelFields.length; j++) {
          const f = invoiceLevelFields[j];
          if (inv && Object.prototype.hasOwnProperty.call(inv, f)) {
            const val = inv[f];
            if (val != null && String(val).toLowerCase().includes(q)) {
              matched = true;
              break;
            }
          }
        }

        if (matched) {
          out.push(inv);
          continue;
        }

        // check common top-level text fields that may exist but with different keys
        const altCandidates = [inv && inv.invoiceNumber, inv && inv.invoiceNo, inv && inv.number, inv && inv.addedBy, inv && inv.modelName];
        for (let k = 0; k < altCandidates.length && !matched; k++) {
          const v = altCandidates[k];
          if (v != null && String(v).toLowerCase().includes(q)) matched = true;
        }
        if (matched) {
          out.push(inv);
          continue;
        }

        // If invoice contains nested `items` array, check each item's chassisNumber/engineNumber/modelName/color
        if (Array.isArray(inv && inv.items) && inv.items.length) {
          const items = inv.items;
          for (let it = 0; it < items.length && !matched; it++) {
            const item = items[it];
            if (!item) continue;
            const potential = [
              item.chassisNumber,
              item.engineNumber,
              item.modelName,
              item.color,
              item.invoiceNumber,
              item.invoiceNo,
              item.number
            ];
            for (let p = 0; p < potential.length; p++) {
              const pv = potential[p];
              if (pv != null && String(pv).toLowerCase().includes(q)) {
                matched = true;
                break;
              }
            }
          }
          if (matched) {
            out.push(inv);
            continue;
          }
        }

        // As a last attempt: some API responses may put inventory items under `inventory` or `rows`
        const nestedKeys = ['inventory', 'rows', 'items'];
        for (let nk = 0; nk < nestedKeys.length && !matched; nk++) {
          const key = nestedKeys[nk];
          const arr = inv && inv[key];
          if (!Array.isArray(arr) || !arr.length) continue;
          for (let a = 0; a < arr.length && !matched; a++) {
            const it = arr[a];
            if (!it) continue;
            const candidates = [it.chassisNumber, it.engineNumber, it.modelName, it.color];
            for (let c = 0; c < candidates.length; c++) {
              const cand = candidates[c];
              if (cand != null && String(cand).toLowerCase().includes(q)) {
                matched = true;
                break;
              }
            }
          }
          if (matched) {
            out.push(inv);
            break;
          }
        }
      }

      return out;
    },
  },

  methods: {
    // --- Fetch invoices (existing) ---
    // async fetchInvoice() {
    //   this.loadingInvoices = true;
    //   try {
    //     const res = await axios.get(process.env.VUE_APP_AGENCY_BACKEND_URL + 'getAllInvoice');
    //     if (res && res.data) {
    //       if (Array.isArray(res.data)) this.invoiceRows = res.data;
    //       else if (Array.isArray(res.data.items)) this.invoiceRows = res.data.items;
    //       else if (Array.isArray(res.data.rows)) this.invoiceRows = res.data.rows;
    //       else if (Array.isArray(res.data.invoices)) this.invoiceRows = res.data.invoices;
    //       else this.invoiceRows = [];
    //     } else {
    //       this.invoiceRows = [];
    //     }
    //   } catch (err) {
    //     console.error('Failed to fetch invoices:', err);
    //     this.invoiceRows = [];
    //   } finally {
    //     this.loadingInvoices = false;
    //   }
    // },

    async fetchInvoice() {
      this.loadingInvoices = true;
      try {
        const res = await axios.get(process.env.VUE_APP_AGENCY_BACKEND_URL + 'getAllInvoice');
        let rows = [];

        if (res && res.data) {
          if (Array.isArray(res.data)) rows = res.data;
          else if (Array.isArray(res.data.items)) rows = res.data.items;
          else if (Array.isArray(res.data.rows)) rows = res.data.rows;
          else if (Array.isArray(res.data.invoices)) rows = res.data.invoices;
        }

        // ✅ sort by createdAt (latest first)
        this.invoiceRows = (rows || []).slice().sort((a, b) => {
          const aTime = Number(a.createdAt) || 0;
          const bTime = Number(b.createdAt) || 0;
          return bTime - aTime; // descending
        });
      } catch (err) {
        console.error('Failed to fetch invoices:', err);
        this.invoiceRows = [];
      } finally {
        this.loadingInvoices = false;
      }
    },


    // --- Fetch inventory records for a single invoice number (used by Show) ---
    async fetchInvoiceItems(invoiceNumber) {
      this.selectedItemsData = [];
      this.loadingInvoiceItems = true;
      this.selectedInvoiceItems = [];
      try {
        const res = await axios.get(process.env.VUE_APP_AGENCY_BACKEND_URL + 'getAllInventryByInvoice/' + encodeURIComponent(invoiceNumber));
        if (res && res.data) {
          if (Array.isArray(res.data)) this.selectedInvoiceItems = res.data;
          else if (Array.isArray(res.data.items)) this.selectedInvoiceItems = res.data.items;
          else if (Array.isArray(res.data.rows)) this.selectedInvoiceItems = res.data.rows;
          else if (Array.isArray(res.data.inventory)) this.selectedInvoiceItems = res.data.inventory;
          else this.selectedInvoiceItems = [];
        } else {
          this.selectedInvoiceItems = [];
        }

        // enrich with inventoryHoldDays and ensure invoiceNumber present
        const now = Date.now();
        this.selectedInvoiceItems = (this.selectedInvoiceItems || []).map(it => {
          const createdMs = this._normalizeEpochToMs(it.createdAt);
          const days = createdMs != null ? Math.floor(Math.max(0, now - createdMs) / (1000 * 60 * 60 * 24)) : '';
          return {
            ...it,
            invoiceNumber: it.invoiceNumber || it.invoiceNo || it.number || this.selectedInvoice?.invoiceNumber || '',
            inventoryHoldDays: days,
          };
        });

        // ensure header exists so dialog table shows hold days
        this._ensureInventoryHoldHeaderExists();

        // pre-populate selectedItemsData so download btns inside dialog work
        this.selectedItemsData = [];
      } catch (err) {
        console.error('Failed to fetch invoice items for', invoiceNumber, err);
        this.selectedInvoiceItems = [];
        this.selectedItemsData = [];
      } finally {
        this.loadingInvoiceItems = false;
      }
    },

    // When user clicks "Show" on invoice - fetch related inventory items and show dialog
    onShowInvoice(invoice) {
      this.selectedItemsData = [];
      if (!invoice) return;
      this.selectedInvoice = invoice;

      const invNum = invoice.invoiceNumber || invoice.invoiceNo || invoice.number || '';
      if (!invNum) {
        this.selectedInvoiceItems = [];
        this.invoiceDetailDialog = true;
        return;
      }

      // Fetch then open dialog
      this.fetchInvoiceItems(invNum).then(() => {
        this.invoiceDetailDialog = true;
      }).catch(() => {
        this.invoiceDetailDialog = true;
      });
    },

    onRowClick(item) {
      if (!item) return;
      this.selectedItem = item;
      this.detailDialog = true;
    },

    closeDetail() {
      this.detailDialog = false;
      this.$nextTick(() => { this.selectedItem = null; });
    },

    openEdit() {
      if (!this.selectedItem) return;
      this.editDialog = true;
    },

    closeEdit() {
      this.editDialog = false;
    },

    async onInventorySaved(payload) {
      this.closeEdit();
      // after save, optionally re-fetch invoices
      await this.fetchInvoice();
      let updated = null;
      if (payload && payload.item) updated = payload.item;
      else if (payload && payload.updated) updated = payload.updated;
      else if (payload && payload.data) updated = payload.data;

      if (updated) {
        this.selectedItem = updated;
        this.detailDialog = true;
        return;
      }
      this.detailDialog = true;
    },

    openDocument(doc) {
      if (doc && doc.url) window.open(doc.url, '_blank');
      else console.warn('No document url provided', doc);
    },

    _normalizeEpochToMs(v) {
      if (v == null || Number.isNaN(Number(v))) return null;
      const n = Number(v);
      // if seconds (10-digit) -> convert to ms
      if (n < 1e12) return n * 1000;
      return n;
    },

    onFilterApply(payload) {
      this.filters = payload || {};
      const fromDateStr = (this.filters.createdAtFromDate || '').trim();
      const toDateStr = (this.filters.createdAtToDate || '').trim();
      let fromEpoch = null;
      let toEpoch = null;
      if (fromDateStr) {
        const d = new Date(fromDateStr + 'T00:00:00');
        fromEpoch = d.getTime();
      }
      if (toDateStr) {
        const d2 = new Date(toDateStr + 'T23:59:59.999');
        toEpoch = d2.getTime();
      }
      this.appliedFilters = JSON.parse(JSON.stringify(this.filters || {}));
      this.appliedFilters.createdAtFrom = fromEpoch;
      this.appliedFilters.createdAtTo = toEpoch;
      this.filterDialog = false;
    },

    onFilterReset() {
      this.resetFilters();
      this.filterDialog = false;
    },

    resetFilters() {
      this.filters = {
        invoiceDate: [],
        addedBy: [],
        modelName: [],
        status: [],
        color: [],
        createdAtFromDate: '',
        createdAtToDate: '',
      };
      this.appliedFilters = {
        invoiceDate: [],
        addedBy: [],
        modelName: [],
        status: [],
        color: [],
        createdAtFrom: null,
        createdAtTo: null,
      };
    },

    // ----------------- Selection logic -----------------
    async onSelectedInvoicesChange() {
      if (!this.selectedInvoices || !this.selectedInvoices.length) {
        this.selectedInvoicesItems = [];
        this.selectedItemsData = [];
        return;
      }
      await this.fetchInventoriesForSelectedInvoices(this.selectedInvoices);
    },

    async fetchInventoriesForSelectedInvoices(invoices = []) {
      if (!Array.isArray(invoices) || invoices.length === 0) {
        this.selectedInvoicesItems = [];
        this.selectedItemsData = [];
        return;
      }

      this.loadingSelectedInvoices = true;
      try {
        const invoiceNumbers = invoices.map(inv => inv.invoiceNumber || inv.invoiceNo || inv.number || '').filter(Boolean);
        if (!invoiceNumbers.length) {
          this.selectedInvoicesItems = [];
          this.selectedItemsData = [];
          return;
        }

        // parallel calls
        const requests = invoiceNumbers.map(invNum =>
          axios.get(process.env.VUE_APP_AGENCY_BACKEND_URL + 'getAllInventryByInvoice/' + encodeURIComponent(invNum))
        );

        const settled = await Promise.allSettled(requests);

        const allItems = [];
        for (let i = 0; i < settled.length; ++i) {
          const res = settled[i];
          if (res.status === 'fulfilled' && res.value && res.value.data) {
            const d = res.value.data;
            if (Array.isArray(d)) allItems.push(...d);
            else if (Array.isArray(d.items)) allItems.push(...d.items);
            else if (Array.isArray(d.rows)) allItems.push(...d.rows);
            else if (Array.isArray(d.inventory)) allItems.push(...d.inventory);
          } else {
            console.warn('Failed to load invoice items for', invoiceNumbers[i], settled[i].reason || settled[i].value);
          }
        }

        const now = Date.now();
        const enriched = allItems.map(item => {
          const createdMs = this._normalizeEpochToMs(item.createdAt);
          const days = createdMs != null ? Math.floor(Math.max(0, now - createdMs) / (1000 * 60 * 60 * 24)) : '';
          const invNum = item.invoiceNumber || item.invoiceNo || item.number || '';
          return {
            ...item,
            invoiceNumber: invNum,
            inventoryHoldDays: days,
          };
        });

        this.selectedInvoicesItems = enriched;
        this.selectedItemsData = JSON.parse(JSON.stringify(enriched));

        this._ensureInventoryHoldHeaderExists();
      } finally {
        this.loadingSelectedInvoices = false;
      }
    },

    _ensureInventoryHoldHeaderExists() {
      const exists = this.invoiceDetailHeaders.some(h => h.value === 'inventoryHoldDays');
      if (!exists) {
        const headerObj = { text: 'Inventory hold by days', value: 'inventoryHoldDays' };
        const idx = this.invoiceDetailHeaders.findIndex(h => h.value === 'createdAt');
        if (idx >= 0) this.invoiceDetailHeaders.splice(idx + 1, 0, headerObj);
        else this.invoiceDetailHeaders.push(headerObj);
      }
    },

    onDownloaded() {
      // optional hook after download
    }
  },

  watch: {
    selectedInvoices: {
      handler() {
        this.onSelectedInvoicesChange();
      },
      deep: true
    }
  },

  mounted() {
    this.fetchInvoice();
  }
};
</script>

<style scoped>
.tableData{
  margin:20px;
}
.tableData .v-card-title {
  align-items: center;
}
</style>
