<template>
  <div class="add-customer-form">
    <h2>Add Client</h2>

    <section class="section">
      <h3>Basic Details</h3>
      <div class="row">
        <div class="form-fields">
          <div class="fields-row">
            <label>
              Client Id *
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
              <input type="text" v-model="customer.phone" required />
            </label>
            <label>
              Alternate Phone Number *
              <input type="text" v-model="customer.altphone" required />
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
            <input type="text" v-model="customer.billing.pincode" />
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
            <input type="text" v-model="customer.shipping.pincode" />
          </label>
        </div>
      </div>
    </section>

    <section class="banking-details-section">
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
    </section>

    <div class="banking-actions">
      <button type="button" class="cancel-btn" @click="onCancel">Cancel</button>
      <!-- openDialog will validate then open the confirm dialog -->
      <button type="button" class="create-btn" @click="openDialog" :disabled="loading">
        <span v-if="loading">Processing…</span>
        <span v-else>Create New</span>
      </button>
    </div>

    <!-- Confirmation dialog -->
    <v-dialog v-model="dialog" max-width="520">
      <v-card>
        <v-card-title class="headline">Add Client Confirmation</v-card-title>
        <v-card-text>
          <div>
            Are you sure you want to create this client?
          </div>

          <!-- show form summary (optional helpful) -->
          <div class="mt-3">
            <strong>{{ customer.name || customer.clientId }}</strong>
            <div class="caption">{{ customer.email }}</div>
          </div>

          <div v-if="dialogError" style="color: red; margin-top: 12px;">
            {{ dialogError }}
          </div>
        </v-card-text>

        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn text @click="onCancel" :disabled="confirmLoading">Cancel</v-btn>
          <v-btn color="primary" @click="onCreate" :loading="confirmLoading" :disabled="confirmLoading">
            Confirm
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Top-right snackbar -->
    <v-snackbar v-model="snackbar.visible" :timeout="3500" top right multi-line :color="snackbar.color">
      {{ snackbar.message }}
      <template v-slot:action>
        <v-btn text @click="snackbar.visible = false">Close</v-btn>
      </template>
    </v-snackbar>
  </div>
</template>

<script>
import axios from 'axios';

export default {
  data() {
    return {
      loading: false,         // general page-level loading (create button)
      confirmLoading: false,  // confirm button loading in dialog
      dialog: false,
      dialogError: '',
      snackbar: { visible: false, message: '', color: 'success' },

      customer: this.emptyCustomer()
    };
  },

  methods: {
    // return a fresh customer object (keeps reset centralized)
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

    // copy billing to shipping
    copyBilling() {
      this.customer.shipping = { ...this.customer.billing };
    },

    // cancel / close dialog
    onCancel() {
      this.dialog = false;
      this.dialogError = '';
      // if in confirm step, leave form as-is; Cancel should not clear
    },

    // validations (kept your original logic, slightly tightened)
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
      if (!c.clientId || !c.clientId.toString().trim()) {
        this.dialogError = 'Client Id is required.';
        return false;
      }
      if (!c.name || !c.name.toString().trim()) {
        this.dialogError = 'Name is required.';
        return false;
      }
      if (!c.email || !c.email.toString().trim()) {
        this.dialogError = 'Email is required.';
        return false;
      }
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(c.email)) {
        this.dialogError = 'Please enter a valid email address.';
        return false;
      }
      if (!c.phone || !c.phone.toString().trim()) {
        this.dialogError = 'Phone Number is required.';
        return false;
      }
      if (!c.altphone || !c.altphone.toString().trim()) {
        this.dialogError = 'Alternate Phone Number is required.';
        return false;
      }

      // billing
      if (!c.billing.name || !c.billing.name.toString().trim()) {
        this.dialogError = 'Billing Address Name is required.';
        return false;
      }
      if (!c.billing.line1 || !c.billing.line1.toString().trim()) {
        this.dialogError = 'Billing Address Line 1 is required.';
        return false;
      }
      if (!c.billing.tahsil || !c.billing.tahsil.toString().trim()) {
        this.dialogError = 'Billing Tahsil is required.';
        return false;
      }
      if (!c.billing.country || !c.billing.country.toString().trim()) {
        this.dialogError = 'Billing Country is required.';
        return false;
      }
      if (!c.billing.state || !c.billing.state.toString().trim()) {
        this.dialogError = 'Billing State is required.';
        return false;
      }
      if (!c.billing.city || !c.billing.city.toString().trim()) {
        this.dialogError = 'Billing City is required.';
        return false;
      }
      if (!c.billing.pincode || !c.billing.pincode.toString().trim()) {
        this.dialogError = 'Billing Pincode is required.';
        return false;
      }

      // shipping
      if (!c.shipping.name || !c.shipping.name.toString().trim()) {
        this.dialogError = 'Shipping Address Name is required.';
        return false;
      }
      if (!c.shipping.line1 || !c.shipping.line1.toString().trim()) {
        this.dialogError = 'Shipping Address Line 1 is required.';
        return false;
      }
      if (!c.shipping.tahsil || !c.shipping.tahsil.toString().trim()) {
        this.dialogError = 'Shipping Tahsil is required.';
        return false;
      }
      if (!c.shipping.country || !c.shipping.country.toString().trim()) {
        this.dialogError = 'Shipping Country is required.';
        return false;
      }
      if (!c.shipping.state || !c.shipping.state.toString().trim()) {
        this.dialogError = 'Shipping State is required.';
        return false;
      }
      if (!c.shipping.city || !c.shipping.city.toString().trim()) {
        this.dialogError = 'Shipping City is required.';
        return false;
      }
      if (!c.shipping.pincode || !c.shipping.pincode.toString().trim()) {
        this.dialogError = 'Shipping Pincode is required.';
        return false;
      }

      // bank validations
      if (!this.validateAccountNumbers()) {
        return false;
      }

      this.dialogError = '';
      return true;
    },

    // invoked when Create New button clicked
    openDialog() {
      // validate and open
      if (this.validateForm()) {
        this.dialogError = '';
        this.dialog = true;
      }
    },

    // clear the form to fresh state
    clearForm() {
      this.customer = this.emptyCustomer();
    },

    // show success snackbar top-right
    showSuccess(message = 'Client added successfully') {
      this.snackbar.message = message;
      this.snackbar.color = 'success';
      this.snackbar.visible = true;
    },

    // the Confirm action — create client
    async onCreate() {
      // double-check validate before submitting
      if (!this.validateForm()) return;

      this.dialogError = '';
      this.confirmLoading = true;

      try {
        // construct payload exactly how backend expects; here we send the customer object directly
        const payload = { customer: this.customer };

        // adjust URL to your backend route; using env variable as before
        const url = (process.env.VUE_APP_AGENCY_BACKEND_URL || '') + 'addClient';

        const res = await axios.post(url, payload);

        // success: close dialog, clear form, show top-right snackbar
        this.dialog = false;
        this.clearForm();
        this.showSuccess(res?.data?.message || 'Client added successfully');

      } catch (err) {
        console.error('add client failed', err);

        // show a helpful message inside dialog (not the snackbar)
        const serverMsg = err?.response?.data?.message || err?.message || 'Failed to create client. Please try again.';
        this.dialogError = serverMsg;

      } finally {
        this.confirmLoading = false;
      }
    }
  }
};
</script>

<style scoped>
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

/* small responsive tweak */
@media (max-width: 900px) {
  .fields-row { flex-direction: column; }
  .addresses { flex-direction: column; }
}
</style>
