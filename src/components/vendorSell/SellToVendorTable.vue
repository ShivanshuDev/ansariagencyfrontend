<template>
  <div style="margin:10px;" >
    <div v-if="showAddNewSellDialog" style="padding:5px; width:100%; background-color:white;">
       <v-icon style="width:40px; height:40px; border:1px solid black; border-radius:50%;" @click="backtoTable()" left>mdi-arrow-left</v-icon>
    </div>
    <div v-if="!showAddNewSellDialog">
      <!-- ===== LIST VIEW ===== -->
      <template v-if="!embedded.show">
        <v-card class="pa-4" elevation="6">
          <v-toolbar flat dense class="mb-3">
            <v-toolbar-title class="subtitle-1 font-weight-medium">
              Sell To Vendor — Records
            </v-toolbar-title>
            <v-spacer />

            <v-btn
              v-if="!showAddNewSellDialog"
              small
              depressed
              class="mr-2"
              color="Success"
              @click="showAddNewSellDialogFunction"
              style="cursor:pointer;"
            >
              <v-icon left>mdi-add</v-icon>
              Add New
            </v-btn>

            <!-- Download buttons -->
            <v-btn v-if="!showAddNewSellDialog"
              small
              depressed
              class="mr-2"
              color="secondary"
              @click="downloadPdf"
              :loading="pdfBusy"
              :disabled="loading || pdfBusy || !rows.length"
              style="cursor:pointer;"
            >
              <v-icon left>mdi-file-pdf-box</v-icon>
              PDF
            </v-btn>

            <v-btn
              v-if="!showAddNewSellDialog" 
              small
              depressed
              class="mr-4"
              color="success"
              @click="downloadExcel"
              :disabled="loading || !rows.length"
              style="cursor:pointer;"
            >
              <v-icon style="cursor:pointer;" left>mdi-microsoft-excel</v-icon>
              Excel
            </v-btn>

            <v-btn v-if="!showAddNewSellDialog" small style="cursor:pointer;" depressed color="primary" @click="loadAll" :loading="loading">
              Refresh
            </v-btn>
          </v-toolbar>

          <!-- Filters -->
          <v-card v-if="!showAddNewSellDialog"  class="pa-3 mb-3" outlined>
            <v-row dense>
              <v-col cols="12" md="3">
                <v-text-field dense outlined clearable hide-details
                  v-model.trim="filters.invoiceNumber"
                  label="Invoice number" prepend-inner-icon="mdi-pound"
                  @click:clear="loadAll"/>
              </v-col>
              <v-col cols="12" md="3">
                <v-text-field dense outlined clearable hide-details
                  v-model.trim="filters.clientId"
                  label="Client ID" prepend-inner-icon="mdi-account"
                  @click:clear="loadAll"/>
              </v-col>
              <v-col cols="12" md="3">
                <v-select dense outlined clearable hide-details
                  v-model="filters.statusD"
                  label="Select Status" prepend-inner-icon="mdi-clock"
                  :items="['SOLD', 'ACTIVE', 'PENDING', 'CANCELLED', 'INACTIVE']"
                  @click:clear="loadAll"/>
              </v-col>
              <v-col cols="12" md="3">
                <v-text-field dense outlined clearable hide-details
                  v-model.trim="filters.chassisNumber"
                  label="Chassis Number"
                  prepend-inner-icon="mdi-account"
                  @click:clear="loadAll"/>
              </v-col>
              <v-col cols="12" md="3">
                <v-text-field dense outlined clearable hide-details
                  v-model.trim="filters.name"
                  label="Exact Name (vendor/buyer/consignee)"
                  prepend-inner-icon="mdi-card-account-details"
                  @click:clear="loadAll"/>
              </v-col>

              <!-- From date: display dd/mm/yyyy but keep v-model as YYYY-MM-DD -->
              <v-col cols="12" md="3">
                <v-menu v-model="menus.from" :close-on-content-click="false" max-width="320" offset-y>
                  <template v-slot:activator="{ on, attrs }">
                    <v-text-field v-bind="attrs" v-on="on" dense outlined readonly clearable hide-details
                      label="From (DD/MM/YYYY)" prepend-inner-icon="mdi-calendar"
                      :value="displayDateSlash(filters.from)" @click:clear="filters.from=null"/>
                  </template>
                  <v-date-picker v-model="filters.from" @input="menus.from=false" scrollable />
                </v-menu>
              </v-col>

              <!-- To date: display dd/mm/yyyy but keep v-model as YYYY-MM-DD -->
              <v-col cols="12" md="3">
                <v-menu v-model="menus.to" :close-on-content-click="false" max-width="320" offset-y>
                  <template v-slot:activator="{ on, attrs }">
                    <v-text-field v-bind="attrs" v-on="on" dense outlined readonly clearable hide-details
                      label="To (DD/MM/YYYY)" prepend-inner-icon="mdi-calendar"
                      :value="displayDateSlash(filters.to)" @click:clear="filters.to=null"/>
                  </template>
                  <v-date-picker v-model="filters.to" @input="menus.to=false" scrollable />
                </v-menu>
              </v-col>

              <v-col cols="12" md="3">
                <v-btn color="primary" @click="runSearch" :loading="loading">
                  <v-icon left>mdi-magnify</v-icon> Search
                </v-btn>
                <v-btn text @click="resetFilters" :disabled="loading">Clear</v-btn>
              </v-col>
            </v-row>
          </v-card>

          <!-- Table -->
          <v-data-table v-if="!showAddNewSellDialog"  
            :headers="headers"
            :items="rows"
            :loading="loading"
            :items-per-page="15"
            :footer-props="{ itemsPerPageOptions: [15, 30, 45, 60] }"
            class="elevation-1"
            item-key="pk"
            dense
          >
            <!-- Serial number column (first) - now global index across rows -->
            <template v-slot:item.serial="{ index }">
              {{ index + 1 }}
            </template>

            <!-- Date column formatted as dd/mm/yyyy -->
            <template v-slot:item.invoiceDate="{ item }">
              {{ fmtDate(item.invoiceDate) }}
            </template>

            <template v-slot:item.totals.grandTotal="{ item }">
              ₹{{ money(item.totals && item.totals.grandTotal) }}
            </template>

            <!-- Items column: show item count and tooltip with labels -->
            <template v-slot:item.itemsDisplay="{ item }">
              <div>
                <v-tooltip top>
                  <template v-slot:activator="{ on, attrs }">
                    <span v-bind="attrs" v-on="on">
                      <span v-if="item.items && item.items.length">
                        {{ item.items.length }}
                      </span>
                      <span v-else>0 items</span>
                    </span>
                  </template>
                  <div style="max-width:320px; white-space:normal;">
                    <div v-if="item.items && item.items.length">
                      <div v-for="(it, idx) in item.items" :key="idx">
                        • {{ it.label || it.modelName || '—' }}
                      </div>
                    </div>
                    <div v-else>—</div>
                  </div>
                </v-tooltip>
              </div>
            </template>

            <template v-slot:item.meta.statusType="{ item }">
              <v-chip small :color="statusColor(item.meta && item.meta.statusType)" dark>
                {{ (item.meta && item.meta.statusType) || '—' }}
              </v-chip>
            </template>

            <template v-slot:item.actions="{ item }">
              <v-tooltip top>
                <template v-slot:activator="{ on }">
                  <v-btn icon small color="primary" v-on="on" @click.stop="openView(item)">
                    <v-icon small>mdi-eye</v-icon>
                  </v-btn>
                </template>
                <span>View</span>
              </v-tooltip>

              <v-tooltip top>
                <template v-slot:activator="{ on }">
                  <v-btn icon small color="teal" v-on="on" @click.stop="openEmbeddedEditor(item)">
                    <v-icon small>mdi-pencil</v-icon>
                  </v-btn>
                </template>
                <span>Edit (full screen)</span>
              </v-tooltip>

              <v-tooltip top>
                <template v-slot:activator="{ on }">
                  <v-btn icon small color="orange darken-2" v-on="on" @click.stop="openQuickUpdate(item)">
                    <v-icon small>mdi-file-document-edit</v-icon>
                  </v-btn>
                </template>
                <span>Quick Update</span>
              </v-tooltip>
            </template>

            <template v-slot:no-data>
              <div class="pa-6 text-center grey--Text">
                No records. Try changing filters or click Refresh.
              </div>
            </template>
          </v-data-table>

          <!-- View Dialog -->
          <v-dialog v-if="!showAddNewSellDialog" persistent v-model="dialogs.view" max-width="1400px" scrollable>
            <v-card>
              <v-card-title class="subtitle-1">
                Invoice {{ current?.invoiceNumber || '—' }}
                <v-spacer />
                <v-btn icon @click="dialogs.view=false"><v-icon>mdi-close</v-icon></v-btn>
              </v-card-title>
              <v-divider></v-divider>
              <v-card-text>
                <v-row dense>
                  <v-col cols="12" md="6">
                    <div class="caption text--secondary">Vendor</div>
                    <div class="font-weight-medium">{{ current?.vendorName || '—' }}</div>
                    <div class="caption">Client: {{ current?.clientId || '—' }}</div>
                  </v-col>
                  <v-col cols="12" md="6" class="text-right">
                    <div class="caption text--secondary">Date</div>
                    <div class="font-weight-medium">{{ fmtDate(current?.invoiceDate) }}</div>
                  </v-col>
                </v-row>

                <!-- ===== INVOICE ITEMS TABLE (UPDATED WITH CHASSIS & ENGINE) ===== -->
                <v-simple-table dense class="mt-3">
                  <thead>
                    <tr>
                      <th class="text-left">Item</th>
                      <th class="text-left">Chassis No.</th>
                      <th class="text-left">Engine No.</th>
                      <th class="text-left">HSN</th>
                      <th class="text-right">Qty</th>
                      <th class="text-right">Rate</th>
                      <th class="text-right">CGST</th>
                      <th class="text-right">SGST</th>
                      <th class="text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="it in (current?.items || [])" :key="it.lineNo">
                      <td>{{ it.label }}</td>
                      <td>{{ it.chassisNumber || it.chassisNo || '—' }}</td>
                      <td>{{ it.engineNumber || '—' }}</td>
                      <td>{{ it.hsn || '—' }}</td>
                      <td class="text-right">{{ it.quantity }}</td>
                      <td class="text-right">₹{{ money(it.price) }}</td>
                      <td class="text-right">{{ it.cgst || 0 }}%</td>
                      <td class="text-right">{{ it.sgst || 0 }}%</td>
                      <td class="text-right">₹{{ money(it.totalWithTax) }}</td>
                    </tr>
                  </tbody>
                </v-simple-table>

                <v-divider class="my-3" />
                <v-row dense>
                  <v-col cols="12" md="4">Subtotal: <b>₹{{ money(current?.totals?.subtotal) }}</b></v-col>
                  <v-col cols="12" md="4">Tax: <b>₹{{ money(current?.totals?.tax) }}</b></v-col>
                  <v-col cols="12" md="4" class="text-right">Grand: <b>₹{{ money(current?.totals?.grandTotal) }}</b></v-col>
                </v-row>
              </v-card-text>
              <v-card-actions>
                <v-spacer />
                <v-btn text @click="dialogs.view=false">Close</v-btn>
              </v-card-actions>
            </v-card>
          </v-dialog>

          <!-- Quick Update Dialog -->
          <v-dialog v-if="!showAddNewSellDialog"  v-model="dialogs.update" max-width="640px" persistent>
            <v-card>
              <v-card-title class="subtitle-1">
                Update — {{ quickModel.invoiceNumber }}
                <v-spacer />
                <v-btn icon @click="dialogs.update=false"><v-icon>mdi-close</v-icon></v-btn>
              </v-card-title>
              <v-divider />
              <v-card-text>
                <v-form ref="updateForm" v-model="updateValid" lazy-validation>
                  <v-row dense>
                    <v-col cols="12" md="6">
                      <v-text-field dense outlined label="Vendor name"
                        v-model.trim="quickModel.vendorName" />
                    </v-col>

                    <v-col cols="12" md="6">
                      <v-select dense outlined :items="statusOptions" label="Status"
                        v-model="quickModel.statusType" />
                    </v-col>

                    <v-col cols="12" md="6">
                      <v-text-field dense outlined type="number" min="0"
                        label="Amount paid"
                        v-model.number="quickModel.payment.amountPaid" />
                    </v-col>

                    <v-col cols="12" md="6">
                      <v-select dense outlined :items="paymentTypes" clearable
                        label="Payment type"
                        v-model="quickModel.payment.paymentType" />
                    </v-col>

                    <v-col cols="12" md="6">
                      <v-text-field dense outlined type="number" min="0"
                        label="Due amount"
                        v-model.number="quickModel.payment.dueAmount" />
                    </v-col>

                    <v-col cols="12" md="6">
                      <v-text-field dense outlined type="number" min="0"
                        label="Change due"
                        v-model.number="quickModel.payment.changeDue" />
                    </v-col>

                    <v-col cols="12">
                      <v-text-field dense outlined label="Buyer (JSON, optional)"
                        v-model="quickModel.buyerJson" hint="Leave blank to keep existing" persistent-hint />
                    </v-col>
                    <v-col cols="12">
                      <v-text-field dense outlined label="Consignee (JSON, optional)"
                        v-model="quickModel.consigneeJson" hint="Leave blank to keep existing" persistent-hint />
                    </v-col>
                  </v-row>
                </v-form>
              </v-card-text>
              <v-card-actions>
                <v-spacer />
                <v-btn text @click="dialogs.update=false">Cancel</v-btn>
                <v-btn color="primary" :loading="saving" @click="submitQuickUpdate">
                  <v-icon left>mdi-content-save</v-icon> Save
                </v-btn>
              </v-card-actions>
            </v-card>
          </v-dialog>

          <v-snackbar v-model="snack.show" :color="snack.color" timeout="2200">
            {{ snack.text }}
          </v-snackbar>
        </v-card>
      </template>

      <!-- ===== EMBEDDED FULL EDIT VIEW ===== -->
      <template  v-else>
        <v-card class="pa-0" elevation="6">
          <v-toolbar dense flat class="px-2">
            <v-btn icon @click="closeEmbedded"><v-icon>mdi-arrow-left</v-icon></v-btn>
            <v-toolbar-title class="subtitle-1 font-weight-medium">
              Edit — {{ embedded.invoiceNumber || '—' }}
            </v-toolbar-title>
            <v-spacer />
            <v-btn small depressed color="primary" @click="reloadEmbedded">Reload</v-btn>
          </v-toolbar>
          <v-divider />
          <div style="padding:8px;">
            <SellToVendorEmbedded
              :passed-invoice-number="embedded.invoiceNumber"
              @done="closeEmbeddedAndRefresh"
            />
          </div>
        </v-card>
      </template>

      <!-- Hidden container for html2pdf rendering -->
      <div ref="pdfContainer" style="display:none;"></div>
    </div>

    <div v-if="showAddNewSellDialog">
      <NewSellToVendorForm />
    </div>    
  </div>
