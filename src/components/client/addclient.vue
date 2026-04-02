<template>
  <div class="add-customer-form">
    <h2>Add Vendor</h2>

    <section class="section">
      <h3>Basic Details</h3>
      <div class="row">
        <div class="form-fields">
          <div class="fields-row">
            <label>
              Vendor Id *
              <input type="text" v-model="customer.clientId" required />
            </label>
            <label>
              Name *
              <input type="text" v-model="customer.name" required />
            </label>
            <label>
              Email *
              <input type="email" v-model="customer.email" required />
            </label>
          </div>
          <div class="fields-row">
            <label>
              GSTIN *
              <input type="text" v-model="customer.gstin" required />
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
                placeholder="Phone number"
              />
            </label>
            <label>
              Alternate Phone Number *
              <input
                type="text"
                v-model="customer.altphone"
                required
                inputmode="numeric"
                maxlength="10"
                @input="customer.altphone = onlyDigits(customer.altphone, 10)"
                placeholder="Phone number"
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
              placeholder="Pin code"
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
          Address Name
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
              placeholder="Pincode"
            />
          </label>
        </div>
      </div>
    </section>

    <section class="banking-details-section">
      <div>
        <div
          style="display: flex; align-items: center; cursor: pointer;"
          @click="showBankDetails = !showBankDetails"
        >
          <h3 style="margin: 0;">Banking Details</h3>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
          <v-icon style="width:30px; height:30px; border:1px solid green; border-radius:50%; background-color:green; color:white;">
            {{ showBankDetails ? 'mdi-chevron-up' : 'mdi-chevron-down' }}
          </v-icon>
        </div>

        <div v-show="showBankDetails" style="margin-top: 10px;">
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
      </div>
    </section>

    <div style="display:flex; flex-direction:row; justify-content:right; align-items:right; width:100%;" class="banking-actions">
      <button type="button" class="cancel-btn" @click="onCancel">Cancel</button>&nbsp;&nbsp;&nbsp;&nbsp;
      <button type="button" class="create-btn" @click="onCreateClick" :disabled="loading || confirmLoading">
        <span v-if="loading || confirmLoading">Processing…</span>
        <span v-else>Create New</span>
      </button>
    </div>

    <!-- Custom Dialog (success / error / confirm / info) -->
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
          <div v-if="dialogError" style="color:#c62828; margin-top:10px;">{{ dialogError }}</div>
        </div>
        <div class="dlg-actions">
          <button v-if="dlg.type==='confirm'" class="btn" @click="onDlgCancel">Cancel</button>
          <button class="btn primary" @click="onDlgOk">
            {{ dlg.type==='confirm' ? 'Yes, Continue' : 'OK' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios';

export default {
  data() {
    return {
      showBankDetails: false,
      loading: false,
      confirmLoading: false,

      // old Vuetify confirm + snackbar are no longer used
      dialog: false,
      dialogError: '',
      snackbar: { visible: false, message: '', color: 'success' },

      // Custom dialog state
      dlg: {
        visible: false,
        type: 'info', // 'success' | 'error' | 'confirm' | 'info'
        title: '',
        message: '',
        onConfirm: null
      },

      customer: this.emptyCustomer()
    };
  },

  methods: {
    onlyDigits(val, maxLen) {
      return (val || '').replace(/\D/g, '').slice(0, maxLen);
    },

    emptyCustomer() {
      return {
        clientId: '',
        name: '',
        email: '',
        phone: '',
        gstin: '',
        altphone: '',
        billing: {
          name: '',
          line1: '',
          line2: '',
          country: 'INDIA',
          state: '',
          city: '',
          pincode: '',
          tahsil: ''
        },
        shipping: {
          name: '',
          line1: '',
          line2: '',
          country: 'INDIA',
          state: '',
          city: '',
          pincode: '',
          tahsil: ''
        },
        bank: {
          bankName: '',
          branch: '',
          accountHolder: '',
          accountNumber: '',
          confirmAccountNumber: '',
          ifsc: ''
        }
      };
    },

    copyBilling() {
      this.customer.shipping = { ...this.customer.billing };
    },

    onCancel() {
      // just closes any open dialogs / clears inline error
      this.dialogError = '';
      this.closeDlg();
    },

    // Open our custom dialog
    openDlg(type, title, message, onConfirm = null) {
      this.dlg.visible = true;
      this.dlg.type = type;
      this.dlg.title = title;
      this.dlg.message = message;
      this.dlg.onConfirm = typeof onConfirm === 'function' ? onConfirm : null;
    },
    closeDlg() {
      this.dlg.visible = false;
      this.dlg.onConfirm = null;
    },
    onDlgCancel() {
      this.closeDlg();
    },
    onDlgOk() {
      const fn = this.dlg.onConfirm;
      this.closeDlg();
      if (fn) fn();
    },

    validateAccountNumbers() {
      const bank = this.customer.bank;
      if (bank.accountNumber !== '') {
        if (
          !bank.bankName ||
          !bank.branch ||
          !bank.accountHolder ||
          !bank.accountNumber ||
          !bank.confirmAccountNumber ||
          !bank.ifsc
        ) {
          this.dialogError = 'Please fill all bank details when providing Account Number.';
          return false;
        }
        if (bank.accountNumber !== bank.confirmAccountNumber) {
          this.dialogError = 'Account numbers do not match. Please check and try again.';
          return false;
        }
      }
      return true;
    },

    validateForm() {
      const c = this.customer;
      // required basics
      if (!c.clientId?.toString().trim()) {
        this.dialogError = 'Vendor Id is required.';
        return false;
      }
      if (!c.name?.toString().trim()) {
        this.dialogError = 'Name is required.';
        return false;
      }
      if (!c.email?.toString().trim()) {
        this.dialogError = 'Email is required.';
        return false;
      }
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(c.email)) {
        this.dialogError = 'Please enter a valid email address.';
        return false;
      }

      if (!c.phone?.toString().trim()) {
        this.dialogError = 'Phone Number is required.';
        return false;
      }
      if (!c.altphone?.toString().trim()) {
        this.dialogError = 'Alternate Phone Number is required.';
        return false;
      }

      const tenDigit = /^\d{10}$/;
      if (!tenDigit.test(c.phone)) {
        this.dialogError = 'Phone Number must be exactly 10 digits.';
        return false;
      }
      if (!tenDigit.test(c.altphone)) {
        this.dialogError = 'Alternate Phone Number must be exactly 10 digits.';
        return false;
      }

      // billing required
      if (!c.billing.name?.toString().trim()) {
        this.dialogError = 'Billing Address Name is required.';
        return false;
      }
      if (!c.billing.line1?.toString().trim()) {
        this.dialogError = 'Billing Address Line 1 is required.';
        return false;
      }
      if (!c.billing.tahsil?.toString().trim()) {
        this.dialogError = 'Billing Tahsil is required.';
        return false;
      }
      if (!c.billing.country?.toString().trim()) {
        this.dialogError = 'Billing Country is required.';
        return false;
      }
      if (!c.billing.state?.toString().trim()) {
        this.dialogError = 'Billing State is required.';
        return false;
      }
      if (!c.billing.city?.toString().trim()) {
        this.dialogError = 'Billing City is required.';
        return false;
      }
      if (!c.billing.pincode?.toString().trim()) {
        this.dialogError = 'Billing Pincode is required.';
        return false;
      }

      const sixDigit = /^\d{6}$/;
      if (!sixDigit.test(c.billing.pincode)) {
        this.dialogError = 'Billing Pincode must be exactly 6 digits.';
        return false;
      }

      // shipping required
      if (!c.shipping.name?.toString().trim()) {
        this.dialogError = 'Shipping Address Name is required.';
        return false;
      }
      if (!c.shipping.line1?.toString().trim()) {
        this.dialogError = 'Shipping Address Line 1 is required.';
        return false;
      }
      if (!c.shipping.tahsil?.toString().trim()) {
        this.dialogError = 'Shipping Tahsil is required.';
        return false;
      }
      if (!c.shipping.country?.toString().trim()) {
        this.dialogError = 'Shipping Country is required.';
        return false;
      }
      if (!c.shipping.state?.toString().trim()) {
        this.dialogError = 'Shipping State is required.';
        return false;
      }
      if (!c.shipping.city?.toString().trim()) {
        this.dialogError = 'Shipping City is required.';
        return false;
      }
      if (!c.shipping.pincode?.toString().trim()) {
        this.dialogError = 'Shipping Pincode is required.';
        return false;
      }
      if (!sixDigit.test(c.shipping.pincode)) {
        this.dialogError = 'Shipping Pincode must be exactly 6 digits.';
        return false;
      }

      // bank conditional checks
      if (!this.validateAccountNumbers()) return false;

      this.dialogError = '';
      return true;
    },

    // Click of Create New → confirm popup
    onCreateClick() {
      if (!this.validateForm()) {
        // show error dialog with the current dialogError message
        this.openDlg('error', 'Validation Failed', this.dialogError || 'Please check your inputs.');
        return;
      }
      this.openDlg(
        'confirm',
        'Add Vendor?',
        'Are you sure you want to create this client record?',
        this.onCreate // run actual submit on confirm
      );
    },

    clearForm() {
      this.customer = this.emptyCustomer();
    },

    // Submit to API
    async onCreate() {
      this.dialogError = '';
      this.confirmLoading = true;

      try {
        const payload = { customer: this.customer };
        const url = (process.env.VUE_APP_AGENCY_BACKEND_URL || '') + 'addClient';
        const res = await axios.post(url, payload);

        // Success popup + clear form
        this.openDlg('success', 'Success', res?.data?.message || 'Vendor added successfully');
        this.clearForm();
      } catch (err) {
        console.error('add client failed', err);
        const serverMsg = err?.response?.data?.message || err?.message || 'Failed to create client. Please try again.';
        // Error popup
        this.openDlg('error', 'Submission Failed', serverMsg);
      } finally {
        this.confirmLoading = false;
      }
    }
  }
};
</script>


<style scoped>
/* Custom dialog styles (same as your other form for consistency) */
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
.dlg-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 12px 16px;
  color: #fff;
}
.dlg-success { background: #2e7d32; }
.dlg-error   { background: #c62828; }
.dlg-confirm { background: #1565c0; }
.dlg-info    { background: #6d4c41; }
.dlg-close {
  background: transparent; border: 0; color: #fff; font-size: 22px; line-height: 1; cursor: pointer;
}
.dlg-body { padding: 16px; color: #333; }
.dlg-actions {
  display: flex; justify-content: flex-end; gap: 10px; padding: 12px 16px; background: #fafafa;
}
.dlg-list { margin: 0; padding-left: 18px; }
.btn {
  border: 1px solid #ddd; background: #fff; padding: 8px 14px; border-radius: 8px; cursor: pointer;
}
.btn.primary {
  background: #001f3f; border-color: #001f3f; color: #fff;
}
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
  color: #283593;
}
.form-image-upload img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.form-image-upload button {
  margin-top: 8px;
  background: #283593;
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
  color: #283593;
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
  background: #283593;
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

/* small responsive tweak */
@media (max-width: 900px) {
  .fields-row { flex-direction: column; }
  .addresses { flex-direction: column; }
}
</style>
