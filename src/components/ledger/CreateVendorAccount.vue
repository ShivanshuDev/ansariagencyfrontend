<template>
  <v-card>
    <v-card-text>
      <v-form ref="form" v-model="valid" lazy-validation>
        <v-row dense>
          <!-- Vendor selector / lookup -->
          <v-col cols="12" sm="6">
            <v-select
              v-model="selectedOption"
              :items="clientOptions"
              item-text="label"
              item-value="value"
              label="Pick existing vendor (optional)"
              :loading="clientsLoading"
              clearable
              return-object
              outlined dense
              @change="onVendorSelect"
            >
              <template v-slot:selection="{ item }">
                <div v-if="item">{{ item.label }}</div>
                <div v-else>—</div>
              </template>
            </v-select>
            <div class="text-caption mt-1">
              You can pick an existing client to prefill fields or enter new details below.
            </div>
          </v-col>

          <!-- Vendor ID (required) -->
          <v-col cols="12" sm="6">
            <v-text-field
              v-model="form.vendorId"
              label="Vendor ID"
              :rules="[rReq]"
              outlined dense
              clearable
            />
          </v-col>

          <!-- Vendor Name (required) -->
          <v-col cols="12" sm="6">
            <v-text-field
              v-model="form.name"
              label="Vendor / Business Name"
              :rules="[rReq]"
              outlined dense
              clearable
            />
          </v-col>

          <!-- Phone (required) -->
          <v-col cols="12" sm="6">
            <v-text-field
              v-model="form.phone"
              label="Phone"
              :rules="[rReq]"
              outlined dense
              clearable
            />
          </v-col>

          <!-- Email (required) -->
          <v-col cols="12" sm="6">
            <v-text-field
              v-model="form.email"
              label="Email"
              :rules="[rReq]"
              outlined dense
              clearable
            />
          </v-col>

          <!-- Initial balance (required, >= 0, Indian format while typing) -->
          <v-col cols="12" sm="4">
            <v-text-field
              :value="formattedInitialBalance"
              label="Initial Balance"
              type="text"
              :rules="[rNumNonNeg]"
              outlined dense
              prefix="₹"
              clearable
              @input="onInitialBalanceInput"
            />
          </v-col>

          <!-- Currency (required) -->
          <v-col cols="12" sm="4">
            <v-select
              v-model="form.currency"
              :items="currencyOptions"
              label="Currency"
              :rules="[rReq]"
              outlined dense
              clearable
            />
          </v-col>

          <!-- Notes / narration (optional) -->
          <v-col cols="12">
            <v-textarea
              v-model="form.notes"
              label="Notes (optional)"
              rows="2"
              auto-grow
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
        <v-icon left>mdi-account-plus</v-icon> Create Account
      </v-btn>
    </v-card-actions>
  </v-card>
</template>

