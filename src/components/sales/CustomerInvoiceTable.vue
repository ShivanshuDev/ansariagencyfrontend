<template>
  <v-card style="margin:10px;" class="rounded invoice-card">
    <v-toolbar flat class="elevate-0 toolbar-glass">
      <v-toolbar-title v-if="!showAddCustomer" class="subtitle-1 font-weight-bold">
        Customer Invoice — Bills
      </v-toolbar-title>
      <div v-if="showAddCustomer">
          <v-icon left style="width:40px; height:40px; border:1px solid black; border-radius:50%;"  @click="backToTable()">mdi-arrow-left</v-icon>
      </div>

      <v-spacer/>

      <!-- Bulk actions (enabled when at least one row is selected) -->
      <v-btn small class="ml-2 btn-primary" :disabled="!selected.length" @click="downloadSelectedAsPDF">
        <v-icon left small>mdi-file-pdf-box</v-icon> Download PDF
      </v-btn>
      <v-btn small class="ml-2 btn-success" :disabled="!selected.length" @click="downloadSelectedAsExcel">
        <v-icon left small>mdi-file-excel-box</v-icon> Download Excel
      </v-btn>

      <v-spacer/>

      <v-text-field
        v-model="filters.global"
        dense hide-details clearable outlined
        prepend-inner-icon="mdi-magnify"
        label="Global search"
        class="input-compact"
      />

      <!-- Columns Picker button (before Refresh) -->
      <v-btn v-if="!showAddCustomer" small class="ml-2 btn-soft" @click="columnsDialog = true" :title="'Choose columns'">
        <v-icon left small>mdi-view-column</v-icon> Columns
      </v-btn>

      <v-btn v-if="!showAddCustomer" small class="ml-2 btn-soft" :loading="loading" @click="fetchRows(true)">
        <v-icon left small>mdi-refresh</v-icon>Refresh
      </v-btn>
      <v-btn v-if="!showAddCustomer" small class="ml-2 btn-outline" @click="resetFilters">
        <v-icon left small>mdi-filter-remove</v-icon>Clear
      </v-btn>
      <v-btn v-if="!showAddCustomer"  @click="showAddCustomerFunction()" small class="ml-2 btn-outline">
        <v-icon left small>mdi-library-plus</v-icon>New Sell
      </v-btn>
    </v-toolbar>

    <!-- Columns dialog -->
    <v-dialog v-if="!showAddCustomer" v-model="columnsDialog" max-width="520px" persistent>
      <v-card>
        <v-toolbar flat dense>
          <v-toolbar-title>Show / Hide Columns</v-toolbar-title>
          <v-spacer/>
          <v-btn icon @click="columnsDialog = false"><v-icon>mdi-close</v-icon></v-btn>
        </v-toolbar>

        <v-card-text>
          <div class="mb-3 d-flex justify-space-between align-center">
            <div class="caption">Toggle columns to show them in the table</div>
            <div>
              <v-btn small text @click="selectAllColumns">Select All</v-btn>
              <v-btn small text @click="resetColumnVisibility">Reset</v-btn>
            </div>
          </div>

          <v-row>
            <v-col cols="12">
              <v-simple-table dense>
                <tbody>
                  <tr v-for="(h, idx) in headers" :key="h.value">
                    <td style="width: 40px; vertical-align: middle;">
                      <v-checkbox
                        dense
                        :input-value="columnVisibility[h.value]"
                        @change="(v) => toggleColumn(h.value, v)"
                        hide-details
                        :aria-label="`Toggle ${h.text}`"
                      />
                    </td>
                    <td>
                      <div class="font-weight-medium">{{ h.text }}</div>
                      <div class="caption grey--text">{{ h.value }}</div>
                    </td>
                    <td class="text-right grey--text caption" style="width:120px">
                      <span v-if="defaultVisibility[h.value] === false">(hidden by default)</span>
                    </td>
                  </tr>
                </tbody>
              </v-simple-table>
            </v-col>
          </v-row>
        </v-card-text>

        <v-card-actions class="justify-end">
          <v-btn text @click="columnsDialog = false">Close</v-btn>
          <v-btn color="primary" @click="applyColumns">Apply</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-data-table v-if="!showAddCustomer" 
      :headers="visibleHeaders"
      :items="rows"
      :items-per-page="options.itemsPerPage"
      :page.sync="options.page"
      :options.sync="options"
      :server-items-length="total"
      :loading="loading"
      item-key="invoiceNumber"
      class="elevation-0 modern-table"
      dense
      show-select
      v-model="selected"
    >
      <!-- Sticky header with column filters -->
      <template v-slot:header="{ props }">
        <thead class="sticky-header">
          <tr>
            <!-- selection checkbox column comes from show-select -->
            <th v-for="h in props.headers" :key="h.value" :class="['text-start', h.class]">
              <div class="th-title">{{ h.text }}</div>

              <div v-if="h.value === 'invoiceNumber'" class="mt-1">
                <v-text-field v-model="filters.billNumber" dense hide-details clearable outlined placeholder="Search" class="input-compact"/>
              </div>

              <div v-else-if="h.value === 'invoiceDateISO'" class="mt-1">
                <v-menu v-model="dateMenu" :close-on-content-click="false" offset-y>
                  <template v-slot:activator="{ on, attrs }">
                    <v-text-field
                      v-bind="attrs" v-on="on"
                      :value="filters.date || ''"
                      dense hide-details clearable outlined
                      placeholder="Select Date"
                      @click:clear="filters.date = null"
                      prepend-inner-icon="mdi-calendar-month-outline"
                      class="input-compact"
                    />
                  </template>
                  <v-date-picker v-model="datePicker" @input="applyDate" scrollable />
                </v-menu>
              </div>

              <div v-else-if="h.value === 'model'" class="mt-1">
                <v-text-field v-model="filters.model" dense hide-details clearable outlined placeholder="Search" class="input-compact"/>
              </div>

              <div v-else-if="h.value === 'color'" class="mt-1">
                <v-text-field v-model="filters.color" dense hide-details clearable outlined placeholder="Search" class="input-compact"/>
              </div>

              <div v-else-if="h.value === 'status'" class="mt-1">
                <v-select
                  v-model="filters.status" dense hide-details clearable outlined
                  :items="statusItems" placeholder="Select"
                  class="input-compact"
                />
              </div>

              <div v-else-if="h.value === 'salesMode'" class="mt-1">
                <v-text-field v-model="filters.salesMode" dense hide-details clearable outlined placeholder="Search" class="input-compact"/>
              </div>

              <div v-else-if="h.value === 'qty'" class="mt-1">
                <v-text-field v-model="filters.qty" dense hide-details clearable outlined placeholder="Search" type="number" class="input-compact"/>
              </div>

              <div v-else-if="h.value === 'customerName'" class="mt-1">
                <v-text-field v-model="filters.name" dense hide-details clearable outlined placeholder="Search" class="input-compact"/>
              </div>

              <div v-else-if="h.value === 'ownerType'" class="mt-1">
                <v-select
                  v-model="filters.ownerType" dense hide-details clearable outlined
                  :items="ownerTypeItems" placeholder="Search"
                  class="input-compact"
                />
              </div>

              <div v-else-if="h.value === 'phone'" class="mt-1">
                <v-text-field v-model="filters.phone" dense hide-details clearable outlined placeholder="Search" class="input-compact"/>
              </div>

              <div v-else class="mt-1"/>
            </th>
          </tr>
        </thead>
      </template>

      <!-- Serial number column -->
      <template v-slot:item.sn="{ index }">
        <span class="mono grey--text text--darken-2">
          {{ ((options.page - 1) * options.itemsPerPage) + index + 1 }}
        </span>
      </template>

      <!-- Row cells -->
      <template v-slot:item.invoiceNumber="{ item }">
        <span class="font-weight-medium">{{ item.invoiceNumber }}</span>
      </template>

      <template v-slot:item.invoiceDateISO="{ item }">
        <div class="d-flex align-center">
          <v-chip v-if="relativeDay(item.invoiceDateISO)" small class="mr-1 chip-soft">
            <v-icon small class="mr-1">mdi-clock-outline</v-icon>
            {{ relativeDay(item.invoiceDateISO) }}
          </v-chip>
          <span v-else>{{ displayDate(item.invoiceDateISO) }}</span>
        </div>
      </template>

      <template v-slot:item.status="{ item }">
        <a href="javascript:void(0)" class="text--primary font-weight-medium" @click="$emit('status-click', item)">
          {{ (item.status || '').toUpperCase() }}
        </a>
      </template>

      <template v-slot:item.customerName="{ item }">
        <div class="text-truncate" style="max-width:240px">{{ item.customer?.name || '-' }}</div>
      </template>

      <template v-slot:item.ownerType="{ item }">
        {{ prettyOwnerType(item.ownerType) }}
      </template>

      <template v-slot:item.phone="{ item }">
        <span>{{ item.customer?.phone || item.phone || '-' }}</span>
      </template>

      <!-- Actions column - ICONS ONLY -->
      <template v-slot:item.actions="{ item }">
        <div class="d-flex align-center">
          <v-tooltip bottom>
            <template v-slot:activator="{ on, attrs }">
              <v-btn icon small class="mr-1 btn-primary" v-bind="attrs" v-on="on" @click="$emit('send-mail', item)">
                <v-icon small>mdi-email-send-outline</v-icon>
              </v-btn>
            </template>
            <span>Send Mail</span>
          </v-tooltip>

          <v-tooltip bottom>
            <template v-slot:activator="{ on, attrs }">
              <v-btn icon small class="btn-outline" v-bind="attrs" v-on="on" @click="openDetails(item)">
                <v-icon small>mdi-eye-outline</v-icon>
              </v-btn>
            </template>
            <span>Show Details</span>
          </v-tooltip>
        </div>
      </template>

      <template v-slot:no-data>
        <div class="pa-6 grey--text text--darken-1">
          No invoices found. Try adjusting filters.
        </div>
      </template>
    </v-data-table>

    <!-- ============== DETAILS DIALOG ============== -->
    <v-dialog v-if="!showAddCustomer" v-model="detailsOpen" persistent max-width="1040px" scrollable>
      <v-card class="rounded-xl details-card">
        <v-toolbar flat class="details-toolbar">
          <div class="d-flex align-center">
            <v-avatar size="40" class="mr-3 soft-avatar">
              <v-icon>mdi-receipt-text</v-icon>
            </v-avatar>
            <div>
              <div class="text-sm text-slate-500 font-medium">Invoice</div>
              <div class="text-lg font-semibold leading-tight">
                {{ selectedInvoice?.invoiceNumber || selectedInvoice?.billNumber }}
                <v-chip small class="ml-2 status-chip" :class="statusClass">
                  <v-icon left small>mdi-check-decagram-outline</v-icon>{{ (selectedInvoice?.status || '—').toUpperCase() }}
                </v-chip>
              </div>
            </div>
          </div>

          <v-spacer/>

          <div class="mr-3 text-right hidden-sm-and-down">
            <div class="caption text-slate-500">Invoice Date</div>
            <div class="font-medium">{{ displayDate(selectedInvoice?.invoiceDateISO) }}</div>
          </div>
          <div class="mr-6 text-right hidden-sm-and-down">
            <div class="caption text-slate-500">Grand Total</div>
            <div class="font-semibold">{{ currency(selectedInvoice?.grandTotal ?? selectedInvoice?.totals?.totalAmount) }}</div>
          </div>

          <!-- <v-btn icon class="btn-outline mr-1" @click="$emit('download-pdf', selectedInvoice)" :title="'Download PDF'"> -->
          <v-btn icon class="btn-outline mr-1" @click="downloadInvoiceAsPDF(selectedInvoice)" :title="'Download PDF'">
            <v-icon>mdi-file-pdf-box</v-icon>
          </v-btn>
          <!-- <v-btn icon class="btn-outline mr-1" @click="$emit('download-csv', selectedInvoice)" :title="'Download Excel'"> -->
          <v-btn icon class="btn-outline mr-1" @click="downloadInvoiceAsExcel(selectedInvoice)" :title="'Download Excel'">
            <v-icon>mdi-file-excel-box</v-icon>
          </v-btn>
          <v-btn icon class="btn-primary" @click="$emit('send-mail', selectedInvoice)" :title="'Send Mail'">
            <v-icon>mdi-email-send-outline</v-icon>
          </v-btn>
          <v-btn icon class="ml-2" @click="detailsOpen=false" :title="'Close'">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-toolbar>

        <v-card-text class="pt-6">
          <!-- Summary -->
          <div class="grid md:grid-cols-3 gap-4 mb-6">
            <div class="summary-card">
              <div class="summary-title">Customer</div>
              <div class="summary-value">{{ selectedInvoice?.customer?.name || '—' }}</div>
              <div class="summary-sub">
                <v-icon x-small class="mr-1">mdi-phone</v-icon>{{ selectedInvoice?.customer?.phone || selectedInvoice?.phone || '—' }}
                <span v-if="selectedInvoice?.customer?.email">&nbsp;•&nbsp;<v-icon x-small class="mr-1">mdi-at</v-icon>{{ selectedInvoice.customer.email }}</span>
              </div>
            </div>
            <div class="summary-card">
              <div class="summary-title">Vehicle</div>
              <div class="summary-value">{{ selectedInvoice?.vehicle?.model || '—' }}</div>
              <div class="summary-sub">
                <v-chip x-small class="mr-1 soft-chip">{{ selectedInvoice?.vehicle?.color || '—' }}</v-chip>
                <v-chip x-small class="mr-1 soft-chip">Chassis: {{ selectedInvoice?.vehicle?.chassisNumber || selectedInvoice?.chassisNumber || '—' }}</v-chip>
                <v-chip x-small class="soft-chip">Engine: {{ selectedInvoice?.vehicle?.engineNumber || '—' }}</v-chip>
              </div>
            </div>
            <div class="summary-card">
              <div class="summary-title">Payment</div>
              <div class="summary-value">{{ currency(selectedInvoice?.totals?.totalPaid || 0) }}</div>
              <div class="summary-sub">
                Due: <span class="font-semibold">{{ currency(selectedInvoice?.totals?.due ?? (selectedInvoice?.grandTotal ?? 0)) }}</span>
              </div>
            </div>
          </div>

          <!-- Two-column details -->
          <div class="grid md:grid-cols-2 gap-6">
            <v-card flat class="section-card">
              <div class="section-title">
                <v-icon left small>mdi-account-badge-outline</v-icon> Customer Details
              </div>
              <div class="section-grid">
                <div class="item"><div class="label">Name</div><div class="value">{{ selectedInvoice?.customer?.name || '—' }}</div></div>
                <div class="item"><div class="label">Phone</div><div class="value">{{ selectedInvoice?.customer?.phone || selectedInvoice?.phone || '—' }}</div></div>
                <div class="item">
                  <div class="label">Relation</div>
                  <div class="value">{{ selectedInvoice?.customer?.relationType }} <span v-if="selectedInvoice?.customer?.relationName">({{ selectedInvoice.customer.relationName }})</span></div>
                </div>
                <div class="item">
                  <div class="label">Type</div>
                  <div class="value">{{ prettyOwnerType(selectedInvoice?.ownerType) }} / {{ prettyOwnerType(selectedInvoice?.customerType) }}</div>
                </div>
                <div class="item col-span-2">
                  <div class="label">Address</div>
                  <div class="value">
                    {{ fullAddress(selectedInvoice?.customer?.address || selectedInvoice?.rawForm?.customer?.address || {}) }}
                  </div>
                </div>
              </div>
            </v-card>

            <v-card flat class="section-card">
              <div class="section-title">
                <v-icon left small>mdi-motorbike</v-icon> Vehicle Details
              </div>
              <div class="section-grid">
                <div class="item"><div class="label">Model</div><div class="value">{{ selectedInvoice?.vehicle?.model || '—' }}</div></div>
                <div class="item"><div class="label">Category</div><div class="value">{{ selectedInvoice?.vehicle?.category || selectedInvoice?.rawForm?.category || '—' }}</div></div>
                <div class="item"><div class="label">Color</div><div class="value">{{ selectedInvoice?.vehicle?.color || '—' }}</div></div>
                <div class="item"><div class="label">Qty</div><div class="value">{{ selectedInvoice?.vehicle?.qty || 1 }}</div></div>
                <div class="item"><div class="label">Chassis</div><div class="value mono">{{ selectedInvoice?.vehicle?.chassisNumber || selectedInvoice?.chassisNumber || '—' }}</div></div>
                <div class="item"><div class="label">Engine</div><div class="value mono">{{ selectedInvoice?.vehicle?.engineNumber || '—' }}</div></div>
              </div>
            </v-card>

            <v-card flat class="section-card">
              <div class="section-title">
                <v-icon left small>mdi-cash-multiple</v-icon> Billing & Tax
              </div>
              <div class="section-grid">
                <div class="item"><div class="label">Price Mode</div><div class="value">{{ selectedInvoice?.billOptions?.billPriceMode || selectedInvoice?.tax?.billPriceMode || '—' }}</div></div>
                <div class="item"><div class="label">Showroom Total</div><div class="value">{{ currency(selectedInvoice?.tax?.showroomTotal) }}</div></div>
                <div class="item"><div class="label">CGST</div><div class="value">{{ selectedInvoice?.tax?.cgstPercent ?? '—' }}% ({{ currency(selectedInvoice?.tax?.cgstAmount) }})</div></div>
                <div class="item"><div class="label">SGST</div><div class="value">{{ selectedInvoice?.tax?.sgstPercent ?? '—' }}% ({{ currency(selectedInvoice?.tax?.sgstAmount) }})</div></div>
                <div class="item"><div class="label">On-Road Total</div><div class="value">{{ currency(selectedInvoice?.tax?.onRoadTotal) }}</div></div>
                <div class="item"><div class="label">Grand Total</div><div class="value font-semibold">{{ currency(selectedInvoice?.grandTotal ?? selectedInvoice?.tax?.billGrandTotal) }}</div></div>
              </div>
            </v-card>

            <v-card flat class="section-card">
              <div class="section-title">
                <v-icon left small>mdi-credit-card-outline</v-icon> Documents
              </div>
              <div>
                {{ selectedInvoice?.docs }}
              </div>
            </v-card>

            <v-card flat class="section-card">
              <div class="section-title">
                <v-icon left small>mdi-credit-card-outline</v-icon> Payments
              </div>
              <div v-if="paymentRows.length">
                <v-simple-table dense class="payments-table">
                  <thead>
                    <tr><th>Mode</th><th>Reference</th><th class="text-right">Amount</th></tr>
                  </thead>
                  <tbody>
                    <tr v-for="(p, idx) in paymentRows" :key="idx">
                      <td><v-chip x-small class="soft-chip">{{ p.mode || '—' }}</v-chip></td>
                      <td>{{ p.reference || '—' }}</td>
                      <td class="text-right">{{ currency(Number(p.amount || 0)) }}</td>
                    </tr>
                  </tbody>
                </v-simple-table>
              </div>
              <div v-else class="text-slate-500 caption">No payments recorded.</div>
            </v-card>
          </div>

          <!-- Meta -->
          <v-alert border="left" colored-border class="mt-6 soft-alert" elevation="0">
            <div class="d-flex flex-wrap align-center justify-space-between">
              <div class="mr-6 mb-2">
                <div class="caption text-slate-500">Reference</div>
                <div class="mono">{{ selectedInvoice?.meta?.refNo || '—' }}</div>
              </div>
              <div class="mr-6 mb-2">
                <div class="caption text-slate-500">Created At</div>
                <div>{{ isoToLocal(selectedInvoice?.meta?.createdAt) }}</div>
              </div>
              <div class="mb-2">
                <div class="caption text-slate-500">Last Modified</div>
                <div>{{ tsToLocal(selectedInvoice?.LastModifiedAt || selectedInvoice?.updayedAt || selectedInvoice?.createdAt) }}</div>
              </div>
            </div>
          </v-alert>
        </v-card-text>

        <v-divider/>
        <v-card-actions class="justify-end py-3">
          <v-btn class="btn-outline" @click="copyJSON(selectedInvoice)"><v-icon left small>mdi-content-copy</v-icon> Copy JSON</v-btn>
          <v-btn class="btn-primary" @click="$emit('send-mail', selectedInvoice)"><v-icon left small>mdi-email-send-outline</v-icon> Send Mail</v-btn>
          <v-btn color="primary" text @click="detailsOpen=false">Close</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <div v-if="showAddCustomer">
      <AddSellToCustomer />
    </div>
  </v-card>
