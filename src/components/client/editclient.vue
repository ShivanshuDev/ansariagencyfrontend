<template>
  <div class="add-customer-form">
    <h2>Edit Client</h2>
    <section class="section">
      <h3>Basic Details</h3>
      <div class="row">
        <div class="form-fields">
          <div class="fields-row">
            <label>
              Client Id *
              <input disabled type="text" v-model="customer.clientId" required />
            </label>
            <label>
              Name *
              <input type="text" v-model="customer.name" required />
            </label>
          </div>
          <div class="fields-row">
            <label>
              Email *
              <input type="email" v-model="customer.email" required />
            </label>
            <label>
              Phone Number *
              <input
                type="text"
                v-model="customer.phone"
                required
                inputmode="numeric"
                maxlength="10"
                @input="customer.phone = onlyDigits(customer.phone, 10)"
                placeholder="10 digits"
              />
            </label>
          </div>
        </div>
      </div>
    </section>

    <section class="section addresses">
      <div class="address-col">
        <h3>Billing Address</h3>
        <label>
          Address Name
          <input type="text" v-model="customer.billing.name" />
        </label>
        <label>
          Address Line 1
          <input type="text" v-model="customer.billing.line1" />
        </label>
        <label>
          Address Line 2
          <input type="text" v-model="customer.billing.line2" />
        </label>
        <label>
          Tahsil
          <input type="text" v-model="customer.billing.tahsil" />
        </label>
        <div class="fields-row">
          <label>
            Country
            <select v-model="customer.billing.country">
              <option value="INDIA">India</option>
            </select>
          </label>
          <label>
            State
            <select v-model="customer.billing.state">
              <option value="Uttar Pradesh">Uttar Pradesh</option>
            </select>
          </label>
        </div>
        <div class="fields-row">
          <label>
            City
            <input type="text" v-model="customer.billing.city" />
          </label>
          <label>
            Pincode
            <input
              type="text"
              v-model="customer.billing.pincode"
              inputmode="numeric"
              maxlength="6"
              @input="customer.billing.pincode = onlyDigits(customer.billing.pincode, 6)"
              placeholder="Pin Code"
            />
          </label>
        </div>
      </div>

      <div class="address-col">
        <div class="address-header">
          <h3>Shipping Address</h3>
          <a href="#" @click.prevent="copyBilling">Copy From Billing</a>
        </div>
        <label>
          Name
          <input type="text" v-model="customer.shipping.name" />
        </label>
        <label>
          Address Line 1
          <input type="text" v-model="customer.shipping.line1" />
        </label>
        <label>
          Address Line 2
          <input type="text" v-model="customer.shipping.line2" />
        </label>
        <label>
          Tahsil
          <input type="text" v-model="customer.shipping.tahsil" />
        </label>
        <div class="fields-row">
          <label>
            Country
            <select v-model="customer.shipping.country">
              <option value="INDIA">India</option>
            </select>
          </label>
          <label>
            State
            <select v-model="customer.shipping.state">
              <option value="Uttar Pradesh">Uttar Pradesh</option>
            </select>
          </label>
        </div>
        <div class="fields-row">
          <label>
            City
            <input type="text" v-model="customer.shipping.city" />
          </label>
          <label>
            Pincode
            <input
              type="text"
              v-model="customer.shipping.pincode"
              inputmode="numeric"
              maxlength="6"
              @input="customer.shipping.pincode = onlyDigits(customer.shipping.pincode, 6)"
              placeholder="Pin code"
            />
          </label>
        </div>
      </div>
    </section>

    <!-- <section class="banking-details-section">
      <h3>Banking Details</h3>
      <div class="banking-fields-row">
        <label>
          Bank Name
          <input type="text" v-model="customer.bank.bankName" />
        </label>
        <label>
          Branch
          <input type="text" v-model="customer.bank.branch" />
        </label>
        <label>
          Account Holder
          <input type="text" v-model="customer.bank.accountHolder" />
        </label>
      </div>
      <div class="banking-fields-row">
        <label>
          Account Number
          <input type="text" v-model="customer.bank.accountNumber" />
        </label>
        <label>
          Confirm Account Number
          <input type="text" v-model="customer.bank.confirmAccountNumber" />
        </label>
        <label>
          IFSC
          <input type="text" v-model="customer.bank.ifsc" />
        </label>
        <span class="empty-col"></span>
      </div>
    </section> -->
    <section class="banking-details-section">
  <div class="banking-header">
    <h3>Banking Details</h3>

    <button
      type="button"
      class="toggle-btn"
      @click="showBank = !showBank"
      :aria-expanded="showBank.toString()"
      aria-controls="banking-body"
    >
      <span v-if="showBank">Hide</span>
      <span v-else>Show</span>
      &nbsp;Details
    </button>
  </div>

  <transition name="fade-slide">
    <div v-show="showBank" id="banking-body">
      <div class="banking-fields-row">
        <label>
          Bank Name
          <input type="text" v-model="customer.bank.bankName" />
        </label>
        <label>
          Branch
          <input type="text" v-model="customer.bank.branch" />
        </label>
        <label>
          Account Holder
          <input type="text" v-model="customer.bank.accountHolder" />
        </label>
      </div>
      <div class="banking-fields-row">
        <label>
          Account Number
          <input type="text" v-model="customer.bank.accountNumber" />
        </label>
        <label>
          Confirm Account Number
          <input type="text" v-model="customer.bank.confirmAccountNumber" />
        </label>
        <label>
          IFSC
          <input type="text" v-model="customer.bank.ifsc" />
        </label>
        <span class="empty-col"></span>
      </div>
    </div>
  </transition>
