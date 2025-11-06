<template>
    <div style="margin:10px;">
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
                <v-text-field
                    dense outlined clearable
                    v-model.trim="filters.invoiceNumber"
                    label="Invoice number"
                    prepend-inner-icon="mdi-pound"
                    @click:clear="loadAll"
                />
                </v-col>

                <v-col cols="12" md="3">
                <v-text-field
                    dense outlined clearable
                    v-model.trim="filters.clientId"
                    label="Client ID"
                    prepend-inner-icon="mdi-account"
                    @click:clear="loadAll"
                />
                </v-col>

                <v-col cols="12" md="3">
                <!-- <v-text-field
                    dense outlined clearable
                    v-model.trim="filters.clientId"
                    label="Status"
                    prepend-inner-icon="mdi-account"
                    @click:clear="loadAll"
                /> -->
                <v-select
                    dense
                    outlined
                    clearable
                    v-model="filters.statusD"
                    label="Select Status"
                    prepend-inner-icon="mdi-clock"
                    :items="['SOLD', 'ACTIVE', 'PENDING', 'CANCELLED', 'INACTIVE']"
                    @click:clear="loadAll"
                />
                    <!-- @change="onStatusChange" -->

                </v-col>

                <v-col cols="12" md="3">
                <v-text-field
                    dense outlined clearable
                    v-model.trim="filters.name"
                    label="Exact Name (vendor/buyer/consignee)"
                    prepend-inner-icon="mdi-card-account-details"
                    @click:clear="loadAll"
                />
                </v-col>

                <v-col cols="12" md="3">
                <v-menu
                    v-model="menus.from"
                    :close-on-content-click="false"
                    max-width="320"
                    offset-y
                >
                    <template v-slot:activator="{ on, attrs }">
                    <v-text-field
                        v-bind="attrs" v-on="on"
                        dense outlined readonly clearable
                        label="From (YYYY-MM-DD)"
                        prepend-inner-icon="mdi-calendar"
                        :value="filters.from"
                        @click:clear="filters.from=null"
                    />
                    </template>
                    <v-date-picker v-model="filters.from" @input="menus.from=false" scrollable />
                </v-menu>
                </v-col>

                <v-col cols="12" md="3">
                <v-menu
                    v-model="menus.to"
                    :close-on-content-click="false"
                    max-width="320"
                    offset-y
                >
                    <template v-slot:activator="{ on, attrs }">
                    <v-text-field
                        v-bind="attrs" v-on="on"
                        dense outlined readonly clearable
                        label="To (YYYY-MM-DD)"
                        prepend-inner-icon="mdi-calendar"
                        :value="filters.to"
                        @click:clear="filters.to=null"
                    />
                    </template>
                    <v-date-picker v-model="filters.to" @input="menus.to=false" scrollable />
                </v-menu>
                </v-col>

                <v-col cols="12" md="3" >
                    <v-btn  color="primary" @click="runSearch" :loading="loading">
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
            :items-per-page="15"
            :footer-props="{ itemsPerPageOptions: [10, 15, 25, 50] }"
            class="elevation-1"
            item-key="pk"
            dense
            >
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
                    <v-btn icon small color="primary" v-on="on" @click="openView(item)">
                    <v-icon small>mdi-eye</v-icon>
                    </v-btn>
                </template>
                <span>View</span>
                </v-tooltip>

                <!-- EDIT -> send item to Add component -->
                <v-tooltip top>
                    <template v-slot:activator="{ on }">
                        <v-btn icon small color="teal" v-on="on" @click="emitEdit(item)">
                        <v-icon small>mdi-pencil</v-icon>
                        </v-btn>
                    </template>
                    <span>Edit in Add page</span>
                </v-tooltip>

                <!-- QUICK UPDATE dialog -->
                <v-tooltip top>
                <template v-slot:activator="{ on }">
                    <v-btn icon small color="orange darken-2" v-on="on" @click="openQuickUpdate(item)">
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

                    <!-- Optional passthroughs -->
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
    </div>
</template>

<script>
import axios from 'axios'