</template>

<script>
import axios from 'axios'
import html2pdf from 'html2pdf.js'
import SellToVendor from './sellToVendor.vue'
import NewSellToVendorForm from './sellToVendor.vue'

const SellToVendorEmbedded = {
  name: 'SellToVendorEmbedded',
  extends: SellToVendor,
  props: {
    passedInvoiceNumber: { type: String, default: null }
  },
  data () {
    return { _openedForEdit: false }
  },
  created () {
    if (this.passedInvoiceNumber && typeof this.loadSellToVendorForEdit === 'function') {
      this.$nextTick(async () => {
        await this.loadSellToVendorForEdit(this.passedInvoiceNumber)
        this._openedForEdit = true
      })
    }
  },
  watch: {
    passedInvoiceNumber: {
      async handler (inv) {
        if (!inv) return
        if (!this.vendors?.length && typeof this.fetchVendors === 'function') await this.fetchVendors()
        if (!this.inventoriesMap || !Object.keys(this.inventoriesMap).length) {
          if (typeof this.fetchInventories === 'function') await this.fetchInventories()
        }
        if (typeof this.loadSellToVendorForEdit === 'function') {
          await this.loadSellToVendorForEdit(inv)
          this._openedForEdit = true
        }
      }
    }
  },
  methods: {
    __buildFullPayload () {
      const invoiceNumber = this.invoiceNumber || this.ensureInvoiceNumber()
      return {
        invoiceNumber,
        clientId: (this.buyer?.clientId && String(this.buyer.clientId).trim()) || 'UNKNOWN',
        vendorKey: this.selectedVendorKey || null,
        vendorName: this.company?.name || null,
        invoiceDate: new Date().toISOString(),
        payment: {
          amountPaid: Number(this.amountPaid || 0),
          paymentType: this.paymentType || null,
          dueAmount: Number(this.dueAmount || 0),
          changeDue: Number(this.changeDue || 0)
        },
        items: this.mapItemsForSellToVendor(),
        totals: {
          subtotal: Number(this.subtotal || 0),
          discount: Number(this.totalDiscount || 0),
          cgst: Number(this.totalCgst || 0),
          sgst: Number(this.totalSgst || 0),
          tax: Number(this.totalTax || 0),
          grandTotal: Number(this.grandTotal || 0)
        },
        meta: {
          statusType: this.statusType || null,
          soldType: 'VENDOR'
        },
        buyer: {
          name: this.buyer?.name || '',
          gstin: this.buyer?.gstin || '',
          stateName: this.buyer?.stateName || '',
          stateCode: this.buyer?.stateCode || '',
          address: this.formatAddressPlain(this.buyer?.address || ''),
          phone: this.buyer?.phone || ''
        },
        consignee: {
          name: this.consignee?.name || '',
          gstin: this.consignee?.gstin || '',
          stateName: this.consignee?.stateName || '',
          stateCode: this.consignee?.stateCode || '',
          address: this.formatAddressPlain(this.consignee?.address || ''),

          phone: this.consignee?.phone || ''
        }
      }
    },

    async saveStatus () {
      if (!this.canSave) { this.showSnack('Select a status first.', 'error'); return }

      const payload = this.allChassisNumbers.length > 0
        ? { chassisNumbers: this.allChassisNumbers, item: { status: this.statusType, soldType: 'VENDOR' } }
        : { item: { status: this.statusType, soldType: 'VENDOR' } }

      this.saving = true
      try {
        const res = await fetch(this.updateEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data?.message || 'Update failed')

        const ok = await this.updateSellToVendor()
        if (!ok) throw new Error('Sell-to-vendor update failed')

        const exported = await this.renderPdf('export')
        if (!exported || !exported.blob) throw new Error('PDF export failed')
        const uploadOk = await this.uploadPdfToS3(exported.blob)

        const invoiceOk = await this.saveInvoiceRecord()
        if (uploadOk) this.showSnack('Invoice PDF uploaded to S3.', 'success')
        else this.showSnack('Status saved, but PDF upload failed.', 'warning')

        if (invoiceOk) await this.createLedgerEntry()

        this.$emit('done')

      } catch (e) {
        this.showSnack(`Failed: ${e.message}`, 'error')
      } finally {
        this.saving = false
      }
    },

    async updateSellToVendor () {
      try {
        const body = this.__buildFullPayload()
        const res = await fetch(`${process.env.VUE_APP_AGENCY_BACKEND_URL}updateselltovendor`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body)
        })
        const j = await res.json().catch(() => ({}))
        if (!res.ok || j?.ok === false) throw new Error(j?.message || 'Update failed')
        this.showSnack('Sell-to-vendor updated.', 'success')
        return true
      } catch (e) {
        this.showSnack(`Update failed: ${e.message}`, 'error')
        return false
      }
    }
  }
}

