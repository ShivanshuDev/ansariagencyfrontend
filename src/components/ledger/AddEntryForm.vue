<template>
  <v-card>
    <v-card-text>
      <v-form ref="form" v-model="valid" lazy-validation>
        <v-row dense>
          <!-- Vendor dropdown (required) -->
          <v-col cols="12" sm="6">
            <v-select
              v-model="form.clientId"
              :items="clientOptions"
              item-text="label"
              item-value="value"
              label="Select Vendor"
              :rules="[rReq]"
              outlined
              dense
              clearable
              :loading="clientsLoading"
              return-object
              @change="onVendorSelect"
            >
              <template v-slot:selection="{ item }">
                <div v-if="item">{{ item.label }}</div>
                <div v-else>—</div>
              </template>
            </v-select>
            <div v-if="clientsError" class="red--text text-caption mt-1">
              {{ clientsError }}
            </div>
          </v-col>

          <!-- Vendor quick details card (shown when vendor selected) -->
          <v-col cols="12">
            <v-card v-if="selectedClient" class="pa-3" outlined>
              <v-row>
                <v-col cols="12" sm="4">
                  <strong>Name</strong>
                  <div>{{ selectedClient.name }}</div>
                </v-col>
                <v-col cols="12" sm="4">
                  <strong>Client ID</strong>
                  <div>{{ selectedClient.clientId }}</div>
                </v-col>
                <v-col cols="12" sm="4">
                  <strong>Phone</strong>
                  <div>{{ selectedClient.phone || selectedClient.altphone || '—' }}</div>
                </v-col>

                <v-col cols="12" sm="4">
                  <strong>Email</strong>
                  <div>{{ selectedClient.email || '—' }}</div>
                </v-col>
                <v-col cols="12" sm="4">
                  <strong>GSTIN</strong>
                  <div>{{ selectedClient.gstin || '—' }}</div>
                </v-col>
                <v-col cols="12" sm="4">
                  <strong>Status</strong>
                  <div>{{ selectedClient.status || '—' }}</div>
                </v-col>

                <!-- Billing address short -->
                <v-col cols="12">
                  <strong>Billing Address</strong>
                  <div v-if="selectedClient.billing">
                    {{ selectedClient.billing.line1 || '' }}
                    {{ selectedClient.billing.line2 || '' }},
                    {{ selectedClient.billing.city || '' }}
                    {{ selectedClient.billing.state || '' }}
                    {{ selectedClient.billing.pincode || '' }}
                  </div>
                  <div v-else>—</div>
                </v-col>
              </v-row>
            </v-card>

            <v-card v-else class="pa-3" outlined>
              <div class="text-caption">Select a vendor to see details</div>
            </v-card>
          </v-col>

          <!-- Amount (required, Indian format 10,00,000) -->
          <v-col cols="12" sm="4">
            <v-text-field
              v-model="form.amountDisplay"
              label="Amount"
              :rules="[rReq, rNumPos]"
              outlined
              dense
              prefix="₹"
              @input="onAmountInput"
              @blur="formatAmountDisplay"
            />
          </v-col>

          <!-- Payment Mode (required) -->
          <v-col cols="12" sm="4">
            <v-select
              v-model="form.extra.paymentType"
              :items="paymentModes"
              item-text="text"
              item-value="value"
              label="Payment Mode"
              :rules="[rReq]"
              outlined
              dense
              clearable
            />
          </v-col>

          <!-- Reference (required) -->
          <v-col cols="12" sm="4">
            <v-text-field
              v-model="form.extra.referenceNo"
              label="Reference (UPI/Bank/Cheque)"
              outlined
              dense
              clearable
              :rules="[rReq]"
            />
          </v-col>

          <!-- Date (required) -->
          <v-col cols="12" sm="4">
            <v-menu
              v-model="dateMenu"
              :close-on-content-click="false"
              transition="scale-transition"
              offset-y
              max-width="290"
              min-width="290"
            >
              <template v-slot:activator="{ on, attrs }">
                <v-text-field
                  v-bind="attrs"
                  v-on="on"
                  v-model="dateDisplay"
                  label="Deposit Date"
                  placeholder="YYYY-MM-DD"
                  dense
                  outlined
                  readonly
                  :rules="[rReq]"
                />
              </template>
              <v-date-picker
                v-model="dateOnly"
                @input="applyDate"
                scrollable
                no-title
              />
            </v-menu>
          </v-col>

          <!-- Narration (required) -->
          <v-col cols="12">
            <v-text-field
              v-model="form.narration"
              label="Narration"
              placeholder="Deposit by vendor"
              outlined
              dense
              clearable
              :rules="[rReq]"
            />
          </v-col>
        </v-row>
      </v-form>
    </v-card-text>

    <v-card-actions>
      <v-spacer />
      <v-btn :loading="loading" color="primary" @click="submit">
        <v-icon left>mdi-bank-transfer</v-icon> Deposit
      </v-btn>
    </v-card-actions>
  </v-card>
