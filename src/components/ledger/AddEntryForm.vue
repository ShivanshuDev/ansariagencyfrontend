<template>
  <v-card>
    <v-card-title>Vendor Deposit</v-card-title>

    <v-card-text>
      <v-form ref="form" v-model="valid" lazy-validation>
        <v-row dense>
          <!-- Vendor dropdown -->
          <v-col cols="12" sm="6">
            <v-select
              v-model="form.clientId"
              :items="clientOptions"
              item-text="label"
              item-value="value"
              label="Select Vendor"
              :rules="[rReq]"
              outlined dense
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
            <div v-if="clientsError" class="red--text text-caption mt-1">{{ clientsError }}</div>
          </v-col>

          <!-- Vendor quick details card (shown when vendor selected) -->
          <v-col cols="12">
            <v-card v-if="selectedClient" class="pa-3" outlined>
              <v-row>
                <v-col cols="12" sm="4"><strong>Name</strong><div>{{ selectedClient.name }}</div></v-col>
                <v-col cols="12" sm="4"><strong>Client ID</strong><div>{{ selectedClient.clientId }}</div></v-col>
                <v-col cols="12" sm="4"><strong>Phone</strong><div>{{ selectedClient.phone || selectedClient.altphone || '—' }}</div></v-col>

                <v-col cols="12" sm="4"><strong>Email</strong><div>{{ selectedClient.email || '—' }}</div></v-col>
                <v-col cols="12" sm="4"><strong>GSTIN</strong><div>{{ selectedClient.gstin || '—' }}</div></v-col>
                <v-col cols="12" sm="4"><strong>Status</strong><div>{{ selectedClient.status || '—' }}</div></v-col>

                <!-- Billing address short -->
                <v-col cols="12">
                  <strong>Billing Address</strong>
                  <div v-if="selectedClient.billing">
                    {{ selectedClient.billing.line1 || '' }} {{ selectedClient.billing.line2 || '' }},
                    {{ selectedClient.billing.city || '' }} {{ selectedClient.billing.state || '' }} {{ selectedClient.billing.pincode || '' }}
                  </div>
                  <div v-else>—</div>
                </v-col>
              </v-row>
            </v-card>

            <v-card v-else class="pa-3" outlined>
              <div class="text-caption">Select a vendor to see details</div>
            </v-card>
          </v-col>

          <!-- Amount -->
          <v-col cols="12" sm="4">
            <v-text-field
              v-model.number="form.amount"
              label="Amount"
              type="number"
              :rules="[rReq, rNumPos]"
              outlined dense
              prefix="₹"
            />
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
              clearable
            />
          </v-col>

          <!-- Reference -->
          <v-col cols="12" sm="4">
            <v-text-field
              v-model="form.extra.referenceNo"
              label="Reference (UPI/Bank/Cheque)"
              outlined dense
              clearable
            />
          </v-col>

          <!-- Date -->
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

          <!-- Narration -->
          <v-col cols="12">
            <v-text-field
              v-model="form.narration"
              label="Narration"
              placeholder="Deposit by vendor"
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
        clientId: null,       // will hold the selected option object (see v-select return-object)
        amount: null,
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

      // validation rules
      rReq: v => !!(v && (typeof v === 'object' ? v.value : String(v).trim())) || 'Required',
      rNumPos: v => (!isNaN(Number(v)) && Number(v) > 0) || 'Enter a positive amount'
    }
  },

  computed: {
    dateDisplay () { return this.dateOnly },
    BASE () { return (process.env.VUE_APP_AGENCY_BACKEND_URL || '').replace(/\/$/, '') },
    // transform clients into v-select-friendly items
    clientOptions () {
      return this.clients.map(c => ({
        label: `${c.name || '—'} (${c.clientId || c.pk || '—'})`,
        value: c.clientId,
        payload: c,
        // keep quick access to object as return-object
        name: c.name
      }))
    }
  },

  mounted () {
    this.fetchClients()
  },

  methods: {
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
        // expecting data.items array (as you posted)
        this.clients = Array.isArray(data.items) ? data.items : []
      } catch (e) {
        this.clientsError = 'Failed to load vendors'
        console.error('fetchClients error', e)
      } finally {
        this.clientsLoading = false
      }
    },

    // when v-select returns the selected object (because return-object is set),
    // here we map to selectedClient object from clients list
    onVendorSelect (selected) {
      // selected is the entire option object from clientOptions (because return-object),
      // we stored value as clientId — so look up the original client item
      if (!selected) {
        this.selectedClient = null
        this.form.clientId = null
        return
      }

      const clientId = selected.value || selected
      const found = this.clients.find(c => c.clientId === clientId || c.pk === clientId)
      if (found) {
        this.selectedClient = found
        // ensure the form.clientId is the simple clientId value for backend
        this.form.clientId = found.clientId
      } else {
        // fallback: if selected value is already clientId string
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
      if (Number(this.form.amount) <= 0) {
        this.$emit('notify', { text: 'Amount must be greater than 0', color: 'warning' })
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
          narration: this.form.narration +'  '+ this.selectedClient.name,
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
        // emit created info so parent can refresh ledgers etc
        this.$emit('created', data)

        // reset simple fields
        this.form.amount = null
        this.form.extra.referenceNo = ''
        this.form.sourceId = ''
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
/* small spacing fixes */
.pa-3 { padding: 12px; }
</style>
