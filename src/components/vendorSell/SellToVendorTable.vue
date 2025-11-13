<template>
  <div style="margin:10px;">
    <!-- ===== LIST VIEW ===== -->
    <template v-if="!embedded.show">
      <v-card class="pa-4" elevation="6">
        <v-toolbar flat dense class="mb-3">
          <v-toolbar-title class="subtitle-1 font-weight-medium">Sell To Vendor — Records</v-toolbar-title>
          <v-spacer />
          <v-btn small depressed color="primary" @click="loadAll" :loading="loading">Refresh</v-btn>
        </v-toolbar>

        <!-- Filters -->
        <v-card class="pa-3 mb-3" outlined>
          <v-row dense>
            <v-col cols="12" md="3">
              <v-text-field dense outlined clearable
                v-model.trim="filters.invoiceNumber"
                label="Invoice number" prepend-inner-icon="mdi-pound"
                @click:clear="loadAll"/>
            </v-col>
            <v-col cols="12" md="3">
              <v-text-field dense outlined clearable
                v-model.trim="filters.clientId"
                label="Client ID" prepend-inner-icon="mdi-account"
                @click:clear="loadAll"/>
            </v-col>
            <v-col cols="12" md="3">
              <v-select dense outlined clearable
                v-model="filters.statusD"
                label="Select Status" prepend-inner-icon="mdi-clock"
                :items="['SOLD', 'ACTIVE', 'PENDING', 'CANCELLED', 'INACTIVE']"
                @click:clear="loadAll"/>
            </v-col>
            <v-col cols="12" md="3">
              <v-text-field dense outlined clearable
                v-model.trim="filters.chassisNumber"
                label="Chassis Number"
                prepend-inner-icon="mdi-account"
                @click:clear="loadAll"/>
            </v-col>
            <v-col cols="12" md="3">
              <v-text-field dense outlined clearable
                v-model.trim="filters.name"
                label="Exact Name (vendor/buyer/consignee)"
                prepend-inner-icon="mdi-card-account-details"
                @click:clear="loadAll"/>
            </v-col>

            <v-col cols="12" md="3">
              <v-menu v-model="menus.from" :close-on-content-click="false" max-width="320" offset-y>
                <template v-slot:activator="{ on, attrs }">
                  <v-text-field v-bind="attrs" v-on="on" dense outlined readonly clearable
                    label="From (YYYY-MM-DD)" prepend-inner-icon="mdi-calendar"
                    :value="filters.from" @click:clear="filters.from=null"/>
                </template>
                <v-date-picker v-model="filters.from" @input="menus.from=false" scrollable />
              </v-menu>
            </v-col>

            <v-col cols="12" md="3">
              <v-menu v-model="menus.to" :close-on-content-click="false" max-width="320" offset-y>
                <template v-slot:activator="{ on, attrs }">
                  <v-text-field v-bind="attrs" v-on="on" dense outlined readonly clearable
                    label="To (YYYY-MM-DD)" prepend-inner-icon="mdi-calendar"
                    :value="filters.to" @click:clear="filters.to=null"/>
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
        <v-data-table
          :headers="headers"
          :items="rows"
          :loading="loading"
          :items-per-page="10"
          :footer-props="{ itemsPerPageOptions: [10, 20, 30, 40] }"
          class="elevation-1"
          item-key="pk"
          dense
        >
          <!-- @click:row="onRowClick" -->
          <template v-slot:item.invoiceDate="{ item }">
            {{ fmtDate(item.invoiceDate) }}
          </template>

          <template v-slot:item.totals.grandTotal="{ item }">
            ₹{{ money(item.totals && item.totals.grandTotal) }}
          </template>

          <template v-slot:item.payment.amountPaid="{ item }">
            ₹{{ money(item.payment && item.payment.amountPaid) }}
          </template>

          <template v-slot:item.payment.dueAmount="{ item }">
            ₹{{ money(item.payment && item.payment.dueAmount) }}
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
            <div class="pa-6 text-center grey--text">No records. Try changing filters or click Refresh.</div>
          </template>
        </v-data-table>

        <!-- View Dialog -->
        <v-dialog v-model="dialogs.view" max-width="900px" scrollable>
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

              <v-simple-table dense class="mt-3">
                <thead>
                  <tr>
                    <th class="text-left">Item</th>
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
        <v-dialog v-model="dialogs.update" max-width="640px" persistent>
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
    <template v-else>
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
          <!-- Use compiled SFC, no runtime compile -->
          <SellToVendorEmbedded :passed-invoice-number="embedded.invoiceNumber" @done="closeEmbeddedAndRefresh"/>
        </div>
      </v-card>
    </template>
  </div>
</template>

<script>
import axios from 'axios'
// Adjust path/case if needed:
import SellToVendor from './sellToVendor.vue'

