<template>
  <v-card>
    <v-card-title>Add Payment (Customer Paid)</v-card-title>

    <v-card-text>
      <v-form ref="form" v-model="valid" lazy-validation>
        <v-row dense>
          <!-- Client ID -->
          <v-col cols="12" sm="4">
            <v-text-field
              v-model="form.clientId"
              label="Client ID"
              :rules="[rReq]"
              outlined dense
              clearable
              @click:clear="clearClient"
            >
              <template v-slot:append-outer>
                <v-btn
                  icon small
                  :loading="clientLoading"
                  :disabled="!canLookup"
                  @click="lookupClient(true)"
                >
                  <v-icon>mdi-magnify</v-icon>
                </v-btn>
              </template>
            </v-text-field>
            <div v-if="clientError" class="red--text text-caption mt-1">{{ clientError }}</div>
          </v-col>

          <!-- Client Name (auto-filled from API, readonly) -->
          <v-col cols="12" sm="4">
            <v-text-field
              :value="clientName || '—'"
              label="Client Name"
              outlined dense
              readonly
              :loading="clientLoading"
              hide-details
            />
          </v-col>

          <!-- Amount -->
          <v-col cols="12" sm="4">
            <v-text-field
              v-model.number="form.amount"
              label="Amount Received"
              type="number"
              :rules="[rReq, rNumPos]"
              outlined dense
              prefix="₹"
            />
          </v-col>

          <!-- Reference ID (optional, auto if blank) -->
          <v-col cols="12" sm="4">
            <v-text-field
              v-model="form.sourceId"
              label="Reference ID (optional)"
              placeholder="UPI/Bank/Cheque Ref — auto if blank"
              outlined dense
              clearable
            />
          </v-col>

          <!-- Date picker (defaults to today) -->
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
                  label="Payment Date"
                  placeholder="YYYY-MM-DD"
                  dense
                  outlined
                  readonly
                  hide-details
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

          <!-- Payment Mode -->
          <v-col cols="12" sm="4">
            <v-select
              v-model="form.extra.paymentType"
              :items="paymentModes"
              item-text="text"
              item-value="value"
              label="Payment Mode"
              outlined dense
              :rules="[rReq]"
              clearable
            />
          </v-col>

          <!-- Payment Reference (UPI txn id / Bank ref / Cheque no) -->
          <v-col cols="12" sm="4">
            <v-text-field
              v-model="form.extra.referenceNo"
              label="Payment Reference (UPI/Bank/Cheque)"
              outlined dense
              clearable
            />
          </v-col>

          <!-- Narration -->
          <v-col cols="12">
            <v-text-field
              v-model="form.narration"
              label="Narration"
              placeholder="Payment received"
              outlined dense
              clearable
            />
          </v-col>
        </v-row>
      </v-form>
    </v-card-text>

    <v-card-actions>
      <v-spacer />
      <v-btn :loading="loading" color="primary" @click="submit">
        <v-icon left>mdi-cash-check</v-icon> Add Payment
      </v-btn>
    </v-card-actions>
  </v-card>
</template>

