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
            <div class="text-caption mt-1">You can pick an existing client to prefill fields or enter new details below.</div>
          </v-col>

          <!-- Vendor ID -->
          <v-col cols="12" sm="6">
            <v-text-field
              v-model="form.vendorId"
              label="Vendor ID"
              :rules="[rReq]"
              outlined dense
              clearable
            />
          </v-col>

          <!-- Vendor Name -->
          <v-col cols="12" sm="6">
            <v-text-field
              v-model="form.name"
              label="Vendor / Business Name"
              :rules="[rReq]"
              outlined dense
              clearable
            />
          </v-col>

          <!-- Phone -->
          <v-col cols="12" sm="6">
            <v-text-field
              v-model="form.phone"
              label="Phone"
              outlined dense
              clearable
            />
          </v-col>

          <!-- Email -->
          <v-col cols="12" sm="6">
            <v-text-field
              v-model="form.email"
              label="Email"
              outlined dense
              clearable
            />
          </v-col>

          <!-- Initial balance -->
          <v-col cols="12" sm="4">
            <v-text-field
              v-model.number="form.initialBalance"
              label="Initial Balance"
              type="number"
              :rules="[rNumNonNeg]"
              outlined dense
              prefix="₹"
              clearable
            />
          </v-col>

          <!-- Currency -->
          <v-col cols="12" sm="4">
            <v-select
              v-model="form.currency"
              :items="currencyOptions"
              label="Currency"
              outlined dense
              clearable
            />
          </v-col>

          <!-- Notes / narration -->
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
        initialBalance: 0,
        currency: 'INR',
        notes: ''
      },

      currencyOptions: ['INR', 'USD', 'EUR'],

      // validation rules
      rReq: v => !!(v && String(v).trim()) || 'Required',
      rNumNonNeg: v => (v === null || v === undefined || v === '' || (!isNaN(Number(v)) && Number(v) >= 0)) || 'Must be ≥ 0'
    }
  },

  computed: {
    BASE () { return (process.env.VUE_APP_AGENCY_BACKEND_URL || '').replace(/\/$/, '') },

    // show only clients which do NOT have accountCreated === true
    clientOptions () {
        return (this.clients || [])
            .filter(c => { return !('accountCreated' in c) || c.accountCreated === false })
            .map(c => ({
                label: `${c.name || '—'} (${c.clientId || c.pk || '—'})`,
                value: c.clientId,
                payload: c
            })
        )
    }

  },

  watch: {
    // whenever dropdown selection changes, update fields
    selectedOption (newVal) {
      this.onVendorSelect(newVal)
    }
  },

  mounted () {
    this.fetchClients()
  },

  methods: {
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
        initialBalance: this.form.initialBalance || 0,
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

      // basic vendorId/name check
      if (!this.form.vendorId || !String(this.form.vendorId).trim()) {
        this.$emit('notify', { text: 'Vendor ID is required', color: 'warning' })
        return
      }
      if (!this.form.name || !String(this.form.name).trim()) {
        this.$emit('notify', { text: 'Vendor name is required', color: 'warning' })
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
          this.$emit('notify', { text: 'Vendor created but pk not found to mark accountCreated. Refresh list to retry.', color: 'warning' })
        }

        // reset form lightly (keep list cached)
        this.form.vendorId = ''
        this.form.name = ''
        this.form.phone = ''
        this.form.email = ''
        this.form.initialBalance = 0
        this.form.notes = ''
        this.selectedOption = null

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
.text-caption { font-size: 0.8rem; color: rgba(0,0,0,.6); }
</style>