</section>

    <div class="banking-actions">
      <button type="button" class="create-btn" @click="onSaveClick" :disabled="loading">
        <span v-if="!loading">Save Changes</span>
        <span v-else>Saving...</span>
      </button>
    </div>

    <!-- Custom Popup (Confirm / Success / Error / Info) -->
    <div v-if="dlg.visible" class="dlg-overlay" role="dialog" aria-modal="true">
      <div class="dlg">
        <div class="dlg-header" :class="'dlg-' + dlg.type">
          <strong>{{ dlg.title }}</strong>
          <button class="dlg-close" @click="closeDlg">×</button>
        </div>
        <div class="dlg-body">
          <template v-if="Array.isArray(dlg.message)">
            <ul class="dlg-list">
              <li v-for="(m,i) in dlg.message" :key="i">{{ m }}</li>
            </ul>
          </template>
          <template v-else>
            {{ dlg.message }}
          </template>
        </div>
        <div class="dlg-actions">
          <button v-if="dlg.type==='confirm'" class="btn" @click="onDlgCancel">Cancel</button>
          <button class="btn primary" @click="onDlgOk">{{ dlg.type==='confirm' ? 'Yes, Save' : 'OK' }}</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios';

export default {
  name: 'EditClient',
  props: { pk: { type: String, required: true } },
  data() {
    return {
       showBank: false,
      loading: false,
      original: null,
      customer: {
        clientId: '',
        name: '',
        email: '',
        phone: '',
        altphone: '',
        billing: { name: '', line1: '', line2: '', tahsil: '', country: '', state: '', city: '', pincode: '' },
        shipping: { name: '', line1: '', line2: '', tahsil: '', country: '', state: '', city: '', pincode: '' },
        bank: { bankName: '', branch: '', accountHolder: '', accountNumber: '', confirmAccountNumber: '', ifsc: '' }
      },
      // NEW: popup state (non-breaking)
      dlg: {
        visible: false,
        type: 'info', // 'success' | 'error' | 'confirm' | 'info'
        title: '',
        message: '',
        onConfirm: null
      }
    };
  },
  watch: {
    pk: { immediate: true, handler(newPk) { if (newPk) this.fetchClient(newPk); } }
  },
  mounted() { this.fetchClient(this.$props.pk); },
  methods: {
    onlyDigits(val, maxLen) { return (val || '').replace(/\D/g, '').slice(0, maxLen); },
    _deepClone(obj) { return JSON.parse(JSON.stringify(obj || {})); },

    // ----- Popups (added) -----
    openDlg(type, title, message, onConfirm = null) {
      this.dlg.visible = true;
      this.dlg.type = type;
      this.dlg.title = title;
      this.dlg.message = message;
      this.dlg.onConfirm = typeof onConfirm === 'function' ? onConfirm : null;
    },
    closeDlg() { this.dlg.visible = false; this.dlg.onConfirm = null; },
    onDlgCancel() { this.closeDlg(); },
    onDlgOk() { const fn = this.dlg.onConfirm; this.closeDlg(); if (fn) fn(); },

    // ----- Existing methods (unchanged behavior) -----
    async fetchClient(pk) {
      this.loading = true;
      try {
        const pkToUse = pk.includes('#') ? pk.split('#')[1] : pk;
        const res = await axios.get(process.env.VUE_APP_AGENCY_BACKEND_URL + `getClientByPk/${pkToUse}`, { timeout: 10000 });
        const d = res?.data || null;
        let clientObj = d ? (d.client || d.data || d.item || d) : null;

        const mapped = {
          clientId: clientObj?.clientId || clientObj?.pk || clientObj?.userId || '',
          name: clientObj?.name || clientObj?.fullName || '',
          email: clientObj?.email || clientObj?.userEmail || '',
          phone: clientObj?.phone || clientObj?.mobile || '',
          altphone: clientObj?.altphone || clientObj?.altPhone || '',
          billing: {
            name: clientObj?.billing?.name || '',
            line1: clientObj?.billing?.line1 || '',
            line2: clientObj?.billing?.line2 || '',
            tahsil: clientObj?.billing?.tahsil || clientObj?.billing?.tahsilName || '',
            country: clientObj?.billing?.country || '',
            state: clientObj?.billing?.state || '',
            city: clientObj?.billing?.city || '',
            pincode: clientObj?.billing?.pincode || ''
          },
          shipping: {
            name: clientObj?.shipping?.name || '',
            line1: clientObj?.shipping?.line1 || '',
            line2: clientObj?.shipping?.line2 || '',
            tahsil: clientObj?.shipping?.tahsil || '',
            country: clientObj?.shipping?.country || '',
            state: clientObj?.shipping?.state || '',
            city: clientObj?.shipping?.city || '',
            pincode: clientObj?.shipping?.pincode || ''
          },
          bank: {
            bankName: clientObj?.bank?.bankName || '',
            branch: clientObj?.bank?.branch || '',
            accountHolder: clientObj?.bank?.accountHolder || '',
            accountNumber: clientObj?.bank?.accountNumber || '',
            confirmAccountNumber: clientObj?.bank?.accountNumber || '',
            ifsc: clientObj?.bank?.ifsc || ''
          }
        };

        this.customer = this._deepClone(mapped);
        this.original = this._deepClone(mapped);
      } catch (err) {
        console.error('Failed to fetch client by pk', err);
        this.openDlg('error', 'Load Failed', 'Could not load client details. Please try again.');
        this.$emit('error', err);
      } finally {
        this.loading = false;
      }
    },

    copyBilling() {
      this.customer.shipping = this._deepClone(this.customer.billing);
    },

    // keep same validations, but return messages instead of calling alert/confirm
    // validateAccountNumbers() {
    //   const bank = this.customer.bank;
    //   const errs = [];
    //   if (!bank.accountNumber || !bank.confirmAccountNumber) {
    //     errs.push('Please enter and confirm your account number.');
    //   } else if (bank.accountNumber !== bank.confirmAccountNumber) {
    //     errs.push('Account numbers do not match.');
    //   }
    //   return errs;
    // },
    validateAccountNumbers() {
      const bank = this.customer.bank || {};
      const acc = (bank.accountNumber || '').trim();
      const acc2 = (bank.confirmAccountNumber || '').trim();
      const ifsc = (bank.ifsc || '').trim();

      const errs = [];

      // 1) If NONE of the core fields are present, skip validation entirely.
      const noneProvided = !acc && !acc2 && !ifsc;
      if (noneProvided) return errs;

      // 2) Only validate when ALL THREE are present.
      const allCorePresent = acc && acc2 && ifsc;
      if (!allCorePresent) {
        // Per your requirement: do NOT block/save when partial bank details exist.
        // So we don't push any errors here—just skip strict validation.
        return errs;
      }

      // 3) Validate equality of account numbers
      if (acc !== acc2) {
        errs.push('Account numbers do not match.');
      }

      // 4) Validate IFSC (standard Indian IFSC: 4 letters + 0 + 6 alphanumerics)
      const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/i;
      if (!ifscRegex.test(ifsc)) {
        errs.push('Invalid IFSC format (e.g., HDFC0XXXXXX).');
      }

      return errs;
    },

    validateRequired() {
      const errors = [];
      if (!this.customer.clientId?.trim()) errors.push('Client Id is required');
      if (!this.customer.name?.trim()) errors.push('Name is required');
      if (!this.customer.email?.trim()) errors.push('Email is required');
      if (!this.customer.phone?.trim()) errors.push('Phone is required');

      const email = (this.customer.email || '').trim();
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (this.customer.email && !emailRegex.test(email)) errors.push('Invalid email format');

      const tenDigit = /^\d{10}$/;
      if (this.customer.phone && !tenDigit.test(this.customer.phone)) errors.push('Phone must be exactly 10 digits');

      const sixDigit = /^\d{6}$/;
      if (this.customer.billing?.pincode && !sixDigit.test(this.customer.billing.pincode)) {
        errors.push('Billing Pincode must be exactly 6 digits');
      }
      if (this.customer.shipping?.pincode && !sixDigit.test(this.customer.shipping.pincode)) {
        errors.push('Shipping Pincode must be exactly 6 digits');
      }

      errors.push(...this.validateAccountNumbers());
      return errors;
    },

    // NEW: wrapper that shows confirm popup instead of native confirm()
    onSaveClick() {
      const requiredErrors = this.validateRequired();
      if (requiredErrors.length) {
        this.openDlg('error', 'Please fix the following', requiredErrors);
        return;
      }
      this.openDlg('confirm', 'Save Changes?', 'Are you sure you want to update this client?', this.submitSave);
    },

    // unchanged submit logic, but success/error go to popup instead of alert()
    async submitSave() {
      try {
        this.loading = true;
        const payload = { client: this.customer, pk: this.pk };
        const res = await axios.post(
          process.env.VUE_APP_AGENCY_BACKEND_URL + 'updateClientDetail',
          payload,
          { timeout: 15000 }
        );

        this.openDlg('success', 'Updated', res?.data?.message || 'Client updated successfully!');
        this.original = this._deepClone(this.customer);
        this.$emit('updated', res?.data);
        this.$emit('saved', res?.data || res);
      } catch (err) {
        console.error('Update failed', err);
        const msg = err?.response?.data?.message || err.message || 'Failed to update client. Please try again.';
        this.openDlg('error', 'Update Failed', msg);
        this.$emit('error', err);
      } finally {
        this.loading = false;
      }
    },

    // unchanged behavior
    onCancel() {
      if (this.original) this.customer = this._deepClone(this.original);
    }
  }
};
</script>


