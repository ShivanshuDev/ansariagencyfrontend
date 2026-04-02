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

      <transition name="fade">
        <div v-if="loadingInvoices" key="invoice-skeleton" class="pa-4">
          <v-skeleton-loader
            type="table"
            class="elevation-1 rounded"
            :loading="true"
          />
        </div>
        <invoice-table
          v-else
          key="invoice-table"
          :headers="invoiceListHeaders"
          :rows="filteredInvoiceRows"
          v-model="selectedInvoices"
          :loading="loadingInvoices"
          @show-invoice="onShowInvoice"
        />
      </transition>

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
        { text: 'QTY', value: 'inventoryCount' },
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
        { text: 'Model Name', value: 'modelName' },
        { text: 'Category Name', value: 'categoryName' },
        { text: 'Color', value: 'color' },
        { text: 'Chassis Number', value: 'chassisNumber' },
        { text: 'Engine Number', value: 'engineNumber' },
        { text: 'Warehouse', value: 'warehouse' },
        { text: 'Source', value: 'source' },
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
    // === Filter dropdown options built from invoiceRows (plus nested items where it makes sense) ===
    uniqueInvoiceDates() {
      const src = this.invoiceRows || [];
      const dates = src.map(i => i.invoiceDate).filter(Boolean);
      return [...new Set(dates)].sort();
    },
    uniqueAddedBy() {
      const src = this.invoiceRows || [];
      const vals = src.map(i => i.addedBy).filter(Boolean);
      return [...new Set(vals)].sort();
    },
    uniqueModelNames() {
      const src = this.invoiceRows || [];
      const topLevel = src.map(i => i.modelName).filter(Boolean);
      const nested = src.flatMap(inv =>
        Array.isArray(inv.items) ? inv.items.map(it => it && it.modelName).filter(Boolean) : []
      );
      return [...new Set([...topLevel, ...nested])].sort();
    },
    uniqueStatus() {
      const src = this.invoiceRows || [];
      const topLevel = src.map(i => (i.status || '').toUpperCase()).filter(Boolean);
      const nested = src.flatMap(inv =>
        Array.isArray(inv.items) ? inv.items.map(it => (it && it.status ? String(it.status).toUpperCase() : '')).filter(Boolean) : []
      );
      return [...new Set([...topLevel, ...nested])].sort();
    },
    uniqueColors() {
      const src = this.invoiceRows || [];
      const topLevel = src.map(i => i.color).filter(Boolean);
      const nested = src.flatMap(inv =>
        Array.isArray(inv.items) ? inv.items.map(it => it && it.color).filter(Boolean) : []
      );
      return [...new Set([...topLevel, ...nested])].sort();
    },

    // (kept intact; operates on inventoryItems for other UI parts)
    filteredRows() {
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
     * Filter invoiceRows (the table's top-level invoices) by filter dialog + invoice/engine/general search.
     * Priority for search: invoice -> engine -> general
     * Filters apply on both invoice-level fields and nested items (when needed).
     */
    filteredInvoiceRows() {
      const rows = this.invoiceRows || [];

      // ----------------- APPLY FILTERS FIRST -----------------
      const f = this.appliedFilters || {};

      const toLowerArray = arr =>
        Array.isArray(arr) ? arr.map(v => (v == null ? '' : String(v).toLowerCase().trim())).filter(Boolean) : [];

      const filterInvoiceDates = toLowerArray(f.invoiceDate);
      const filterAddedBy      = toLowerArray(f.addedBy);
      const filterModelNames   = toLowerArray(f.modelName);
      const filterColors       = toLowerArray(f.color);
      const filterStatuses     = Array.isArray(f.status)
        ? f.status.map(s => String(s || '').toUpperCase().trim()).filter(Boolean)
        : [];

      const createdAtFrom = f.createdAtFrom != null ? Number(f.createdAtFrom) : null;
      const createdAtTo   = f.createdAtTo   != null ? Number(f.createdAtTo)   : null;

      // Helper: check if invoice matches picklist filters (invoice-level first; if blank, try nested items)
      const matchesPicklists = inv => {
        const invInvoiceDate = inv.invoiceDate == null ? '' : String(inv.invoiceDate).toLowerCase().trim();
        const invAddedBy     = inv.addedBy == null ? '' : String(inv.addedBy).toLowerCase().trim();
        const invModelName   = inv.modelName == null ? '' : String(inv.modelName).toLowerCase().trim();
        const invColor       = inv.color == null ? '' : String(inv.color).toLowerCase().trim();
        const invStatusU     = (inv.status || '').toUpperCase().trim();

        // date-range (createdAt) on invoice
        const createdMsRaw = inv.createdAt == null ? null : Number(inv.createdAt);
        const createdMs = this._normalizeEpochToMs(createdMsRaw);
        if ((createdAtFrom != null || createdAtTo != null)) {
          if (createdMs == null) return false;
          if (createdAtFrom != null && createdMs < createdAtFrom) return false;
          if (createdAtTo   != null && createdMs > createdAtTo)   return false;
        }

        // Quick pass: invoice-level properties must satisfy selected filters if present
        const quickPass =
          (!filterInvoiceDates.length || filterInvoiceDates.includes(invInvoiceDate)) &&
          (!filterAddedBy.length      || filterAddedBy.includes(invAddedBy)) &&
          (!filterModelNames.length   || filterModelNames.includes(invModelName)) &&
          (!filterColors.length       || filterColors.includes(invColor)) &&
          (!filterStatuses.length     || filterStatuses.includes(invStatusU));

        if (quickPass) return true;

        // If invoice-level didn’t match and any filter is set, try nested items as a fallback
        const anyFilterSelected =
          filterInvoiceDates.length || filterAddedBy.length || filterModelNames.length ||
          filterColors.length || filterStatuses.length || createdAtFrom != null || createdAtTo != null;

        if (!anyFilterSelected) return true; // no filters selected -> pass

        const items = Array.isArray(inv.items) ? inv.items : [];
        for (let i = 0; i < items.length; i++) {
          const it = items[i] || {};
          const mName = (it.modelName == null ? '' : String(it.modelName)).toLowerCase().trim();
          const color = (it.color == null ? '' : String(it.color)).toLowerCase().trim();
          const statU = (it.status ? String(it.status).toUpperCase().trim() : '');

          const ok =
            (!filterModelNames.length || filterModelNames.includes(mName)) &&
            (!filterColors.length     || filterColors.includes(color)) &&
            (!filterStatuses.length   || filterStatuses.includes(statU));

          if (ok) {
            // If the only remaining blockers were invoiceDate/addedBy (which don't live on items),
            // allow pass only when those filters aren’t set.
            const needsInvoiceLevelOnly =
              filterInvoiceDates.length || filterAddedBy.length;
            if (!needsInvoiceLevelOnly) return true;
          }
        }

        return false;
      };

      const filtered = rows.filter(inv => matchesPicklists(inv));

      // ----------------- THEN APPLY SEARCH (PRIORITY) -----------------
      const rawInvoiceQuery = (this.searchInvoice || '').toString().trim();
      const rawEngineQuery  = (this.searchEngine  || '').toString().trim();
      const rawGeneralQuery = (this.searchGeneral || '').toString().trim();

      let query = '';
      if (rawInvoiceQuery) query = rawInvoiceQuery;
      else if (rawEngineQuery) query = rawEngineQuery;
      else if (rawGeneralQuery) query = rawGeneralQuery;

      const q = query ? query.toLowerCase() : '';

      if (!q) return filtered;

      const invoiceLevelFields = [
        'invoiceNumber', 'invoiceNo', 'number', 'invoiceDate',
        'addedBy', 'modelName', 'color', 'pk', 'sk', 'status'
      ];

      const out = [];
      for (let i = 0; i < filtered.length; i++) {
        const inv = filtered[i];
        let matched = false;

        // invoice-level fields
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
        if (matched) { out.push(inv); continue; }

        // common alternates
        const alt = [inv && inv.invoiceNumber, inv && inv.invoiceNo, inv && inv.number, inv && inv.addedBy, inv && inv.modelName];
        for (let k = 0; k < alt.length && !matched; k++) {
          const v = alt[k];
          if (v != null && String(v).toLowerCase().includes(q)) matched = true;
        }
        if (matched) { out.push(inv); continue; }

        // nested arrays (items/inventory/rows)
        const nestedKeys = ['items', 'inventory', 'rows'];
        for (let nk = 0; nk < nestedKeys.length && !matched; nk++) {
          const key = nestedKeys[nk];
          const arr = inv && inv[key];
          if (!Array.isArray(arr) || !arr.length) continue;
          for (let a = 0; a < arr.length && !matched; a++) {
            const it = arr[a];
            if (!it) continue;
            const candidates = [
              it.chassisNumber, it.engineNumber, it.modelName, it.color,
              it.invoiceNumber, it.invoiceNo, it.number
            ];
            for (let c = 0; c < candidates.length; c++) {
              const cand = candidates[c];
              if (cand != null && String(cand).toLowerCase().includes(q)) {
                matched = true;
                break;
              }
            }
          }
        }
        if (matched) out.push(inv);
      }

      return out;
    },
  },

  methods: {
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
      if (n < 1e12) return n * 1000; // seconds -> ms
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
  margin:12px;
}
.tableData .v-card-title {
  align-items: center;
}
.fade-enter-active, .fade-leave-active { transition: opacity .15s ease; }
.fade-enter, .fade-leave-to { opacity: 0; }

</style>