export default {
  name: 'SellToVendorTable',
  components: { SellToVendorEmbedded, NewSellToVendorForm },
  data () {
    return {
      base: process.env.VUE_APP_AGENCY_BACKEND_URL,
      loading: false,
      rows: [],
      allRows: [],
      headers: [
        { text: 'S.No', value: 'serial', width: 100, sortable: false },
        { text: 'Date', value: 'invoiceDate', width: 120 },
        { text: 'Client ID', value: 'clientId', width: 160 },
        { text: 'Vendor', value: 'vendorName' },
        { text: 'Invoice', value: 'invoiceNumber', width: 230 },
        { text: 'Grand Total', value: 'totals.grandTotal', align: 'end', width: 140 },
        { text: 'Vehicle Count', value: 'itemsDisplay', align: 'center', width: 140 },
        { text: 'Status', value: 'meta.statusType', width: 100 },
        { text: 'Actions', value: 'actions', sortable: false, align: 'end', width: 150 }
      ],
      filters: { invoiceNumber: null, chassisNumber: null, clientId: null, name: null, from: null, to: null, statusD: null },
      menus: { from: false, to: false },
      dialogs: { view: false, update: false },
      current: null,
      quickModel: {
        invoiceNumber: null,
        vendorName: null,
        statusType: null,
        payment: { amountPaid: 0, paymentType: null, dueAmount: 0, changeDue: 0 },
        buyerJson: '',
        consigneeJson: ''
      },
      statusOptions: ['SOLD', 'PENDING', 'CANCELLED', 'ACTIVE', 'INACTIVE'],
      paymentTypes: ['Cash', 'Card', 'UPI', 'Bank Transfer', 'Other'],
      updateValid: true,
      saving: false,
      embedded: { show: false, invoiceNumber: null },
      snack: { show: false, color: 'success', text: '' },
      pdfBusy: false,
      showAddNewSellDialog: false
    }
  },

  computed: {
    currentDate () {
      return new Date().toLocaleDateString('en-IN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    },
    totalGrandTotal () {
      return this.rows.reduce((sum, row) => sum + (row.totals?.grandTotal || 0), 0)
    },
    totalVehicleCount () {
      return this.rows.reduce((sum, row) => sum + (row.items?.length || 0), 0)
    }
  },

  created () { this.loadAll() },

  watch: {
    'embedded.show' (now, prev) { if (prev && !now) this.loadAll() }
  },

  methods: {
    showAddNewSellDialogFunction () {
      this.showAddNewSellDialog = true
    },
    backtoTable () {
      this.showAddNewSellDialog = false
      this.loadAll()
    },
    url (name, arg) {
      const B = this.base
      switch (name) {
        case 'getAll': return `${B}getallselltovendor`
        case 'getByInvoice': return `${B}getselltovendorbyinvoicenumber/${encodeURIComponent(arg)}`
        case 'getSellToVendorByChassis': return `${B}getSellToVendorByChassis/${encodeURIComponent(arg.chassisNumber)}`
        case 'getByStatus': {
          const status = typeof arg === 'string' ? arg : (arg && (arg.statusD || arg.status)) || ''
          return `${B}getSellToVendorByStatus/${encodeURIComponent(status)}`
        }
        case 'getByClient': {
          const { clientId, from, to } = arg
          let u = `${B}getselltovendorbyclientid/${encodeURIComponent(clientId)}`
          const qp = []
          if (from) qp.push(`from=${encodeURIComponent(from)}`)
          if (to) qp.push(`to=${encodeURIComponent(to)}`)
          if (qp.length) u += `?${qp.join('&')}`
          return u
        }
        case 'getByName': return `${B}getselltovendorbyname?name=${encodeURIComponent(arg.name)}`
        case 'getByDates': return `${B}getselltovendorbydaterange?from=${encodeURIComponent(arg.from)}&to=${encodeURIComponent(arg.to)}`
        case 'update': return `${B}updateselltovendor`
        default: return B
      }
    },

    sortByDateDesc (arr) {
      return arr.slice().sort((a, b) => {
        const ta = toTime(a?.invoiceDate)
        const tb = toTime(b?.invoiceDate)
        return tb - ta
      })
    },

    async loadAll () {
      this.loading = true
      try {
        const { data } = await axios.get(this.url('getAll'))
        const items = data?.items || []
        this.allRows = this.sortByDateDesc(items)
        this.rows = this.allRows.slice()
      } catch (e) {
        this.notify('Failed to load records', 'error')
      } finally { this.loading = false }
    },

    async runSearch () {
      this.loading = true
      try {
        if (!this.allRows || !this.allRows.length) {
          await this.loadAll()
        }

        const {
          invoiceNumber,
          chassisNumber,
          clientId,
          name,
          from,
          to,
          statusD
        } = this.filters

        let filtered = this.allRows.slice()

        if (invoiceNumber && String(invoiceNumber).trim()) {
          const q = String(invoiceNumber).trim()
          filtered = filtered.filter(it => String(it.invoiceNumber || '').trim() === q)
        }

        if (clientId && String(clientId).trim()) {
          const q = String(clientId).trim()
          filtered = filtered.filter(it => String(it.clientId || '').trim() === q)
        }

        if (statusD && String(statusD).trim()) {
          const q = String(statusD).trim().toUpperCase()
          filtered = filtered.filter(it => String((it.meta && it.meta.statusType) || '').toUpperCase() === q)
        }

        if (chassisNumber && String(chassisNumber).trim()) {
          const q = String(chassisNumber).trim().toLowerCase()
          filtered = filtered.filter(it => {
            const c = String(it.chassisNumber || it.chassisNo || '').toLowerCase()
            return c.includes(q)
          })
        }

        if (name && String(name).trim()) {
          const q = String(name).trim().toLowerCase()
          filtered = filtered.filter(it => {
            const vendor = String(it.vendorName || '').toLowerCase()
            const buyer = String((it.buyer && it.buyer.name) || '').toLowerCase()
            const consignee = String((it.consignee && it.consignee.name) || '').toLowerCase()
            return vendor.includes(q) || buyer.includes(q) || consignee.includes(q)
          })
        }

        if (from || to) {
          const itemDateYmd = (iso) => {
            if (!iso) return null
            try {
              const d = new Date(iso)
              if (isNaN(d.getTime())) return null
              const yyyy = d.getFullYear()
              const mm = String(d.getMonth() + 1).padStart(2, '0')
              const dd = String(d.getDate()).padStart(2, '0')
              return `${yyyy}-${mm}-${dd}`
            } catch {
              return null
            }
          }

          const fromYmd = from ? String(from).slice(0, 10) : null
          const toYmd = to ? String(to).slice(0, 10) : null

          filtered = filtered.filter(it => {
            const itYmd = itemDateYmd(it.invoiceDate)
            if (!itYmd) return false
            if (fromYmd && toYmd) {
              return itYmd >= fromYmd && itYmd <= toYmd
            } else if (fromYmd) {
              return itYmd >= fromYmd
            } else if (toYmd) {
              return itYmd <= toYmd
            }
            return true
          })
        }

        this.rows = this.sortByDateDesc(filtered)
        if (!this.rows.length) this.notify('No records found', 'warning')
      } catch (e) {
        console.error(e)
        this.notify('Search failed', 'error')
      } finally {
        this.loading = false
      }
    },

    resetFilters () {
      this.filters = { invoiceNumber: null, chassisNumber: null, clientId: null, name: null, from: null, to: null, statusD: null }
      this.rows = this.allRows.slice()
    },

    // ===== OPTIMIZED PDF DOWNLOAD =====
    async downloadPdf () {
      if (!this.rows.length) {
        this.notify('No records to export', 'warning')
        return
      }

      if (this.pdfBusy) return
      this.pdfBusy = true

      try {
        const pageSize = 30
        const totalRows = this.rows.length
        const totalPages = Math.max(1, Math.ceil(totalRows / pageSize))

        const fromText = this.filters.from ? this.displayDateSlash(this.filters.from) : 'All'
        const toText = this.filters.to ? this.displayDateSlash(this.filters.to) : 'All'

        const pagesHtml = []

        for (let p = 0; p < totalPages; p++) {
          const start = p * pageSize
          const end = start + pageSize
          const pageRows = this.rows.slice(start, end)

          const rowsHtml = pageRows.map((row, idx) => {
            const serial = start + idx + 1
            const dateStr = this.fmtDate(row.invoiceDate)
            const invoice = row.invoiceNumber || ''
            const clientId = row.clientId || ''
            const vendor = row.vendorName || ''
            const vehicleCount = row.items?.length || 0
            const grandTotal = this.money(row.totals?.grandTotal || 0)
            const status = row.meta?.statusType || ''

            return `
              <tr>
                <td class="text-center">${serial}</td>
                <td>${dateStr}</td>
                <td>${clientId}</td>
                <td>${vendor}</td>
                <td>${invoice}</td>
                <td class="text-center">${vehicleCount}</td>
                <td class="text-right">${grandTotal}</td>
                <td class="text-center">${status}</td>
              </tr>
            `
          }).join('')

          pagesHtml.push(`
            <div class="pdf-page">
              <div class="pdf-header-main">Ansari Automobiles</div>
              <div class="pdf-subheader">BADI KAMHARIYA BY PASS ROAD MAU</div>
              <div class="pdf-subheader">GSTIN/UIN- 09AJPBA0437B1ZY</div>
              <div class="pdf-subheader">SELL TO VENDOR TRANSACTIONS</div>
              <div class="pdf-subheader">
                All transactions for (${fromText} to ${toText})
              </div>
              <div class="pdf-meta">
                <span>Generated: ${this.currentDate}</span>
                <div><strong>Total Grand Total: </strong>₹${this.money(this.totalGrandTotal)}</div>
                <div><strong>Total Vehicles: </strong>${this.totalVehicleCount}</div>
                <span>Page ${p + 1} of ${totalPages}</span>
              </div>

              <table class="pdf-table">
                <thead>
                  <tr>
                    <th class="text-center" style="width:40px;">S.No</th>
                    <th style="width:90px;">DATE</th>
                    <th style="width:170px;">CLIENT ID</th>
                    <th>VENDOR</th>
                    <th style="width:220px;">INVOICE</th>
                    <th class="text-center" style="width:60px;">VEH</th>
                    <th class="text-right" style="width:130px;">GRAND TOTAL (₹)</th>
                    <th class="text-center" style="width:90px;">STATUS</th>
                  </tr>
                </thead>
                <tbody>
                  ${rowsHtml}
                </tbody>
              </table>
            </div>
          `)
        }

        const container = this.$refs.pdfContainer
        if (!container) {
          this.notify('PDF container missing', 'error')
          return
        }

        container.innerHTML = ``
          + `<div id="sell-to-vendor-pdf-root" class="pdf-root">`
          + `<style>
              .pdf-root {
                font-family: "Courier New", monospace;
                font-size: 9pt;
                color: #000;
              }
              .pdf-page {
                padding: 18pt 18pt 12pt 18pt;
                page-break-after: always;
              }
              .pdf-page:last-child {
                page-break-after: auto;
              }
              .pdf-header-main {
                text-align: center;
                font-weight: bold;
                font-size: 11pt;
              }
              .pdf-subheader {
                text-align: center;
                font-size: 9pt;
              }
              .pdf-meta {
                display: flex;
                justify-content: space-between;
                font-size: 8pt;
                margin-top: 6pt;
                margin-bottom: 6pt;
              }
              .pdf-table {
                width: 100%;
                border-collapse: collapse;
                margin-top: 6pt;
                table-layout: fixed;
              }
              .pdf-table th,
              .pdf-table td {
                padding: 2pt 3pt;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
              }
              .pdf-table thead th {
                font-weight: bold;
              }
              .text-right { text-align: right; }
              .text-center { text-align: center; }
            </style>
            ${pagesHtml.join('')}
          </div>
        `

        await this.$nextTick()

        const el = container.querySelector('#sell-to-vendor-pdf-root')
        if (!el) {
          this.notify('PDF element not found', 'error')
          return
        }

        const opt = {
          margin: 10,
          filename: `sell-to-vendor-records-${new Date().toISOString().slice(0, 10)}.pdf`,
          image: { type: 'jpeg', quality: 0.95 },
          html2canvas: {
            scale: 1.2,
            useCORS: true
          },
          jsPDF: { unit: 'pt', format: 'a4', orientation: 'landscape' }
        }

        const pdfUrl = await html2pdf().set(opt).from(el).outputPdf('bloburl')

        const win = window.open(pdfUrl, '_blank')
        if (!win) {
          const link = document.createElement('a')
          link.href = pdfUrl
          link.download = opt.filename
          document.body.appendChild(link)
          link.click()
          document.body.removeChild(link)
        }

        if (typeof pdfUrl === 'string' && pdfUrl.startsWith('blob:')) {
          setTimeout(() => {
            URL.revokeObjectURL(pdfUrl)
          }, 10000)
        }
        container.innerHTML = ''

        this.notify('PDF generated successfully', 'success')
      } catch (error) {
        console.error('PDF generation failed:', error)
        this.notify('PDF generation failed', 'error')
      } finally {
        this.pdfBusy = false
      }
    },

    downloadExcel () {
      if (!this.rows.length) {
        this.notify('No records to export', 'warning')
        return
      }

      try {
        const excelHeaders = [
          'S.No',
          'Invoice Number',
          'Date (DD/MM/YYYY)',
          'Vendor Name',
          'Client ID',
          'Grand Total (₹)',
          'Vehicle Count',
          'Status'
        ]

        const dataRows = this.rows.map((row, index) => [
          index + 1,
          row.invoiceNumber || '',
          this.fmtDate(row.invoiceDate),
          row.vendorName || '',
          row.clientId || '',
          this.money(row.totals?.grandTotal || 0),
          row.items?.length || 0,
          row.meta?.statusType || ''
        ])

        const escapeCsv = (value) => {
          if (value === null || value === undefined) return ''
          const str = String(value)
          if (/[",\n\r\t]/.test(str)) {
            return '"' + str.replace(/"/g, '""') + '"'
          }
          return str
        }

        const csvContent = [
          excelHeaders.map(escapeCsv).join(','),
          ...dataRows.map(row => row.map(escapeCsv).join(','))
        ].join('\r\n')

        const blob = new Blob(['\uFEFF' + csvContent], {
          type: 'text/csv;charset=utf-8;'
        })
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        const timestamp = new Date().toISOString().slice(0, 10)

        link.href = url
        link.setAttribute('download', `sell-to-vendor-records-${timestamp}.csv`)
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)

        this.notify('Excel file downloaded successfully', 'success')
      } catch (error) {
        console.error('Excel download failed:', error)
        this.notify('Failed to generate Excel file', 'error')
      }
    },

    onRowClick (item) { this.openEmbeddedEditor(item) },
    openEmbeddedEditor (item) {
      const inv = item?.invoiceNumber
      if (!inv) { this.notify('Missing invoice number for edit.', 'error'); return }
      this.embedded.invoiceNumber = inv
      this.embedded.show = true
    },
    closeEmbedded () { this.embedded.show = false },
    closeEmbeddedAndRefresh () { this.embedded.show = false; this.loadAll() },
    reloadEmbedded () {
      const inv = this.embedded.invoiceNumber
      this.embedded.invoiceNumber = null
      this.$nextTick(() => { this.embedded.invoiceNumber = inv })
    },

    openView (item) { this.current = item; this.dialogs.view = true },

    openQuickUpdate (item) {
      this.quickModel = {
        invoiceNumber: item.invoiceNumber,
        vendorName: item.vendorName || '',
        statusType: (item.meta && item.meta.statusType) || '',
        payment: {
          amountPaid: item.payment?.amountPaid || 0,
          paymentType: item.payment?.paymentType || null,
          dueAmount: item.payment?.dueAmount || 0,
          changeDue: item.payment?.changeDue || 0
        },
        buyerJson: '',
        consigneeJson: ''
      }
      this.dialogs.update = true
    },

    async submitQuickUpdate () {
      if (!this.quickModel.invoiceNumber) return
      const body = {
        invoiceNumber: this.quickModel.invoiceNumber,
        vendorName: this.quickModel.vendorName,
        meta: { statusType: this.quickModel.statusType },
        payment: {
          amountPaid: Number(this.quickModel.payment.amountPaid || 0),
          paymentType: this.quickModel.payment.paymentType || null,
          dueAmount: Number(this.quickModel.payment.dueAmount || 0),
          changeDue: Number(this.quickModel.payment.changeDue || 0)
        }
      }
      try {
        if (this.quickModel.buyerJson && this.quickModel.buyerJson.trim()) body.buyer = JSON.parse(this.quickModel.buyerJson)
      } catch {}
      try {
        if (this.quickModel.consigneeJson && this.quickModel.consigneeJson.trim()) body.consignee = JSON.parse(this.quickModel.consigneeJson)
      } catch {}
      this.saving = true
      try {
        const { data } = await axios.patch(this.url('update'), body)
        this.notify('Updated successfully', 'success')
        this.dialogs.update = false
        const updated = data?.item
        if (updated) {
          const i = this.rows.findIndex(r => r.pk === updated.pk && r.sk === updated.sk)
          if (i >= 0) this.$set(this.rows, i, updated)

          const j = this.allRows.findIndex(r => r.pk === updated.pk && r.sk === updated.sk)
          if (j >= 0) this.$set(this.allRows, j, updated)

          this.allRows = this.sortByDateDesc(this.allRows)
          this.rows = this.sortByDateDesc(this.rows)
        } else {
          await this.loadAll()
        }
      } catch (e) {
        this.notify('Update failed', 'error')
      } finally { this.saving = false }
    },

    // Indian number formatting: 10,00,000.00
    money (v) {
      const num = Number(v || 0)
      if (isNaN(num)) return '0.00'
      return num.toLocaleString('en-IN', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      })
    },

    fmtDate (iso) {
      if (!iso) return '—'
      try {
        const d = new Date(iso)
        if (isNaN(d.getTime())) return '—'
        const dd = String(d.getDate()).padStart(2, '0')
        const mm = String(d.getMonth() + 1).padStart(2, '0')
        const yyyy = d.getFullYear()
        return `${dd}/${mm}/${yyyy}`
      } catch {
        return '—'
      }
    },

    displayDateSlash (iso) {
      if (!iso) return ''
      try {
        const d = new Date(iso)
        if (isNaN(d.getTime())) return ''
        const dd = String(d.getDate()).padStart(2, '0')
        const mm = String(d.getMonth() + 1).padStart(2, '0')
        const yyyy = d.getFullYear()
        return `${dd}/${mm}/${yyyy}`
      } catch {
        return ''
      }
    },

    getSerial (item) {
      const idx = this.rows.findIndex(r => r.pk === item.pk && r.sk === item.sk)
      return idx >= 0 ? (idx + 1) : '—'
    },

    statusColor (s) {
      const k = String(s || '').toUpperCase()
      if (k === 'SOLD') return 'green'
      if (k === 'PENDING') return 'orange'
      if (k === 'CANCELLED') return 'red'
      if (k === 'ACTIVE') return 'blue'
      return 'grey'
    },

    notify (text, color = 'success') { this.snack = { show: true, color, text } }
  }
}

function toTime (iso) {
  if (!iso) return 0
  try {
    const t = new Date(iso).getTime()
    return isNaN(t) ? 0 : t
  } catch {
    return 0
  }
}
</script>

<style scoped>
.subtitle-1.font-weight-medium { letter-spacing: .2px; }
</style>
