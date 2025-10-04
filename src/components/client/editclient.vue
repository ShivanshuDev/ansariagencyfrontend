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
              <input type="text" v-model="customer.phone" required />
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
      <button type="button" class="create-btn" @click="onSave" :disabled="loading">
        <span v-if="!loading">Save Changes</span>
        <span v-else>Saving...</span>
      </button>
    </div>
  </div>
</template>

<script>
import axios from 'axios';

export default {
  name: 'EditClient',
  props: {
    pk: {
      type: String,
      required: true
    }
  },
  data() {
    return {
      loading: false,
      original: null, // deep copy of fetched data for reset
      customer: {
        // same structure as add form
        clientId: '',
        name: '',
        email: '',
        phone: '',
        altphone: '',
        billing: {
          name: '',
          line1: '',
          line2: '',
          tahsil: '',
          country: '',
          state: '',
          city: '',
          pincode: ''
        },
        shipping: {
          name: '',
          line1: '',
          line2: '',
          tahsil: '',
          country: '',
          state: '',
          city: '',
          pincode: ''
        },
        bank: {
          bankName: '',
          branch: '',
          accountHolder: '',
          accountNumber: '',
          confirmAccountNumber: '',
          ifsc: ''
        }
      }
    };
  },
  watch: {
    pk: {
      immediate: true,
      handler(newPk) {
        if (newPk) this.fetchClient(newPk);
      }
    }
  },
  mounted(){
    let pk = this.$props.pk;
    this.fetchClient(pk);
  },
  methods: {
    _deepClone(obj) {
      return JSON.parse(JSON.stringify(obj || {}));
    },

    async fetchClient(pk) {
      this.loading = true;
      try {
        const pkToUse = pk.includes("#") ? pk.split("#")[1] : pk;

        // Call endpoint - adjust path if your API is different
        const res = await axios.get(process.env.VUE_APP_AGENCY_BACKEND_URL+`getClientByPk/${pkToUse}`, { timeout: 10000 });
        console.log('res 0000000000000000000000000', res.data)
        const d = res && res.data ? res.data : null;

        // Defensive: find client object in response
        // Common shapes: { client: {...} } or { data: {...} } or {...}
        let clientObj = null;
        if (!d) clientObj = null;
        else if (d.client) clientObj = d.client;
        else if (d.data) clientObj = d.data;
        else clientObj = d.item;

        // Normalize incoming fields to our form structure:
        const mapped = {
          clientId: clientObj.clientId || clientObj.pk || clientObj.userId || clientObj.clientId || '',
          name: clientObj.name || clientObj.fullName || '',
          email: clientObj.email || clientObj.userEmail || '',
          phone: clientObj.phone || clientObj.mobile || '',
          altphone: clientObj.altphone || clientObj.altPhone || '',
          billing: {
            name: (clientObj.billing && clientObj.billing.name) || '',
            line1: (clientObj.billing && clientObj.billing.line1) || '',
            line2: (clientObj.billing && clientObj.billing.line2) || '',
            tahsil: (clientObj.billing && (clientObj.billing.tahsil || clientObj.billing.tahsilName)) || '',
            country: (clientObj.billing && clientObj.billing.country) || '',
            state: (clientObj.billing && clientObj.billing.state) || '',
            city: (clientObj.billing && clientObj.billing.city) || '',
            pincode: (clientObj.billing && clientObj.billing.pincode) || ''
          },
          shipping: {
            name: (clientObj.shipping && clientObj.shipping.name) || '',
            line1: (clientObj.shipping && clientObj.shipping.line1) || '',
            line2: (clientObj.shipping && clientObj.shipping.line2) || '',
            tahsil: (clientObj.shipping && clientObj.shipping.tahsil) || '',
            country: (clientObj.shipping && clientObj.shipping.country) || '',
            state: (clientObj.shipping && clientObj.shipping.state) || '',
            city: (clientObj.shipping && clientObj.shipping.city) || '',
            pincode: (clientObj.shipping && clientObj.shipping.pincode) || ''
          },
          bank: {
            bankName: (clientObj.bank && clientObj.bank.bankName) || '',
            branch: (clientObj.bank && clientObj.bank.branch) || '',
            accountHolder: (clientObj.bank && clientObj.bank.accountHolder) || '',
            accountNumber: (clientObj.bank && clientObj.bank.accountNumber) || '',
            confirmAccountNumber: (clientObj.bank && clientObj.bank.accountNumber) || '',
            ifsc: (clientObj.bank && clientObj.bank.ifsc) || ''
          }
        };

        // set form and keep original for cancel/reset
        this.customer = this._deepClone(mapped);
        this.original = this._deepClone(mapped);
      } catch (err) {
        console.error('Failed to fetch client by pk', err);
        this.$emit('error', err);
      } finally {
        this.loading = false;
      }
    },

    copyBilling() {
      this.customer.shipping = this._deepClone(this.customer.billing);
    },

    validateAccountNumbers() {
      const bank = this.customer.bank;
      if (!bank.accountNumber || !bank.confirmAccountNumber) {
        alert('Please enter and confirm your account number.');
        return false;
      }
      if (bank.accountNumber !== bank.confirmAccountNumber) {
        alert('Account numbers do not match. Please check and try again.');
        return false;
      }
      return true;
    },

    validateRequired() {
      const errors = [];
      if (!this.customer.clientId || !this.customer.clientId.trim()) errors.push('Client Id is required');
      if (!this.customer.name || !this.customer.name.trim()) errors.push('Name is required');
      if (!this.customer.email || !this.customer.email.trim()) errors.push('Email is required');
      if (!this.customer.phone || !this.customer.phone.trim()) errors.push('Phone is required');

      const email = (this.customer.email || '').toString().trim();
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (this.customer.email && !emailRegex.test(email)) errors.push('Invalid email format');

      return errors;
    },

    onCancel() {
      if (!this.original) {
        // nothing fetched: just reset empty
        this.customer = {
          clientId: '',
          name: '',
          email: '',
          phone: '',
          altphone: '',
          billing: { name: '', line1: '', line2: '', tahsil: '', country: '', state: '', city: '', pincode: '' },
          shipping: { name: '', line1: '', line2: '', tahsil: '', country: '', state: '', city: '', pincode: '' },
          bank: { bankName: '', branch: '', accountHolder: '', accountNumber: '', confirmAccountNumber: '', ifsc: '' }
        };
        return;
      }

      // restore original fetched values
      this.customer = this._deepClone(this.original);
    },

    async onSave() {
      // validate required
      const requiredErrors = this.validateRequired();
      if (requiredErrors.length) {
        alert('Please fix:\n- ' + requiredErrors.join('\n- '));
        return;
      }

      // validate account numbers
      if (!this.validateAccountNumbers()) return;

      if (!confirm('Save changes to this client?')) return;

      try {
        this.loading = true;
        const payload = { client: this.customer, pk: this.pk };

        // NOTE: change endpoint or method if your backend expects PUT or different url
        const res = await axios.post(process.env.VUE_APP_AGENCY_BACKEND_URL+'updateClientDetail', payload, { timeout: 15000 });
        console.log('res &*&*&*&*&*&', res.data)
        // success
        alert('Client updated successfully!');
        this.original = this._deepClone(this.customer);
        this.$emit('updated', res.data);
        this.$emit('saved', res && res.data ? res.data : res);
      } catch (err) {
        console.error('Update failed', err);
        alert('Failed to update client. Please try again.');
        this.$emit('error', err);
      } finally {
        this.loading = false;
      }
    }
  }
};
</script>

<style scoped>
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
</style>