<script>
export default {
  name: 'PaymentReceiptForm',
  data () {
    const today = new Date()
    const pad = n => String(n).padStart(2, '0')
    const toISODate = d => `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`

    return {
      valid: false,
      loading: false,
      dateMenu: false,

      // client lookup UI state
      clientLoading: false,
      clientError: '',
      clientName: '',
      debounceT: null,

      form: {
        clientId: '',
        amount: null,

        // fixed for deposit-only
        entryType: 'CREDIT',
        sourceType: 'PAYMENT',

        sourceId: '',                  // auto if blank
        date: new Date().toISOString(),
        status: 'DEPOSIT',
        narration: 'Deposit received from customer',
        extra: {
          paymentType: '',             // CASH/UPI/CARD/BANK_TRANSFER/CHEQUE/OTHER
          referenceNo: ''
        }
      },

      // date controls
      dateOnly: toISODate(today),

      paymentModes: [
        { text: 'CASH', value: 'CASH' },
        { text: 'UPI', value: 'UPI' },
        { text: 'CARD', value: 'CARD' },
        { text: 'BANK TRANSFER', value: 'BANK_TRANSFER' },
        { text: 'CHEQUE', value: 'CHEQUE' },
        { text: 'OTHER', value: 'OTHER' }
      ],

      // rules
      rReq: v => !!(v && String(v).trim()) || 'Required',
      rNumPos: v => (!isNaN(Number(v)) && Number(v) > 0) || 'Enter a positive amount'
    }
  },

  computed: {
    dateDisplay () { return this.dateOnly },
    canLookup () { return !!(this.form.clientId && String(this.form.clientId).trim()) },
    BASE () { return (process.env.VUE_APP_AGENCY_BACKEND_URL || '').replace(/\/$/, '') }
  },

  watch: {
    // Debounced auto-lookup when clientId changes
    'form.clientId' (val) {
      this.clientError = ''
      this.clientName = ''
      clearTimeout(this.debounceT)
      if (!val || !String(val).trim()) return
      this.debounceT = setTimeout(() => this.lookupClient(false), 350)
    }
  },

  methods: {
    applyDate (val) {
      this.dateOnly = val
      const [y, m, d] = val.split('-').map(Number)
      const date = new Date(y, m - 1, d, 12, 0, 0) // noon to avoid TZ edge cases
      this.form.date = date.toISOString()
      this.dateMenu = false
    },

    ensureSourceId () {
      if (this.form.sourceId && String(this.form.sourceId).trim()) return
      const d = new Date()
      const pad = n => String(n).padStart(2, '0')
      const ts = `${d.getFullYear()}${pad(d.getMonth()+1)}${pad(d.getDate())}${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`
      this.form.sourceId = `PAY-${ts}`
    },

    clearClient () {
      this.form.clientId = ''
      this.clientName = ''
      this.clientError = ''
    },

    // ---- fetch client name by clientId ----
    async lookupClient (force) {
      const id = (this.form.clientId || '').trim()
      if (!id) return

      // avoid duplicate fetch if not forced and name already present
      if (!force && this.clientName) return

      this.clientLoading = true
      this.clientError = ''
      this.clientName = ''

      try {
        const url = `${this.BASE}/getClientByClientId/${encodeURIComponent(id)}`
        const r = await fetch(url)
        const data = await r.json().catch(() => ({}))

        if (!r.ok) throw new Error(data?.message || `HTTP ${r.status}`)

        // handle both array and single object shapes
        const item = Array.isArray(data?.items) ? data.items[0] : (data?.item || data)
        const name =
          item?.name ||
          item?.clientName ||
          item?.customer?.name ||
          item?.Item?.name ||
          item?.Item?.clientName ||
          ''

        if (!name) {
          this.clientError = 'Client found but name missing'
        } else {
          this.clientName = name
        }
      } catch (e) {
        this.clientError = 'Client not found'
      } finally {
        this.clientLoading = false
      }
    },

    // ---- submit deposit ----
    async submit () {
      const ok = await this.$refs.form.validate()
      if (!ok) return

      // Enforce deposit-only semantics
      this.form.entryType = 'CREDIT'
      this.form.sourceType = 'PAYMENT'
      if (Number(this.form.amount) <= 0) {
        this.$emit('notify', { text: 'Amount must be greater than 0', color: 'warning' })
        return
      }

      this.ensureSourceId()

      this.loading = true
      try {
        const url = `${this.BASE}/addClientDeposit`
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(this.form)
        })
        const data = await res.json()

        if (!res.ok) throw new Error(data?.message || `HTTP ${res.status}`)

        this.$emit('notify', { text: data.message || 'Payment recorded successfully', color: 'success' })
        this.$emit('created', data.entry || data)

        // reset lightweight fields
        this.form.amount = null
        this.form.extra.referenceNo = ''
        this.form.sourceId = ''
      } catch (err) {
        this.$emit('notify', { text: err?.message || 'Failed to add payment', color: 'error' })
      } finally {
        this.loading = false
      }
    }
  }
}
</script>