/**
 * Embedded editor that:
 *  - loads by invoice number
 *  - forces "edit mode"
 *  - overrides updateSellToVendor to send FULL BODY (items, totals, buyer/consignee, payment, meta)
 *    so edit/update behaves exactly like save/add (recalcs included)
 */
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
    // Build the SAME payload shape as addSellToVendor()
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
        items: this.mapItemsForSellToVendor(),   // uses current selectedItems (recalculated)
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

    // FORCE "edit" path in saveStatus()
    async saveStatus () {
      if (!this.canSave) { this.showSnack('Select a status first.', 'error'); return }

      const payload = this.allChassisNumbers.length > 0
        ? { chassisNumbers: this.allChassisNumbers, item: { status: this.statusType, soldType: 'VENDOR' } }
        : { item: { status: this.statusType, soldType: 'VENDOR' } }

      this.saving = true
      try {
        // 1) Update inventory statuses
        const res = await fetch(this.updateEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data?.message || 'Update failed')

        // 2) UPDATE the SellToVendor record with FULL BODY (not partial)
        const ok = await this.updateSellToVendor()   // overridden below
        if (!ok) throw new Error('Sell-to-vendor update failed')

        // 3) Export PDF & upload
        const exported = await this.renderPdf('export')
        if (!exported || !exported.blob) throw new Error('PDF export failed')
        const uploadOk = await this.uploadPdfToS3(exported.blob)

        // 4) Save invoice record
        const invoiceOk = await this.saveInvoiceRecord()
        if (uploadOk) this.showSnack('Invoice PDF uploaded to S3.', 'success')
        else this.showSnack('Status saved, but PDF upload failed.', 'warning')

        // 5) Ledger entry
        if (invoiceOk) await this.createLedgerEntry()

        // close embedded after a successful full flow
        this.$emit('done')

      } catch (e) {
        this.showSnack(`Failed: ${e.message}`, 'error')
      } finally {
        this.saving = false
      }
    },

    // ✅ Override: update full record (items + totals + parties + payment + meta)
    async updateSellToVendor () {
      try {
        const body = this.__buildFullPayload()
        // Use same endpoint name your original update used
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
  components: { SellToVendorEmbedded },
  data () {
    return {
      base: process.env.VUE_APP_AGENCY_BACKEND_URL,
      loading: false,
      rows: [],
      headers: [
        { text: 'Invoice', value: 'invoiceNumber', width: 140 },
        { text: 'Date', value: 'invoiceDate', width: 120 },
        { text: 'Vendor', value: 'vendorName' },
        { text: 'Client ID', value: 'clientId', width: 140 },
        { text: 'Grand Total', value: 'totals.grandTotal', align: 'end', width: 140 },
        { text: 'Paid', value: 'payment.amountPaid', align: 'end', width: 120 },
        { text: 'Due', value: 'payment.dueAmount', align: 'end', width: 120 },
        { text: 'Status', value: 'meta.statusType', width: 130 },
        { text: 'Actions', value: 'actions', sortable: false, align: 'end', width: 170 }
      ],
      filters: { invoiceNumber: null, chassisNumber:null, clientId: null, name: null, from: null, to: null, statusD: null },
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

      snack: { show: false, color: 'success', text: '' }
    }
  },

  created () { this.loadAll() },

  watch: {
    'embedded.show'(now, prev) { if (prev && !now) this.loadAll() }
  },

  methods: {
    // ---- endpoints ----
    url (name, arg) {
      const B = this.base
      console.log('name', name)
      console.log('arg', arg)
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

    async loadAll () {
      this.loading = true
      try {
        const { data } = await axios.get(this.url('getAll'))
        this.rows = data?.items || []
      } catch (e) {
        this.notify('Failed to load records', 'error')
      } finally { this.loading = false }
    },

    async runSearch () {
      const { invoiceNumber, chassisNumber, clientId, name, from, to, statusD } = this.filters
      this.loading = true
      console.log('chassisNumber', chassisNumber)
      try {
        let data
        if (invoiceNumber) {
          const r = await axios.get(this.url('getByInvoice', invoiceNumber))
          const item = r.data?.item
          data = item ? [item] : []
        } else if (clientId) {
          const r = await axios.get(this.url('getByClient', { clientId, from, to }))
          data = r.data?.items || []
        } else if (statusD) {
          const r = await axios.get(this.url('getByStatus', statusD))
          data = r.data?.items || []
        } else if (name) {
          const r = await axios.get(this.url('getByName', { name }))
          data = r.data?.items || []
        } else if (chassisNumber) {
          const r = await axios.get(this.url('getSellToVendorByChassis', { chassisNumber }))
          data = r.data?.items || []
        } else if (from && to) {
          const r = await axios.get(this.url('getByDates', { from, to }))
          data = r.data?.items || []
        } else {
          const r = await axios.get(this.url('getAll'))
          data = r.data?.items || []
        }
        this.rows = data
        if (!data.length) this.notify('No records found', 'warning')
      } catch (e) {
        this.notify('Search failed', 'error')
      } finally { this.loading = false }
    },

    resetFilters () {
      this.filters = { invoiceNumber: null, chassisNumber:null, clientId: null, name: null, from: null, to: null, statusD: null }
      this.loadAll()
    },

    // ---- actions ----
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
          else this.loadAll()
        } else {
          this.loadAll()
        }
      } catch (e) {
        this.notify('Update failed', 'error')
      } finally { this.saving = false }
    },

    // ---- helpers ----
    money (v) { return Number(v || 0).toFixed(2) },
    fmtDate (iso) { if (!iso) return '—'; try { return new Date(iso).toISOString().slice(0, 10) } catch { return '—' } },
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
</script>

<style scoped>
.subtitle-1.font-weight-medium { letter-spacing: .2px; }
</style>
