<template>
  <div class="edit-employee">
    <v-form ref="form" v-model="valid" lazy-validation>
      <v-row>
        <v-col cols="12" sm="6">
          <v-text-field v-model="form.employeeName" label="Name" :rules="[r => !!r || 'Name required']" required />
        </v-col>

        <v-col cols="12" sm="6">
          <v-text-field v-model="form.email" label="Email" :rules="[r => !r || /.+@.+\..+/.test(r) || 'Invalid email']" />
        </v-col>

        <v-col cols="12" sm="4">
          <v-text-field v-model="form.phone" label="Phone" />
        </v-col>

        <v-col cols="12" sm="4">
          <v-text-field v-model="form.venderId" label="Vender ID" />
        </v-col>

        <v-col cols="12" sm="4">
          <v-text-field v-model="form.userId" label="User ID" />
        </v-col>

        <v-col cols="12" sm="4">
          <v-text-field v-model="form.department" label="Department" />
        </v-col>

        <v-col cols="12" sm="4">
          <v-text-field v-model="form.employeeRole" label="Role" />
        </v-col>
      </v-row>

      <v-divider class="my-3" />

      <!-- Addresses -->
      <v-row>
        <v-col cols="12" md="6">
          <div class="address-block">
            <div class="address-header">
              <h4>Current Address</h4>
            </div>

            <v-text-field v-model="form.currentAddress.employeeName" label="Name" />
            <v-text-field v-model="form.currentAddress.line1" label="Line 1" />
            <v-text-field v-model="form.currentAddress.line2" label="Line 2" />
            <v-text-field v-model="form.currentAddress.city" label="City" />
            <v-text-field v-model="form.currentAddress.tahsil" label="Tahsil" />
            <v-text-field v-model="form.currentAddress.state" label="State" />
            <v-text-field v-model="form.currentAddress.pincode" label="Pincode" />
            <v-text-field v-model="form.currentAddress.country" label="Country" />
          </div>
        </v-col>

        <v-col cols="12" md="6">
          <div class="address-block">
            <div class="address-header" style="display:flex; justify-content:space-between; align-items:center;">
              <h4>Permanent Address</h4>
              <v-btn text small @click="copyCurrentToPermanent">Copy From Current</v-btn>
            </div>

            <v-text-field v-model="form.permanentAddress.employeeName" label="Name" />
            <v-text-field v-model="form.permanentAddress.line1" label="Line 1" />
            <v-text-field v-model="form.permanentAddress.line2" label="Line 2" />
            <v-text-field v-model="form.permanentAddress.city" label="City" />
            <v-text-field v-model="form.permanentAddress.tahsil" label="Tahsil" />
            <v-text-field v-model="form.permanentAddress.state" label="State" />
            <v-text-field v-model="form.permanentAddress.pincode" label="Pincode" />
            <v-text-field v-model="form.permanentAddress.country" label="Country" />
          </div>
        </v-col>
      </v-row>

      <v-divider class="my-3" />

      <!-- Bank -->
      <v-row>
        <v-col cols="12" md="4">
          <v-text-field v-model="form.bank.bankName" label="Bank Name" />
        </v-col>
        <v-col cols="12" md="4">
          <v-text-field v-model="form.bank.branch" label="Branch" />
        </v-col>
        <v-col cols="12" md="4">
          <v-text-field v-model="form.bank.ifsc" label="IFSC" />
        </v-col>

        <v-col cols="12" md="6">
          <v-text-field v-model="form.bank.accountHolder" label="Account Holder" />
        </v-col>
        <v-col cols="12" md="6">
          <v-text-field v-model="form.bank.accountNumber" label="Account Number" />
        </v-col>
      </v-row>

      <v-divider class="my-3" />

      <!-- Permissions (simple toggles) -->
      <div class="mb-2"><strong>Permissions</strong></div>
      <v-row>
        <v-col cols="12" md="6">
          <v-switch v-model="form.userPermissions.add" label="Add" />
          <v-switch v-model="form.userPermissions.edit" label="Edit" />
          <v-switch v-model="form.userPermissions.delete" label="Delete" />
        </v-col>
        <v-col cols="12" md="6">
          <v-switch v-model="form.userPermissions.download" label="Download" />
          <v-switch v-model="form.userPermissions.sales" label="Sales" />
          <v-switch v-model="form.userPermissions.rto" label="RTO" />
        </v-col>
      </v-row>

      <v-row class="mt-4">
        <v-col cols="12" class="text-right">
          <v-btn text @click="onCancel">Cancel</v-btn>
          <v-btn color="primary" :loading="saving" @click="onSave" :disabled="saving">
            Save
          </v-btn>
        </v-col>
      </v-row>

      <v-alert v-if="error" dense type="error" class="mt-2">{{ errorMessage }}</v-alert>
    </v-form>
  </div>