</template>

<script>
import AddSellToCustomer from './QuickInvoice.vue'
export default {
  name: 'CustomerInvoiceTable',
  components:{
    AddSellToCustomer
  },
  data () {
    return {
      showAddCustomer: false,
      BASE: process.env.VUE_APP_AGENCY_BACKEND_URL,
      headers: [
        { text: '#', value: 'sn', class: 'min-w-70' },
        { text: 'INVOICE NO', value: 'invoiceNumber', class: 'min-w-120' },
        { text: 'INVOICE DATE', value: 'invoiceDateISO', class: 'min-w-160' },
        { text: 'STATUS', value: 'status', class: 'min-w-110' },
        { text: 'SALES MODE', value: 'salesMode', class: 'min-w-130' },
        { text: 'CUSTOMER NAME', value: 'customerName', class: 'min-w-220' },
        { text: 'CUSTOMER TYPE', value: 'ownerType', class: 'min-w-140' },
        { text: 'MOBILE NO', value: 'phone', class: 'min-w-140' },
        { text: 'ACTIONS', value: 'actions', sortable: false, class: 'min-w-160' }
      ],
      rows: [],
      total: 0,
      loading: false,
      options: { page: 1, itemsPerPage: 20, sortBy: ['invoiceDateISO'], sortDesc: [true] },
      selected: [],
      filters: {
        global: '',
        billNumber: '',
        date: null,
        model: '',
        color: '',
        status: '',
        salesMode: '',
        qty: '',
        name: '',
        ownerType: '',
        phone: '',
        chassis: ''
      },

      // ===== new: columns dialog state & visibility map =====
      columnsDialog: false,
      columnVisibility: {},        // populated in initColumnVisibility()
      defaultVisibility: {},       // preserves initial defaults

      dateMenu: false,
      datePicker: null,
      statusItems: ['SOLD', 'PENDING', 'PAID', 'DELIVERED', 'CANCELLED'],
      ownerTypeItems: ['INDIVIDUAL', 'FIRM'],
      debouncedFetch: null,
      detailsOpen: false,
      selectedInvoice: null
    }
  },
  computed: {
    paymentRows () {
      const inv = this.selectedInvoice || {};
      const p = (inv.payments && inv.payments.length)
        ? inv.payments
        : (inv.rawForm?.payments || []);
      return Array.isArray(p) ? p : [];
    },
    statusClass () {
      const s = String(this.selectedInvoice?.status || '').toLowerCase();
      return {
        'status-created': s === 'created',
        'status-paid': s === 'paid',
        'status-pending': s === 'pending',
        'status-delivered': s === 'delivered',
        'status-cancelled': s === 'cancelled'
      }
    },

    // Visible headers used by v-data-table (preserves order)
    visibleHeaders () {
      // if columnVisibility not initialized yet, return full headers
      if (!this.columnVisibility || Object.keys(this.columnVisibility).length === 0) return this.headers;
      return this.headers.filter(h => {
        // show header if visibility is true or undefined (default to true)
        return this.columnVisibility[h.value] !== false;
      });
    }
  },
  watch: {
    filters: { handler () { this.debouncedFetch() }, deep: true },
    options: { handler () { this.debouncedFetch() }, deep: true }
  },
  created () {
    this.initColumnVisibility();
  },
  mounted () {
    this.debouncedFetch = this.debounce(() => this.fetchRows(), 350);
    this.fetchRows(true);
  },
  methods: {
    showAddCustomerFunction(){
      this.showAddCustomer = true;
    },
    backToTable(){
      this.showAddCustomer = false;
      this.fetchRows(true);
    },
    // Initialize columnVisibility & defaultVisibility from headers
    initColumnVisibility () {
      const map = {};
      const def = {};
      this.headers.forEach(h => {
        // default: show all columns except internal ones? keep them visible by default
        // If you want some hidden by default, set def[h.value] = false here.
        map[h.value] = true;
        def[h.value] = true;
      });
      // keep actions column visible (you can toggle it)
      this.columnVisibility = map;
      this.defaultVisibility = def;
    },

    // Toggle single column
    toggleColumn (value, checked) {
      // checked may be undefined when using @change callback signature; normalize
      const v = (typeof checked === 'boolean') ? checked : !this.columnVisibility[value];
      this.$set(this.columnVisibility, value, v);
    },

    // Select all visible
    selectAllColumns () {
      Object.keys(this.columnVisibility).forEach(k => { this.$set(this.columnVisibility, k, true); });
    },

    // Reset to saved defaults
    resetColumnVisibility () {
      Object.keys(this.defaultVisibility).forEach(k => { this.$set(this.columnVisibility, k, this.defaultVisibility[k]); });
    },

    // Apply (closes dialog) — state is live so no extra action required
    applyColumns () {
      this.columnsDialog = false;
    },

    // ========= Existing methods unchanged below (kept exactly as provided) =========
    downloadInvoiceAsExcel (inv) {
    if (!inv) { this.toast('No invoice to export.'); return; }
    const rows = [
        ['Invoice No', inv.invoiceNumber || inv.billNumber || ''],
        ['Invoice Date', this.displayDate(inv.invoiceDateISO) || ''],
        ['Status', (inv.status || '').toUpperCase()],
        ['Sales Mode', inv.salesMode || ''],
        ['Customer Name', inv.customer?.name || ''],
        ['Customer Phone', inv.customer?.phone || inv.phone || ''],
        ['Customer Type', this.prettyOwnerType(inv.ownerType)],
        ['Grand Total', this.currency(inv.grandTotal ?? inv.totals?.totalAmount)],
        ['Showroom Total', this.currency(inv.tax?.showroomTotal)],
        ['CGST', `${inv.tax?.cgstPercent ?? ''}% (${this.currency(inv.tax?.cgstAmount)})`],
        ['SGST', `${inv.tax?.sgstPercent ?? ''}% (${this.currency(inv.tax?.sgstAmount)})`],
        ['On-Road Total', this.currency(inv.tax?.onRoadTotal)],
        ['Vehicle Model', inv.vehicle?.model || ''],
        ['Vehicle Category', inv.vehicle?.category || inv.rawForm?.category || ''],
        ['Vehicle Color', inv.vehicle?.color || ''],
        ['Chassis No', inv.vehicle?.chassisNumber || inv.chassisNumber || ''],
        ['Engine No', inv.vehicle?.engineNumber || ''],
        ['Payments (count)', String((inv.payments?.length || inv.rawForm?.payments?.length || 0))],
        ['Reference', inv.meta?.refNo || ''],
        ['Created At', this.isoToLocal(inv.meta?.createdAt)],
        ['Last Modified', this.tsToLocal(inv.LastModifiedAt || inv.updayedAt || inv.createdAt)],
        ['Address', this.fullAddress(inv.customer?.address || inv.rawForm?.customer?.address || {})]
    ];

    const escapeCell = (v) => {
        const s = String(v == null ? '' : v);
        return /[",\n]/.test(s) ? `"${s.replace(/"/g,'""')}"` : s;
    };

    const header = ['Field','Value'];
    const csv = [header, ...rows].map(r => r.map(escapeCell).join(',')).join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const name = `invoice_${inv.invoiceNumber || inv.billNumber || 'details'}.csv`;

    if (window.navigator && window.navigator.msSaveOrOpenBlob) {
        window.navigator.msSaveOrOpenBlob(blob, name); return;
    }
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = name; a.style.display = 'none';
    document.body.appendChild(a);
    a.dispatchEvent(new MouseEvent('click', { view: window, bubbles: true, cancelable: true }));
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    this.toast('Details Excel downloaded.');
    },

    async downloadInvoiceAsPDF (inv) {
  if (!inv) { this.toast('No invoice to export.'); return; }

  // ------- Brand palette & helpers -------
  const COLORS = {
    brand: [37, 99, 235],        // blue-600
    brandLight: [238, 244, 255], // soft header bg
    text: [17, 24, 39],          // slate-900
    subtext: [71, 85, 105],      // slate-600
    border: [226, 232, 240],     // slate-200
    success: [16, 185, 129],
    warning: [245, 158, 11],
    danger: [239, 68, 68],
    muted: [148, 163, 184]
  };

  const statusColor = (s) => {
    const v = String(s || '').toLowerCase();
    if (v === 'paid' || v === 'delivered') return COLORS.success;
    if (v === 'pending' || v === 'created') return COLORS.warning;
    if (v === 'cancelled') return COLORS.danger;
    return COLORS.muted;
  };

  const currency = (n) => this.currency(n).replace('₹', '₹ '); // ensure spacing
  const safe = (v) => (v == null || v === '') ? '—' : String(v);

  try {
    const { jsPDF } = await import(/* webpackChunkName: "jspdf" */ 'jspdf');
    await import(/* webpackChunkName: "jspdf-autotable" */ 'jspdf-autotable');

    // ------- Doc setup -------
    const doc = new jsPDF({ orientation: 'p', unit: 'pt', format: 'a4' });
    const pageW = doc.internal.pageSize.getWidth();
    const marginX = 40;
    let cursorY = 40;

    // ------- Header band -------
    // band
    doc.setFillColor(...COLORS.brandLight);
    doc.rect(0, 0, pageW, 90, 'F');

    // title & invoice number
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...COLORS.text);
    doc.setFontSize(16);
    doc.text('Customer Invoice — Details', marginX, cursorY + 10);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...COLORS.subtext);
    doc.setFontSize(11);
    const invNo = inv.invoiceNumber || inv.billNumber || '';
    doc.text(`Invoice No: ${invNo}`, marginX, cursorY + 30);

    const invDate = this.displayDate(inv.invoiceDateISO) || '—';
    doc.text(`Invoice Date: ${invDate}`, marginX, cursorY + 48);

    // status badge (right side)
    const badgeText = (inv.status || '—').toUpperCase();
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    const padX = 10, padY = 6;
    const txtW = doc.getTextWidth(badgeText);
    const badgeW = txtW + padX * 2;
    const badgeH = 20;
    const badgeX = pageW - marginX - badgeW;
    const badgeY = 38;
    const sColor = statusColor(inv.status);
    doc.setDrawColor(...sColor); doc.setFillColor(255,255,255);
    doc.roundedRect(badgeX, badgeY, badgeW, badgeH, 6, 6, 'S');
    doc.setTextColor(...sColor);
    doc.text(badgeText, badgeX + padX, badgeY + badgeH/2 + 3);

    // amount tiles (right below header)
    const tileY = 80;
    const tileW = (pageW - marginX * 2 - 16) / 2; // two tiles side-by-side
    const tileH = 58;

    const totalPaid = inv.totals?.totalPaid || 0;
    const amountDue = (inv.totals?.due ?? (inv.grandTotal ?? 0));
    const grandTotal = inv.grandTotal ?? inv.totals?.totalAmount ?? inv.tax?.billGrandTotal ?? 0;

    const drawTile = (x, title, value) => {
      doc.setFillColor(255,255,255);
      doc.setDrawColor(...COLORS.border);
      doc.roundedRect(x, tileY, tileW, tileH, 10, 10, 'FD');
      doc.setTextColor(...COLORS.subtext);
      doc.setFont('helvetica','bold'); doc.setFontSize(10);
      doc.text(title, x + 14, tileY + 20);
      doc.setTextColor(...COLORS.text);
      doc.setFont('helvetica','bold'); doc.setFontSize(14);
      doc.text(value, x + 14, tileY + 40);
    };

    drawTile(marginX, 'Amount Due', currency(amountDue));
    drawTile(marginX + tileW + 16, 'Grand Total', currency(grandTotal));

    cursorY = tileY + tileH + 24;

    // ------- Section helper using autoTable -------
    const sectionHeading = (title) => {
      doc.setFont('helvetica','bold'); doc.setFontSize(12);
      doc.setTextColor(...COLORS.brand);
      doc.text(title, marginX, cursorY);
      cursorY += 8;
      doc.setDrawColor(...COLORS.border);
      doc.line(marginX, cursorY, pageW - marginX, cursorY);
      cursorY += 10;
    };

    const keyValTable = (rows) => {
      doc.autoTable({
        startY: cursorY,
        margin: { left: marginX, right: marginX },
        head: [['Field', 'Value']],
        body: rows.map(([k,v]) => [k, v]),
        styles: { fontSize: 9, cellPadding: 6, textColor: COLORS.text },
        headStyles: { fillColor: COLORS.brandLight, textColor: COLORS.text, lineColor: COLORS.border },
        bodyStyles: { lineColor: COLORS.border },
        theme: 'grid',
        tableWidth: pageW - marginX * 2
      });
      cursorY = doc.lastAutoTable.finalY + 16;
    };

    // ------- Customer -------
    sectionHeading('Customer');
    keyValTable([
      ['Name', safe(inv.customer?.name)],
      ['Phone', safe(inv.customer?.phone || inv.phone)],
      ['Type', safe(this.prettyOwnerType(inv.ownerType))],
      ['Relation', safe(`${inv.customer?.relationType || ''}${inv.customer?.relationName ? ' ('+inv.customer.relationName +')' : ''}`)],
      ['Address', safe(this.fullAddress(inv.customer?.address || inv.rawForm?.customer?.address || {}))]
    ]);

    // ------- Vehicle -------
    sectionHeading('Vehicle');
    keyValTable([
      ['Model', safe(inv.vehicle?.model)],
      ['Category', safe(inv.vehicle?.category || inv.rawForm?.category)],
      ['Color', safe(inv.vehicle?.color)],
      ['Qty', safe(inv.vehicle?.qty || 1)],
      ['Chassis', safe(inv.vehicle?.chassisNumber || inv.chassisNumber)],
      ['Engine', safe(inv.vehicle?.engineNumber)]
    ]);

    // ------- Billing & Tax -------
    sectionHeading('Billing & Tax');
    keyValTable([
      ['Price Mode', safe(inv.billOptions?.billPriceMode || inv.tax?.billPriceMode)],
      ['Showroom Total', currency(inv.tax?.showroomTotal)],
      ['CGST', safe(`${inv.tax?.cgstPercent ?? ''}% (${currency(inv.tax?.cgstAmount)})`)],
      ['SGST', safe(`${inv.tax?.sgstPercent ?? ''}% (${currency(inv.tax?.sgstAmount)})`)],
      ['On-Road Total', currency(inv.tax?.onRoadTotal)],
      ['Grand Total', currency(grandTotal)]
    ]);

    // ------- Payments (dynamic table) -------
    const payments = (inv.payments?.length ? inv.payments : (inv.rawForm?.payments || [])) || [];
    sectionHeading('Payments');
    if (payments.length) {
      doc.autoTable({
        startY: cursorY,
        margin: { left: marginX, right: marginX },
        head: [['Mode','Reference','Amount']],
        body: payments.map(p => [safe(p.mode), safe(p.reference), currency(Number(p.amount || 0))]),
        styles: { fontSize: 9, cellPadding: 6, textColor: COLORS.text },
        headStyles: { fillColor: COLORS.brandLight, textColor: COLORS.text, lineColor: COLORS.border },
        bodyStyles: { lineColor: COLORS.border },
        theme: 'grid',
        tableWidth: pageW - marginX * 2
      });
      cursorY = doc.lastAutoTable.finalY + 16;
    } else {
      doc.setTextColor(...COLORS.subtext);
      doc.setFont('helvetica','normal'); doc.setFontSize(10);
      doc.text('No payments recorded.', marginX, cursorY + 10);
      cursorY += 26;
    }

    // ------- Meta -------
    sectionHeading('Meta');
    keyValTable([
      ['Reference', safe(inv.meta?.refNo)],
      ['Created At', safe(this.isoToLocal(inv.meta?.createdAt))],
      ['Last Modified', safe(this.tsToLocal(inv.LastModifiedAt || inv.updayedAt || inv.createdAt))]
    ]);

    // ------- Footer (page x / y + timestamp) -------
    const pageCount = doc.internal.getNumberOfPages();
    const genAt = new Date().toLocaleString();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      const footerY = doc.internal.pageSize.getHeight() - 24;
      doc.setDrawColor(...COLORS.border);
      doc.line(marginX, footerY - 10, pageW - marginX, footerY - 10);
      doc.setFont('helvetica','normal'); doc.setFontSize(9);
      doc.setTextColor(...COLORS.subtext);
      doc.text(`Generated: ${genAt}`, marginX, footerY);
      const pageLabel = `Page ${i} of ${pageCount}`;
      const labelW = doc.getTextWidth(pageLabel);
      doc.text(pageLabel, pageW - marginX - labelW, footerY);
    }

    // ------- Save -------
    const file = `invoice_${invNo || 'details'}.pdf`;
    doc.save(file);
    this.toast('Details PDF downloaded.');
  } catch (err) {
    console.warn('jsPDF not available, falling back to print view.', err);

    // Fallback: simple print view (kept from earlier version)
    const tr = (k,v) => `<tr><th>${this.htmlSafe(k)}</th><td>${this.htmlSafe(v)}</td></tr>`;
    const sec = (title, rows) => `
      <h3>${title}</h3>
      <table>
        <tbody>${rows.map(([k,v]) => tr(k, v == null ? '' : v)).join('')}</tbody>
      </table>`;

    const html = `
      <html><head><title>Invoice Details</title>
        <style>
          body{font-family:system-ui,-apple-system,Segoe UI,Roboto,'Helvetica Neue',Arial;padding:16px}
          h2{margin:0 0 12px}
          h3{margin:18px 0 8px}
          table{width:100%;border-collapse:collapse;margin-bottom:8px}
          th,td{border:1px solid #e5e7eb;padding:8px;font-size:12px;text-align:left;vertical-align:top}
          th{width:180px;background:#f8fafc}
        </style>
      </head><body>
        <h2>Invoice ${this.htmlSafe(inv.invoiceNumber || inv.billNumber || '')}</h2>
        ${sec('Customer', [
          ['Name', inv.customer?.name || ''],
          ['Phone', inv.customer?.phone || inv.phone || ''],
          ['Type', this.prettyOwnerType(inv.ownerType)],
          ['Relation', `${inv.customer?.relationType || ''}${inv.customer?.relationName ? ' ('+inv.customer.relationName +')' : ''}`],
          ['Address', this.fullAddress(inv.customer?.address || inv.rawForm?.customer?.address || {})]
        ])}
        ${sec('Vehicle', [
          ['Model', inv.vehicle?.model || ''],
          ['Category', inv.vehicle?.category || inv.rawForm?.category || ''],
          ['Color', inv.vehicle?.color || ''],
          ['Qty', inv.vehicle?.qty || 1],
          ['Chassis', inv.vehicle?.chassisNumber || inv.chassisNumber || ''],
          ['Engine', inv.vehicle?.engineNumber || '']
        ])}
        ${sec('Billing & Tax', [
          ['Price Mode', inv.billOptions?.billPriceMode || inv.tax?.billPriceMode || ''],
          ['Showroom Total', this.currency(inv.tax?.showroomTotal)],
          ['CGST', `${inv.tax?.cgstPercent ?? ''}% (${this.currency(inv.tax?.cgstAmount)})`],
          ['SGST', `${inv.tax?.sgstPercent ?? ''}% (${this.currency(inv.tax?.sgstAmount)})`],
          ['On-Road Total', this.currency(inv.tax?.onRoadTotal)],
          ['Grand Total', this.currency(inv.grandTotal ?? inv.tax?.billGrandTotal)]
        ])}
      </body></html>`;

    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(html);
    win.document.close();
    const interval = setInterval(() => {
      try {
        if (win.document && win.document.readyState === 'complete') {
          clearInterval(interval);
          win.focus();
          win.print();
        }
      } catch (_) { clearInterval(interval); }
    }, 100);
  }
},

    openDetails (item) {
      this.selectedInvoice = item;
      this.detailsOpen = true;
      this.$emit('show-details', item); // keep parent hooks
    },

    async fetchRows() {
      this.loading = true;
      try {
        // Supported filters
        const filters = [
          'billNumber',
          'phone',
          'name',
          'chassis',
          'date',
          'ownerType',
          'salesMode',
          'status'
        ];

        // Extract active filters
        const active = {};
        filters.forEach(f => {
          const v = this.filters?.[f];
          if (v !== undefined && v !== null && v !== '') active[f] = v;
        });

        // Map single filters to endpoints
        const endpointMap = {
          billNumber: 'getByInvoice',
          phone: 'getByPhone',
          name: 'getByName',
          chassis: 'getByChassis',
          date: 'getByDate',
          ownerType: 'ownerType',
          salesMode: 'bySalesMode'
          // status does NOT have its own endpoint, so search is correct
        };

        let endpoint = 'allCustomerInvoice';

        if (Object.keys(active).length === 1) {
          const key = Object.keys(active)[0];
          console.log('endpointMap[key]', endpointMap[key])
          endpoint = endpointMap[key] || 'search';
          console.log('endpoint', endpoint)
        } else if (Object.keys(active).length > 1) {
          endpoint = 'search';
        }

        const qp = new URLSearchParams(active).toString();
        const url = `${this.BASE}${endpoint}${qp ? '?' + qp : ''}`;

        const resp = await fetch(url);
        const data = await resp.json();

        // after you get `items` and determine total
        const items = Array.isArray(data) ? data : (data.items || data.data || data.invoices || []);
        const total = (data.total != null) ? Number(data.total) : items.length;

        // If backend returned full dataset (no real server paging), slice for v-data-table.
        // This keeps v-data-table's pagination correct while still using your options (page/itemsPerPage).
        const page = Number(this.options.page || 1);
        const perPage = Number(this.options.itemsPerPage || 18);

        // If the server returned everything (no total provided), treat it as client-side page slicing
        if (data.total == null && Array.isArray(items)) {
          this.total = items.length;
          const start = (page - 1) * perPage;
          const end = start + perPage;
          this.rows = items.slice(start, end).map(r => this.normalizeRow(r));
        } else {
          // Server already paged properly (recommended) — use returned items and server total
          this.rows = items.map(r => this.normalizeRow(r));
          this.total = total;
        }
      } catch (e) {
        console.error(e);
        this.rows = [];
        this.total = 0;
      } finally {
        this.loading = false;
      }
    },


    normalizeRow (r) {
      return {
        ...r,
        invoiceNumber: r.invoiceNumber || r.billNumber || r.invNo || r.number,
        invoiceDateISO: r.invoiceDateISO || this.toISO(r.invoiceDate),
        model: r.model || r.vehicle?.model || '-',
        color: r.color || r.vehicle?.color || '-',
        status: r.status || 'SOLD',
        salesMode: r.salesMode || r.rawForm?.salesMode || '',
        qty: Number(r.qty || r.vehicle?.qty || 1),
        customer: r.customer || { name: r.customerName, phone: r.phone },
        ownerType: r.ownerType || (r.firm ? 'FIRM' : 'INDIVIDUAL'),
        phone: r.phone || r.customer?.phone
      };
    },

    applyDate (v) { this.filters.date = v; this.dateMenu = false; },

    resetFilters () {
      this.filters = {
        global: '', billNumber: '', date: null, model: '', color: '',
        status: '', salesMode: '', qty: '', name: '', ownerType: '',
        phone: '', chassis: ''
      };
      this.fetchRows(true);
    },

    // ========= Downloads =========
    downloadSelectedAsExcel () {
      const rows = [...this.selected];
      if (!rows.length) { this.toast('Please select at least one row.'); return; }
      rows.sort((a, b) => (b.invoiceDateISO || '').localeCompare(a.invoiceDateISO || ''));

      const header = ['S.No','Invoice No','Invoice Date','Status','Sales Mode','Customer Name','Customer Type','Phone'];
      const records = rows.map((r, i) => ([
        (i+1),
        r.invoiceNumber || '',
        this.displayDate(r.invoiceDateISO) || '',
        (r.status || '').toUpperCase(),
        r.salesMode || '',
        r.customer?.name || '',
        this.prettyOwnerType(r.ownerType),
        r.customer?.phone || r.phone || ''
      ]));

      const escapeCell = (v) => {
        const s = String(v == null ? '' : v);
        return /[",\n]/.test(s) ? `"${s.replace(/"/g,'""')}"` : s;
      };

      const csv = [header, ...records].map(row => row.map(escapeCell).join(',')).join('\n');
      const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
      const fileName = `invoices_${new Date().toISOString().slice(0,10)}.csv`;

      if (window.navigator && window.navigator.msSaveOrOpenBlob) {
        window.navigator.msSaveOrOpenBlob(blob, fileName);
        return;
      }

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = fileName; a.style.display = 'none';
      document.body.appendChild(a);
      a.dispatchEvent(new MouseEvent('click', { view: window, bubbles: true, cancelable: true }));
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      this.toast('Excel downloaded.');
    },

    async downloadSelectedAsPDF () {
      const rows = [...this.selected];
      if (!rows.length) { this.toast('Please select at least one row.'); return; }
      rows.sort((a, b) => (b.invoiceDateISO || '').localeCompare(a.invoiceDateISO || ''));

      try {
        const { jsPDF } = await import(/* webpackChunkName: "jspdf" */ 'jspdf');
        await import(/* webpackChunkName: "jspdf-autotable" */ 'jspdf-autotable');

        const doc = new jsPDF({ orientation: 'p', unit: 'pt', format: 'a4' });
        doc.setFontSize(14);
        doc.text('Customer Invoices — Latest First', 40, 40);

        const head = [['S.No','Invoice No','Invoice Date','Status','Sales Mode','Customer Name','Customer Type','Phone']];
        const body = rows.map((r, i) => ([
          i + 1,
          String(r.invoiceNumber || ''),
          this.displayDate(r.invoiceDateISO) || '',
          String((r.status || '').toUpperCase()),
          String(r.salesMode || ''),
          String(r.customer?.name || ''),
          String(this.prettyOwnerType(r.ownerType)),
          String(r.customer?.phone || r.phone || '')
        ]));

        doc.autoTable({
          head,
          body,
          startY: 60,
          styles: { fontSize: 9, cellPadding: 6 },
          headStyles: { fillColor: [238, 244, 255], textColor: 20 },
          columnStyles: { 0: { cellWidth: 40 }, 1: { cellWidth: 110 }, 2: { cellWidth: 90 } },
          theme: 'striped'
        });

        const fileName = `invoices_${new Date().toISOString().slice(0,10)}.pdf`;
        doc.save(fileName);
        this.toast('PDF downloaded.');
      } catch (err) {
        console.warn('jsPDF not available, falling back to print dialog.', err);

        // Fallback: print dialog (no <script> in HTML string)
        const styles = `
          <style>
            body { font-family: system-ui, -apple-system, Segoe UI, Roboto, 'Helvetica Neue', Arial; padding: 16px; }
            h2 { margin: 0 0 12px; }
            table { width:100%; border-collapse: collapse; }
            th, td { border:1px solid #e5e7eb; padding:8px; font-size:12px; text-align:left; }
            th { background:#eef4ff; }
          </style>`;
        const header = ['S.No','Invoice No','Invoice Date','Status','Sales Mode','Customer Name','Customer Type','Phone'];
        const rowsHtml = rows.map((r, i) => `
          <tr>
            <td>${i+1}</td>
            <td>${this.htmlSafe(r.invoiceNumber)}</td>
            <td>${this.htmlSafe(this.displayDate(r.invoiceDateISO))}</td>
            <td>${this.htmlSafe((r.status || '').toUpperCase())}</td>
            <td>${this.htmlSafe(r.salesMode || '')}</td>
            <td>${this.htmlSafe(r.customer?.name || '')}</td>
            <td>${this.htmlSafe(this.prettyOwnerType(r.ownerType))}</td>
            <td>${this.htmlSafe(r.customer?.phone || r.phone || '')}</td>
          </tr>`).join('');

        const html = `
          <html><head><title>Invoices</title>${styles}</head>
          <body>
            <h2>Customer Invoices — Latest First</h2>
            <table>
              <thead><tr>${header.map(h => `<th>${h}</th>`).join('')}</tr></thead>
              <tbody>${rowsHtml}</tbody>
            </table>
          </body></html>`;

        const win = window.open('', '_blank');
        if (!win) return;
        win.document.write(html);
        win.document.close();

        const interval = setInterval(() => {
          try {
            if (win.document && win.document.readyState === 'complete') {
              clearInterval(interval);
              win.focus();
              win.print();
              this.toast('Opened print dialog for PDF.');
            }
          } catch (_) { clearInterval(interval); }
        }, 100);
      }
    },

    // ===== Utils =====
    toast (msg) {
      // Minimal toast using alert to avoid adding Vuetify snackbar plumbing.
      // Replace with your global snackbar if you have one.
      try { this.$root.$emit && this.$root.$emit('toast', msg) } catch (e) {}
      if (!this.$root.$emit) alert(msg);
    },
    escapeCSV (v) {
      if (v == null) return '';
      const s = String(v);
      return /[",\n]/.test(s) ? `"${s.replace(/"/g,'""')}"` : s;
    },
    htmlSafe (v) {
      return String(v == null ? '' : v)
        .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
    },
    displayDate (iso) {
      if (!iso) return '-';
      const [y, m, d] = String(iso).split('-');
      return (d && m && y) ? `${d}/${m}/${y}` : '-';
    },
    toISO (ddmmyyyy) {
      if (!ddmmyyyy) return null;
      const m = String(ddmmyyyy).match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
      if (!m) return null;
      return `${m[3]}-${m[2]}-${m[1]}`;
    },
    relativeDay (iso) {
      if (!iso) return '';
      const today = new Date();
      const d = new Date(iso);
      const diff = Math.floor((today - d) / 86400000);
      if (diff === 0) return 'Today';
      if (diff === 1) return 'Yesterday';
      return '';
    },
    prettyOwnerType (v) {
      const t = String(v || '').toUpperCase();
      return t === 'FIRM' ? 'Firm' : t === 'INDIVIDUAL' ? 'Individual' : '-';
    },
    currency (n) {
      const v = Number(n || 0);
      return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(v);
    },
    isoToLocal (iso) {
      if (!iso) return '—';
      try { return new Date(iso).toLocaleString() } catch { return '—' }
    },
    tsToLocal (ts) {
      if (!ts) return '—';
      try { return new Date(Number(ts)).toLocaleString() } catch { return '—' }
    },
    fullAddress (addr = {}) {
      const parts = [addr.line1, addr.line2, addr.village, addr.block, addr.district, addr.tahsil, addr.state, addr.pincode, addr.postOffice].filter(Boolean);
      return parts.length ? parts.join(', ') : '—';
    },
    debounce (fn, wait) {
      let t = null;
      return (...args) => { clearTimeout(t); t = setTimeout(() => fn.apply(this, args), wait); };
    }
  }
}
</script>


<style scoped>
.invoice-card {
  margin: 2px;
  overflow: hidden;
  border: 1px solid #eef1f5;
  box-shadow: 0 8px 24px rgba(16,24,40,.06);
  background: linear-gradient(180deg, #ffffff, #fafbff);
}
.toolbar-glass {
  background: rgba(255,255,255,0.7) !important;
  backdrop-filter: blur(6px);
  border-bottom: 1px solid #eef1f5;
}

/* Soft brand accents */
.text--primary { color:#2563eb !important; }
.btn-primary { background:#2563eb !important; color:#fff !important; text-transform:none; }
.btn-success { background:#16a34a !important; color:#fff !important; text-transform:none; }
.btn-soft { background:#e0e7ff !important; text-transform:none; }
.btn-outline { background:transparent; border:1px solid #e2e8f0; text-transform:none; }
.chip-soft { background:#eef4ff !important; color:#334155 !important; }

.modern-table ::v-deep table { border-collapse: separate; border-spacing: 0; }
.sticky-header { position: sticky; top: 0; z-index: 2; background: #f8f9fc; }
.th-title { font-size: 12px; font-weight: 700; letter-spacing: .03em; color: #64748b; }
.input-compact :deep(input) { font-size: 12px !important; }

.mono { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace; }

.min-w-70  { min-width:70px }
.min-w-110 { min-width:110px }
.min-w-120 { min-width:120px }
.min-w-130 { min-width:130px }
.min-w-140 { min-width:140px }
.min-w-160 { min-width:160px }
.min-w-220 { min-width:220px }
.min-w-260 { min-width:260px }

.modern-table :deep(tbody tr:hover) { background:#f6f8ff !important; transition: background .2s; }

/* ===== Details dialog styles ===== */
.details-card {
  border: 1px solid #eef1f5;
  box-shadow: 0 12px 28px rgba(16,24,40,.08);
  background: linear-gradient(180deg, #ffffff, #fafbff);
}
.details-toolbar {
  background: rgba(255,255,255,0.7) !important;
  backdrop-filter: blur(6px);
  border-bottom: 1px solid #eef1f5;
}
.soft-avatar {
  background: #eef4ff !important;
  color: #324155 !important;
  border-radius: 12px;
}
.section-card {
  border: 1px solid #eef1f5;
  border-radius: 16px;
  padding: 14px 16px;
  background: #fff;
}
.section-title {
  font-weight: 700; letter-spacing: .02em; font-size: 13px;
  color: #475569; display: flex; align-items: center; margin-bottom: 10px;
}
.section-grid {
  display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); grid-gap: 10px 16px;
}
.section-grid .item .label { font-size: 11px; color: #64748b; }
.section-grid .item .value { font-size: 13px; color: #0f172a; }
.section-grid .item.col-span-2 { grid-column: span 2 / span 2; }

.summary-card {
  border: 1px dashed #e5e7eb; border-radius: 14px; padding: 12px 14px; background: #fff;
}
.summary-title { font-size: 11px; color: #64748b; letter-spacing: .02em; }
.summary-value { font-size: 16px; font-weight: 700; margin-top: 2px; }
.summary-sub { font-size: 12px; color: #475569; margin-top: 4px; }

.payments-table thead th { font-size: 11px; color: #64748b; background: #f8f9fc; }
.payments-table tbody td { font-size: 12px; }

.soft-chip { background: #eef4ff !important; color: #334155 !important; }
.soft-alert { background: #f8fafc !important; border-color: #c7d2fe !important; }

.status-chip { font-weight: 600; }
.status-created   { background:#fff7ed !important; color:#9a3412 !important; }
.status-paid      { background:#ecfdf5 !important; color:#065f46 !important; }
.status-pending   { background:#fef9c3 !important; color:#92400e !important; }
.status-delivered { background:#eef2ff !important; color:#3730a3 !important; }
.status-cancelled { background:#fee2e2 !important; color:#991b1b !important; }

/* Tailwind-like helpers (optional, local only) */
.grid { display: grid; }
.gap-4 { grid-gap: 1rem; }
.gap-6 { grid-gap: 1.5rem; }
.mb-6 { margin-bottom: 1.5rem; }
.hidden-sm-and-down { display:none; }
@media (min-width: 600px){ .hidden-sm-and-down{ display:block; } }
.text-sm { font-size: .875rem; }
.text-lg { font-size: 1.125rem; }
.text-slate-500 { color:#64748b; }
.font-medium { font-weight:500; }
.font-semibold { font-weight:600; }
.leading-tight { line-height:1.2; }
.rounded-xl { border-radius: 20px; }
</style>