<script>
export default {
  name: 'CreateVendorAccount',
  data () {
    return {
      valid: false,
      loading: false,

      // clients list for dropdown
      clients: [],
      clientsLoading: false,
      clientsError: '',

      selectedOption: null, // return-object from v-select

      form: {
        vendorId: '',
        name: '',
        phone: '',
        email: '',
        initialBalance: 0, // kept numeric for backend
        currency: 'INR',
        notes: ''
      },

      // raw string typed for amount (without formatting control)
      rawInitialBalance: '',

      currencyOptions: ['INR', 'USD', 'EUR'],

      // validation rules
      rReq: v => !!(v && String(v).trim()) || 'Required',
      // allow empty (treated as 0), but if not empty must be a number ≥ 0
      rNumNonNeg: v => {
        const str = (v === null || v === undefined) ? '' : String(v)
        if (!str.trim()) return true // empty is allowed -> will be treated as 0
        const num = Number(str.replace(/,/g, ''))
        return (!isNaN(num) && num >= 0) || 'Must be ≥ 0'
      }
    }
  },

  computed: {
    BASE () {
      return (process.env.VUE_APP_AGENCY_BACKEND_URL || '').replace(/\/$/, '')
    },

    // show only clients which do NOT have accountCreated === true
    clientOptions () {
      return (this.clients || [])
        .filter(c => { return !('accountCreated' in c) || c.accountCreated === false })
        .map(c => ({
          label: `${c.name || '—'} (${c.clientId || c.pk || '—'})`,
          value: c.clientId,
          payload: c
        }))
    },

    // what is shown in the Initial Balance field (Indian format)
    formattedInitialBalance () {
      if (!this.rawInitialBalance) return ''
      return this.formatIndianNumber(this.rawInitialBalance)
    }
  },

  watch: {
    // whenever dropdown selection changes, update fields
    selectedOption (newVal) {
      this.onVendorSelect(newVal)
    }
  },

  mounted () {
    // initialize rawInitialBalance from numeric value, but keep field visually empty if 0
    if (this.form.initialBalance && Number(this.form.initialBalance) > 0) {
      this.rawInitialBalance = String(this.form.initialBalance)
    } else {
      this.rawInitialBalance = ''
    }
    this.fetchClients()
  },

  methods: {
    // format number string in Indian style (10,00,000)
    formatIndianNumber (value) {
      let x = String(value || '').replace(/[^\d]/g, '')
      if (!x) return ''
      // remove leading zeros, but keep a single 0 if everything is zeros
      x = x.replace(/^0+/, '') || '0'
      const lastThree = x.slice(-3)
      const other = x.slice(0, -3)
      if (!other) return lastThree
      return other.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + ',' + lastThree
    },

    // handle typing in Initial Balance field
    onInitialBalanceInput (val) {
      const digits = (val || '').replace(/[^\d]/g, '')
      this.rawInitialBalance = digits

      if (!digits) {
        // if nothing typed, treat as 0 internally
        this.form.initialBalance = 0
      } else {
        this.form.initialBalance = Number(digits)
      }
    },

    // fetch all clients/vendors to populate selector
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
        console.error('fetchClients error', e)
        this.clientsError = 'Failed to load vendor list'
      } finally {
        this.clientsLoading = false
      }
    },

    // when user selects an existing client (or clears), prefill/clear form fields
    onVendorSelect (selected) {
      // clear selection
      if (!selected) {
        this.form.vendorId = ''
        this.form.name = ''
        this.form.phone = ''
        this.form.email = ''
        return
      }

      // If selected is option object with payload (return-object), prefer payload
      if (selected.payload && typeof selected.payload === 'object') {
        const found = selected.payload
        this.form.vendorId = found.clientId || found.pk || ''
        this.form.name = found.name || ''
        this.form.phone = found.phone || found.altphone || ''
        this.form.email = found.email || ''
        return
      }

      // If selected is string or simple value, lookup in clients
      const clientId = (typeof selected === 'string') ? selected : (selected.value || '')
      const found = this.clients.find(c => c.clientId === clientId || c.pk === clientId)
      if (!found) return
      this.form.vendorId = found.clientId || found.pk || ''
      this.form.name = found.name || ''
      this.form.phone = found.phone || found.altphone || ''
      this.form.email = found.email || ''
    },

    // ensure minimal payload
    buildPayload () {
      return {
        vendorId: String(this.form.vendorId || '').trim(),
        name: String(this.form.name || '').trim(),
        phone: this.form.phone || null,
        email: this.form.email || null,
        // if user left field empty, this.form.initialBalance will be 0
        initialBalance: (this.form.initialBalance === null ||
                         this.form.initialBalance === undefined ||
                         this.form.initialBalance === '')
          ? 0
          : this.form.initialBalance,
        currency: this.form.currency || 'INR',
        notes: this.form.notes || ''
      }
    },

    // helper: call updateClientDetail with { pk, clientId, accountCreated: true }
    async callMarkAccountCreated (pk, clientId) {
      if (!pk || !clientId) return { ok: false, message: 'Missing pk or clientId' }
      try {
        const url = `${this.BASE}/updateClientDetail`
        const res = await fetch(url, {
          method: 'POST', // change to PUT if your backend expects PUT
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ pk, clientId, accountCreated: true })
        })
        const data = await res.json().catch(() => ({}))
        if (!res.ok) {
          console.warn('markAccountCreated failed', res.status, data)
          return { ok: false, status: res.status, data }
        }
        return { ok: true, data }
      } catch (err) {
        console.error('callMarkAccountCreated error', err)
        return { ok: false, error: err }
      }
    },

    // Submit to /createVendorAccount and then mark accountCreated=true
    async submit () {
      const ok = await this.$refs.form.validate()
      if (!ok) return

      // basic vendorId/name check (extra safety)
      if (!this.form.vendorId || !String(this.form.vendorId).trim()) {
        this.$emit('notify', { text: 'Vendor ID is required', color: 'warning' })
        return
      }
      if (!this.form.name || !String(this.form.name).trim()) {
        this.$emit('notify', { text: 'Vendor name is required', color: 'warning' })
        return
      }
      if (!this.form.phone || !String(this.form.phone).trim()) {
        this.$emit('notify', { text: 'Phone is required', color: 'warning' })
        return
      }
      if (!this.form.email || !String(this.form.email).trim()) {
        this.$emit('notify', { text: 'Email is required', color: 'warning' })
        return
      }
      if (!this.form.currency || !String(this.form.currency).trim()) {
        this.$emit('notify', { text: 'Currency is required', color: 'warning' })
        return
      }

      this.loading = true
      try {
        const payload = this.buildPayload()
        const url = `${this.BASE}/createVendorAccount`
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        })
        const data = await res.json().catch(() => ({}))

        if (!res.ok) {
          // If conflict (409) vendor exists, show friendly message
          const message = data?.message || `HTTP ${res.status}`
          this.$emit('notify', { text: message, color: res.status === 409 ? 'warning' : 'error' })
          // Optionally refresh client list if created elsewhere
          if (res.status === 201 || res.status === 200) {
            await this.fetchClients()
          }
          return
        }

        // Creation success
        this.$emit('notify', { text: data.message || 'Vendor account created', color: 'success' })
        this.$emit('created', data)

        // refresh clients list so the new vendor appears and we can find pk
        await this.fetchClients()

        // try to find the newly created client in clients array to obtain pk
        const newVendorId = payload.vendorId
        const found = this.clients.find(c => c.clientId === newVendorId || c.pk === newVendorId)

        if (found && found.pk) {
          const pk = found.pk
          // call updateClientDetail with required fields
          const upd = await this.callMarkAccountCreated(pk, newVendorId)
          if (upd.ok) {
            this.$emit('notify', { text: 'Account flag updated', color: 'success' })
          } else {
            // log & notify but don't block the flow
            console.warn('Failed to mark accountCreated:', upd)
            this.$emit('notify', { text: 'Account created but update flag failed', color: 'warning' })
          }
        } else {
          // fallback: could not find pk immediately — user can retry via client list or backend sync
          console.warn('PK not found for newly created vendor:', newVendorId)
          this.$emit('notify', {
            text: 'Vendor created but pk not found to mark accountCreated. Refresh list to retry.',
            color: 'warning'
          })
        }

        // reset form lightly (keep list cached)
        this.form.vendorId = ''
        this.form.name = ''
        this.form.phone = ''
        this.form.email = ''
        this.form.initialBalance = 0
        this.form.notes = ''
        this.selectedOption = null
        this.rawInitialBalance = ''
      } catch (err) {
        console.error('createVendorAccount error', err)
        this.$emit('notify', { text: err?.message || 'Failed to create vendor account', color: 'error' })
      } finally {
        this.loading = false
      }
    }
  }
}
</script>

<style scoped>
.text-caption {
  font-size: 0.8rem;
  color: rgba(0,0,0,.6);
}
</style>