</template>

<script>
import axios from 'axios';

export default {
  employeeName: 'EditEmployee',
  props: {
    // either pass full employee object OR pass pk (employee id)
    employee: {
      type: Object,
      default: null
    },
    pk: {
      type: String,
      default: null
    }
  },
  data() {
    return {
      form: {
        employeeName: '',
        email: '',
        phone: '',
        venderId: '',
        userId: '',
        department: '',
        employeeRole: '',
        currentAddress: {
          employeeName: '', line1: '', line2: '', tahsil: '', city: '', state: '', pincode: '', country: ''
        },
        permanentAddress: {
          employeeName: '', line1: '', line2: '', tahsil: '', city: '', state: '', pincode: '', country: ''
        },
        bank: { bankName: '', branch: '', accountHolder: '', accountNumber: '', ifsc: '' },
        userPermissions: {}
      },
      loading: false,
      saving: false,
      valid: false,
      error: null
    };
  },
  computed: {
    errorMessage() {
      if (!this.error) return '';
      if (this.error.response && this.error.response.data) return JSON.stringify(this.error.response.data);
      return this.error.message || String(this.error);
    }
  },
  watch: {
    // if parent passes employee prop, populate form immediately
    employee: {
      immediate: true,
      handler(val) {
        if (val) this.populateForm(val);
      }
    },
    // if parent passes pk only, load data
    pk: {
      immediate: true,
      handler(val) {
        if (val && !this.employee) this.loadByPk(val);
      }
    }
  },
  methods: {
    _deepClone(obj) {
      return JSON.parse(JSON.stringify(obj || {}));
    },

    populateForm(emp) {
      // defensive mapping from incoming employee object to our form
      this.form.employeeName = emp.employeeName || '';
      this.form.email = emp.email || '';
      this.form.phone = emp.phone || '';
      this.form.venderId = emp.venderId || '';
      this.form.userId = emp.userId || '';
      this.form.department = emp.department || '';
      this.form.employeeRole = emp.employeeRole || '';

      this.form.currentAddress = this._deepClone(emp.currentAddress || {});
      this.form.permanentAddress = this._deepClone(emp.permanentAddress || {});
      this.form.bank = this._deepClone(emp.bank || { bankName:'', branch:'', accountHolder:'', accountNumber:'', ifsc:'' });
      this.form.userPermissions = this._deepClone(emp.userPermissions || {});
    },

    async loadByPk(pk) {
      this.loading = true;
      this.error = null;
      try {
        const id = pk.startsWith('employee#') ? pk.split('#')[1] : pk;
        const res = await axios.get(process.env.VUE_APP_AGENCY_BACKEND_URL+`getEmployeeByPk/${id}`, { timeout: 10000 });
        const d = res && res.data ? res.data : null;
        // common shape: { item: {...} } or direct object
        const emp = (d && d.item) ? d.item : (d && d.employee) ? d.employee : d;
        if (emp) this.populateForm(emp);
      } catch (err) {
        console.error('Failed to load employee by pk', err);
        this.error = err;
      } finally {
        this.loading = false;
      }
    },

    copyCurrentToPermanent() {
      this.form.permanentAddress = this._deepClone(this.form.currentAddress);
    },

    onCancel() {
      this.$emit('cancel');
    },

    async onSave() {
      // basic validation
      if (!this.form.employeeName || !this.form.userId) {
        alert('Please provide Name and User ID');
        return;
      }

      if (!confirm('Save changes to this employee?')) return;

      this.saving = true;
      this.error = null;
      try {
        // build payload; include pk for server to locate item
        const pkToSend = this.pk || (this.employee && (this.employee.pk || this.employee.userId)) || this.form.userId;
        const payload = { employee: this._deepClone(this.form), pk: pkToSend };

        // send to your update endpoint - adjust if your API differs
        const res = await axios.post(process.env.VUE_APP_AGENCY_BACKEND_URL+'updateEmployeeDetail', payload, { timeout: 15000 });

        this.$emit('saved', res && res.data ? res.data : res);
      } catch (err) {
        console.error('Failed to save employee', err);
        this.error = err;
        this.$emit('error', err);
      } finally {
        this.saving = false;
      }
    }
  }
};
</script>

<style scoped>
.edit-employee { padding: 12px; }
.address-block { border-top: 1px solid #eee; padding-top: 8px; }
.address-header h4 { margin: 0 0 8px 0; }
</style>