<style scoped>
.banking-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 6px;
}

.toggle-btn {
  border: 1px solid #dadde2;
  background: #f8fafc;
  padding: 6px 12px;
  border-radius: 8px;
  font-size: 13px;
  cursor: pointer;
}
.toggle-btn:hover { background: #eef2f7; }

/* Smooth show/hide */
.fade-slide-enter-active,
.fade-slide-leave-active { transition: all .18s ease; }
.fade-slide-enter-from,
.fade-slide-leave-to { opacity: 0; transform: translateY(-4px); }

/* Reuse the exact same styles as Add form so nothing breaks visually */
.add-customer-form {
  max-width: 99%;
  margin: 0 auto;
  margin-top: 9px;
  margin-bottom: 9px;
  font-family: 'Inter', Arial, sans-serif;
  background: #fff;
  border-radius: 8px;
  padding: 18px 24px;
  box-shadow: 0 2px 12px #0001;
}
.section {
  margin-bottom: 24px;
}
.row {
  margin-top: 30px;
  display: flex;
  gap: 24px;
}
.form-image-upload {
  width: 180px;
  text-align: center;
}
.image-placeholder {
  width: 90px;
  height: 90px;
  background: #F3F4F6;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  margin: 0 auto 10px;
  font-size: 28px;
  color: #aa53cb;
}
.form-image-upload img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.form-image-upload button {
  margin-top: 8px;
  background: #aa53cb;
  color: #fff;
  border: none;
  padding: 4px 16px;
  border-radius: 5px;
  cursor: pointer;
}
.form-image-upload .note {
  font-size: 12px;
  color: #888;
  margin-top: 4px;
}
.form-fields {
  flex: 1;
}
.fields-row {
  display: flex;
  gap: 16px;
  margin-bottom: 8px;
}
.fields-row input,
.fields-row select {
  flex: 1;
  padding: 8px;
  border-radius: 5px;
  border: 1px solid #e4e7ec;
  font-size: 15px;
  background: #f8fafc;
}
input,
select {
  margin-bottom: 12px;
  width: 100%;
  box-sizing: border-box;
  padding: 8px;
  border-radius: 5px;
  border: 1px solid #e4e7ec;
  font-size: 15px;
  background: #f8fafc;
}
.addresses {
  display: flex;
  gap: 32px;
  margin-top: 18px;
}
.address-col {
  flex: 1;
  border-top: 1px solid #eee;
  padding-top: 12px;
  min-width: 320px;
}
.address-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.address-header h3 {
  margin: 0;
}
.address-header a {
  font-size: 13px;
  color: #aa53cb;
  cursor: pointer;
  text-decoration: none;
}
.cancel-btn {
  background: #777;
  color: #fff;
  border: none;
  padding: 8px 18px;
  border-radius: 5px;
  cursor: pointer;
  transition: background 0.3s ease;
}
.cancel-btn:hover {
  background: #555;
}
.create-btn {
  background: #aa53cb;
  color: #fff;
  border: none;
  padding: 8px 18px;
  border-radius: 5px;
  cursor: pointer;
  transition: background 0.3s ease;
}
.create-btn:hover {
  background: #8e3fb5;
}
label {
  display: flex;
  flex-direction: column;
  font-weight: 600;
  font-size: 13px;
  margin-bottom: 4px;
  color: #555;
}
.fields-row label,
.banking-fields-row label {
  flex: 1; /* keep inputs even width side by side */
}
.fields-row label input,
.fields-row label select,
.banking-fields-row label input,
.banking-fields-row label select {
  margin-top: 3px; /* small gap from label text */
}
/* Your existing styles preserved */
.add-customer-form {
  max-width: 99%;
  margin: 0 auto;
  margin-top: 9px;
  margin-bottom: 9px;
  font-family: 'Inter', Arial, sans-serif;
  background: #fff;
  border-radius: 8px;
  padding: 18px 24px;
  box-shadow: 0 2px 12px #0001;
}
.section { margin-bottom: 24px; }
.row { margin-top: 30px; display: flex; gap: 24px; }
.form-fields { flex: 1; }
.fields-row { display: flex; gap: 16px; margin-bottom: 8px; }
.fields-row input, .fields-row select {
  flex: 1; padding: 8px; border-radius: 5px; border: 1px solid #e4e7ec; font-size: 15px; background: #f8fafc;
}
input, select {
  margin-bottom: 12px; width: 100%; box-sizing: border-box; padding: 8px; border-radius: 5px; border: 1px solid #e4e7ec; font-size: 15px; background: #f8fafc;
}
.addresses { display: flex; gap: 32px; margin-top: 18px; }
.address-col { flex: 1; border-top: 1px solid #eee; padding-top: 12px; min-width: 320px; }
.address-header { display: flex; justify-content: space-between; align-items: center; }

/* --- Minimal popup styles (non-breaking) --- */
.dlg-overlay {
  position: fixed; inset: 0;
  background: rgba(0,0,0,0.45);
  display: flex; align-items: center; justify-content: center;
  z-index: 9999;
}
.dlg {
  width: min(520px, 92vw);
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 10px 40px rgba(0,0,0,0.25);
  overflow: hidden;
  font-family: system-ui, -apple-system, Segoe UI, Roboto, Arial;
}
.dlg-header { display: flex; align-items: center; justify-content: space-between; padding: 12px 16px; color: #fff; }
.dlg-success { background: #2e7d32; }
.dlg-error   { background: #c62828; }
.dlg-confirm { background: #1565c0; }
.dlg-info    { background: #6d4c41; }
.dlg-close { background: transparent; border: 0; color: #fff; font-size: 22px; line-height: 1; cursor: pointer; }
.dlg-body { padding: 16px; color: #333; }
.dlg-actions { display: flex; justify-content: flex-end; gap: 10px; padding: 12px 16px; background: #fafafa; }
.dlg-list { margin: 0; padding-left: 18px; }
.btn { border: 1px solid #ddd; background: #fff; padding: 8px 14px; border-radius: 8px; cursor: pointer; }
.btn.primary { background: #1976d2; border-color: #1976d2; color: #fff; }
.create-btn {
  background: #aa53cb; color: #fff; border: none; padding: 8px 18px; border-radius: 5px; cursor: pointer; transition: background 0.3s ease;
}
.create-btn:hover { background: #8e3fb5; }
</style>