export default {
  name: 'SellToVendorTable',
  props: {
    /** If you want this table to push records into your existing Add component,
     *  listen to @edit-record in the parent and forward the payload.
     */
  },
  data () {
    return {
      base: process.env.VUE_APP_AGENCY_BACKEND_URL, // must end with '/'
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
        { text: 'Actions', value: 'actions', sortable: false, align: 'end', width: 150 }
      ],
      filters: {
        invoiceNumber: null,
        clientId: null,
        name: null,
        from: null,
        statusD: null,
        to: null
      },
      menus: { from: false, to: false },

      // dialogs
      dialogs: { view: false, update: false },
      current: null,

      // quick update model
      quickModel: {
        invoiceNumber: null,
        vendorName: null,
        statusType: null,
        payment: { amountPaid: 0, paymentType: null, dueAmount: 0, changeDue: 0 },
        buyerJson: '',
        consigneeJson: ''
      },
      statusOptions: ['SOLD', 'PENDING', 'CANCELLED'],
      paymentTypes: ['Cash', 'Card', 'UPI', 'Bank Transfer', 'Other'],
      updateValid: true,
      saving: false,

      snack: { show: false, color: 'success', text: '' }
    }
  },

  created () {
    this.loadAll()
  },

  methods: {
    // ---- endpoints (adjust names here if your routes differ) ----
    url (name, arg) {
      // Using lower-case endpoints to match your POST 'addselltovendor'
      const B = this.base
      console.log('B', B)
      console.log('arg', arg)
      switch (name) {
        case 'getAll': return `${B}getallselltovendor`
        case 'getByInvoice': return `${B}getselltovendorbyinvoicenumber/${encodeURIComponent(arg)}`
        case 'getByStatus': return `${B}getSellToVendorByStatus/${encodeURIComponent(arg)}`
        case 'getByClient': {
          const { clientId, from, to } = arg
          let u = `${B}getselltovendorbyclientid/${encodeURIComponent(clientId)}`
          const qp = []
          if (from) qp.push(`from=${encodeURIComponent(from)}`)
          if (to) qp.push(`to=${encodeURIComponent(to)}`)
          if (qp.length) u += `?${qp.join('&')}`
          return u
        }
        case 'getByName': {
          const { name } = arg
          return `${B}getselltovendorbyname?name=${encodeURIComponent(name)}`
        }
        case 'getByDates': {
          const { from, to } = arg
          return `${B}getselltovendorbydaterange?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`
        }
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
      } finally {
        this.loading = false
      }
    },

    async runSearch () {
      const { invoiceNumber, clientId, name, from, to, statusD } = this.filters
      this.loading = true
      try {
        let data
        if (invoiceNumber) {
          const r = await axios.get(this.url('getByInvoice', invoiceNumber))
          const item = r.data?.item
          data = item ? [item] : []
        } else if (clientId) {
          const r = await axios.get(this.url('getByClient', { clientId, from, to }))
          data = r.data?.items || []
        } 
        else if (statusD) {
          const r = await axios.get(this.url('getByStatus', { statusD }))
          data = r.data?.items || []
        }
        else if (name) {
          const r = await axios.get(this.url('getByName', { name }))
          data = r.data?.items || []
        }
         else if (from && to) {
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
      } finally {
        this.loading = false
      }
    },

    resetFilters () {
      this.filters = { invoiceNumber: null, clientId: null, name: null, from: null, to: null }
      this.loadAll()
    },

    // ---- actions ----
    openView (item) {
      this.current = item
      this.dialogs.view = true
    },

    emitEdit (item) {
      // Send the complete record so your Add component can pre-fill
      // Parent example:
      // <SellToVendorTable @edit-record="prefillAddForm" />
      this.$emit('edit-record', item)
      this.notify('Opening in edit form…', 'info')
    },

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
        buyerJson: '',      // optional overrides
        consigneeJson: ''
      }
      this.dialogs.update = true
    },

    async submitQuickUpdate () {
      if (!this.quickModel.invoiceNumber) return
      // Build PATCH body exactly as backend expects
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

      // Optional buyer/consignee JSON passthrough
      try {
        if (this.quickModel.buyerJson && this.quickModel.buyerJson.trim()) {
          body.buyer = JSON.parse(this.quickModel.buyerJson)
        }
      } catch {}
      try {
        if (this.quickModel.consigneeJson && this.quickModel.consigneeJson.trim()) {
          body.consignee = JSON.parse(this.quickModel.consigneeJson)
        }
      } catch {}

      this.saving = true
      try {
        const { data } = await axios.patch(this.url('update'), body)
        this.notify('Updated successfully', 'success')
        this.dialogs.update = false

        // refresh updated row in-place
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
      } finally {
        this.saving = false
      }
    },

    // ---- helpers ----
    money (v) { return Number(v || 0).toFixed(2) },
    fmtDate (iso) {
      if (!iso) return '—'
      try {
        return new Date(iso).toISOString().slice(0, 10)
      } catch { return '—' }
    },
    statusColor (s) {
      const k = String(s || '').toUpperCase()
      if (k === 'SOLD') return 'green'
      if (k === 'PENDING') return 'orange'
      if (k === 'CANCELLED') return 'red'
      return 'grey'
    },
    notify (text, color = 'success') {
      this.snack = { show: true, color, text }
    }
  }
}
</script>

<style scoped>
.subtitle-1.font-weight-medium { letter-spacing: .2px; }
</style>