</template>

<script>
export default {
  name: 'VendorDepositForm',
  data () {
    const today = new Date()
    const pad = n => String(n).padStart(2, '0')
    const toISODate = d => `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`

    return {
      valid: false,
      loading: false,

      // clients list state
      clientsLoading: false,
      clientsError: '',
      clients: [],

      // selection detail
      selectedClient: null,

      // date controls
      dateMenu: false,
      dateOnly: toISODate(today),

      form: {
        clientId: null,       // v-select value (object first, then we map to clientId)
        amount: null,         // pure number for backend
        amountDisplay: '',    // formatted string for UI (10,00,000)
        sourceId: '',
        date: new Date().toISOString(),
        narration: 'Deposit received from vendor name',
        extra: {
          paymentType: '',
          referenceNo: ''
        }
      },

      paymentModes: [
        { text: 'CASH', value: 'CASH' },
        { text: 'UPI', value: 'UPI' },
        { text: 'CARD', value: 'CARD' },
        { text: 'BANK TRANSFER', value: 'BANK_TRANSFER' },
        { text: 'CHEQUE', value: 'CHEQUE' },
        { text: 'OTHER', value: 'OTHER' }
      ],

      // validation rules (generic, works for text/select/date)
      rReq: v =>
        (v !== null && v !== undefined && String(v).trim() !== '') ||
        'Required',

      // amount must be positive; accepts formatted value with commas
      rNumPos: v => {
        if (v === null || v === undefined || String(v).trim() === '') {
          return 'Required'
        }
        const cleaned = String(v).replace(/,/g, '')
        const n = Number(cleaned)
        return (!isNaN(n) && n > 0) || 'Enter a positive amount'
      }
    }
  },

  computed: {
    dateDisplay() {
      if (!this.dateOnly) return "";
      const [y, m, d] = this.dateOnly.split("-");
      return `${d}/${m}/${y}`;
    },
    BASE () {
      return (process.env.VUE_APP_AGENCY_BACKEND_URL || '').replace(/\/$/, '')
    },
    // transform clients into v-select-friendly items
    clientOptions () {
      return this.clients.map(c => ({
        label: `${c.name || '—'} (${c.clientId || c.pk || '—'})`,
        value: c.clientId,
        payload: c,
        name: c.name
      }))
    }
  },

  mounted () {
    this.fetchClients()
  },

  methods: {

    formatAmountLive(value) {
      if (!value) {
        this.form.amountDisplay = "";
        this.form.amount = null;
        return;
      }
      // Remove commas
      let cleaned = value.replace(/,/g, '');
      // Allow only numbers
      cleaned = cleaned.replace(/[^\d]/g, '');
      if (!cleaned) {
        this.form.amountDisplay = "";
        this.form.amount = null;
        return;
      }
      // convert string → number
      const num = Number(cleaned);
      this.form.amount = num;
      // Format in Indian system
      this.form.amountDisplay = num.toLocaleString("en-IN");
    },
    // == Amount handling (Indian format) ==
    onAmountInput (val) {
      // Remove anything except digits and dot, also strip commas
      const cleaned = String(val || '').replace(/,/g, '').replace(/[^\d.]/g, '')
      // Update numeric value for backend
      this.form.amount = cleaned ? Number(cleaned) : null
      // Keep unformatted value while typing; we format on blur
      this.form.amountDisplay = cleaned
    },

    formatAmountDisplay () {
      const num = this.form.amount
      if (num === null || num === undefined || isNaN(num)) {
        this.form.amountDisplay = ''
        return
      }
      // Indian style: 10,00,000 etc.
      this.form.amountDisplay = num.toLocaleString('en-IN', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2
      })
    },

    applyDate (val) {
      this.dateOnly = val
      const [y, m, d] = val.split('-').map(Number)
      const date = new Date(y, m - 1, d, 12, 0, 0)
      this.form.date = date.toISOString()
      this.dateMenu = false
    },

    ensureSourceId () {
      if (this.form.sourceId && String(this.form.sourceId).trim()) return
      const d = new Date()
      const pad = n => String(n).padStart(2, '0')
      const ts = `${d.getFullYear()}${pad(d.getMonth()+1)}${pad(d.getDate())}${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`
      this.form.sourceId = `DEP-${ts}`
    },

    // fetch vendor/clients from backend
    async fetchClients () {
      this.clientsLoading = true
      this.clientsError = ''
      try {
        const url = `${this.BASE}/getAllClient`
        const r = await fetch(url)
        const data = await r.json().catch(() => ({}))
        if (!r.ok) throw new Error(data?.message || `HTTP ${r.status}`)
        this.clients = Array.isArray(data.items) ? data.items : []
      } catch (e) {
        this.clientsError = 'Failed to load vendors'
        console.error('fetchClients error', e)
      } finally {
        this.clientsLoading = false
      }
    },

    // when vendor selected
    onVendorSelect (selected) {
      if (!selected) {
        this.selectedClient = null
        this.form.clientId = null
        return
      }

      const clientId = selected.value || selected
      const found = this.clients.find(
        c => c.clientId === clientId || c.pk === clientId
      )

      if (found) {
        this.selectedClient = found
        // For backend we want pure clientId string
        this.form.clientId = found.clientId
      } else {
        this.selectedClient = null
        this.form.clientId = clientId
      }
    },

    // submit deposit to backend
    async submit () {
      const ok = await this.$refs.form.validate()
      if (!ok) return

      if (!this.form.clientId) {
        this.$emit('notify', { text: 'Select vendor', color: 'warning' })
        return
      }
      if (!(this.form.amount > 0)) {
        this.$emit('notify', { text: 'Amount must be greater than 0', color: 'warning' })
        return
      }
      if (!this.form.extra.paymentType) {
        this.$emit('notify', { text: 'Select payment mode', color: 'warning' })
        return
      }
      if (!this.form.extra.referenceNo) {
        this.$emit('notify', { text: 'Enter reference number', color: 'warning' })
        return
      }
      if (!this.form.date) {
        this.$emit('notify', { text: 'Select deposit date', color: 'warning' })
        return
      }
      if (!this.form.narration || !String(this.form.narration).trim()) {
        this.$emit('notify', { text: 'Narration is required', color: 'warning' })
        return
      }

      this.ensureSourceId()
      this.loading = true
      console.log('this.form', this.form)

      try {
        const payload = {
          vendorId: this.form.clientId,   // backend expects vendorId (clientId)
          amount: Number(this.form.amount),
          date: this.form.date,
          narration: this.form.narration + '  ' + (this.selectedClient?.name || ''),
          meta: {
            sourceId: this.form.sourceId,
            paymentType: this.form.extra.paymentType,
            referenceNo: this.form.extra.referenceNo
          }
        }

        const url = `${this.BASE}/vendorDeposit`
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        })
        const data = await res.json().catch(() => ({}))

        if (!res.ok) throw new Error(data?.message || `HTTP ${res.status}`)

        this.$emit('notify', { text: data.message || 'Deposit successful', color: 'success' })
        this.$emit('created', data)

        // reset simple fields
        this.form.amount = null
        this.form.amountDisplay = ''
        this.form.extra.referenceNo = ''
        this.form.sourceId = ''
        // keep selected vendor, payment mode, narration if you want; or reset if needed
      } catch (err) {
        console.error('vendorDeposit error', err)
        this.$emit('notify', { text: err?.message || 'Failed to deposit', color: 'error' })
      } finally {
        this.loading = false
      }
    }
  }
}
</script>

<style scoped>
.pa-3 { padding: 12px; }
</style>
